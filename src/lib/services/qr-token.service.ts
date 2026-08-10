/**
 * QR Token Service
 * Handles HMAC validation, JWT generation, and replay prevention for QR orders
 */

import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

/**
 * Security: Fail-closed secret resolution.
 *
 * In production, missing secrets MUST cause an explicit error rather than
 * silently falling back to a predictable default.  A predictable default
 * would allow anyone who reads the source code to forge QR signatures and
 * JWT access tokens.
 *
 * In development / test, a fixed default is retained so local workflows
 * keep working without requiring every developer to set env vars, but a
 * console warning is emitted so the default is never mistaken for a real
 * secret.
 */
const isProduction = process.env.NODE_ENV === 'production'

function resolveSecret(envVar: string, devDefault: string, label: string): string {
  const value = process.env[envVar]
  if (value) return value
  if (isProduction) {
    throw new Error(
      `SECURITY FATAL: ${envVar} is not set in production. ` +
      `Refusing to use default ${label} secret. Set ${envVar} in the production environment.`
    )
  }
  console.warn(
    `⚠️  SECURITY WARNING: ${envVar} is not set. Using development default for ${label}. ` +
    `This MUST NOT be used in production.`
  )
  return devDefault
}

const QR_SECRET = resolveSecret('IMBONI_QR_SECRET', 'default-qr-secret-change-in-production', 'QR token')
const JWT_SECRET = resolveSecret('NEXTAUTH_SECRET', 'default-jwt-secret', 'JWT access token')
const TOKEN_TTL_MINUTES = 10;

export interface QRTokenClaims {
  jti: string;
  branchId: string;
  tableId?: string;
  source: 'QR_IN_VENUE' | 'QR_REMOTE';
  iat: number;
  exp: number;
}

/**
 * Validate HMAC signature from QR code URL
 */
export function validateQRSignature(
  branchId: string,
  tableId: string | undefined,
  version: string,
  signature: string
): boolean {
  const payload = tableId 
    ? `${branchId}|${tableId}|${version}`
    : `${branchId}|${version}`;
  
  const expectedSig = crypto
    .createHmac('sha256', QR_SECRET)
    .update(payload)
    .digest('hex');
  
  return signature === expectedSig;
}

/**
 * Generate HMAC signature for QR code
 */
export function generateQRSignature(
  branchId: string,
  tableId?: string,
  version: string = '1'
): string {
  const payload = tableId 
    ? `${branchId}|${tableId}|${version}`
    : `${branchId}|${version}`;
  
  return crypto
    .createHmac('sha256', QR_SECRET)
    .update(payload)
    .digest('hex');
}

/**
 * Generate short-lived JWT access token
 */
export async function generateAccessToken(
  branchId: string,
  source: 'QR_IN_VENUE' | 'QR_REMOTE',
  tableId?: string
): Promise<string> {
  const jti = crypto.randomBytes(16).toString('hex');
  const now = Math.floor(Date.now() / 1000);
  const exp = now + (TOKEN_TTL_MINUTES * 60);
  
  const claims: QRTokenClaims = {
    jti,
    branchId,
    tableId,
    source,
    iat: now,
    exp
  };
  
  // Store token in database for replay prevention
  await prisma.orderToken.create({
    data: {
      jti,
      branchId,
      tableId,
      source,
      used: false,
      expiresAt: new Date(exp * 1000)
    }
  });
  
  return jwt.sign(claims, JWT_SECRET);
}

/**
 * Validate JWT access token
 */
export async function validateAccessToken(
  token: string,
  requestBranchId: string
): Promise<QRTokenClaims> {
  // 1. Verify JWT signature
  let claims: QRTokenClaims;
  try {
    claims = jwt.verify(token, JWT_SECRET) as QRTokenClaims;
  } catch (error) {
    throw new Error('Invalid token signature');
  }
  
  // 2. Check expiration
  const now = Math.floor(Date.now() / 1000);
  if (claims.exp < now) {
    throw new Error('Token expired');
  }
  
  // 3. Check jti exists and not used
  const tokenRecord = await prisma.orderToken.findUnique({
    where: { jti: claims.jti }
  });
  
  if (!tokenRecord) {
    throw new Error('Token not found');
  }
  
  if (tokenRecord.used) {
    throw new Error('Token already used');
  }
  
  // 4. Check branch match
  if (claims.branchId !== requestBranchId) {
    throw new Error('Branch mismatch');
  }
  
  return claims;
}

/**
 * Mark token as used (one-time use enforcement)
 */
export async function markTokenUsed(jti: string): Promise<void> {
  await prisma.orderToken.update({
    where: { jti },
    data: {
      used: true,
      usedAt: new Date()
    }
  });
}

/**
 * Clean up expired tokens (run periodically)
 */
export async function cleanupExpiredTokens(): Promise<number> {
  const result = await prisma.orderToken.deleteMany({
    where: {
      expiresAt: {
        lt: new Date()
      }
    }
  });
  
  return result.count;
}
