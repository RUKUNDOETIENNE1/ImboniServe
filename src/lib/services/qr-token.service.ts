/**
 * QR Token Service
 * Handles HMAC validation, JWT generation, and replay prevention for QR orders
 */

import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const QR_SECRET = process.env.IMBONI_QR_SECRET || 'default-qr-secret-change-in-production';
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'default-jwt-secret';
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
