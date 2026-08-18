import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { listAllPolicies, updatePolicy, createPolicy } from '@/lib/services/credits/credit-policy.service';
import { successResponse, errorResponse, forbiddenResponse, unauthorizedResponse } from '@/lib/api/response-helpers';
import { withErrorHandler } from '@/lib/middleware/error-handler.middleware';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  const roles: string[] = (session?.user as any)?.roles || [];

  if (!session?.user) {
    return res.status(401).json(unauthorizedResponse());
  }

  if (!roles.includes('PLATFORM_ADMIN')) {
    return res.status(403).json(forbiddenResponse());
  }

  if (req.method === 'GET') {
    const policies = await listAllPolicies();
    return res.status(200).json(successResponse(policies));
  }

  if (req.method === 'POST') {
    const { policyKey, policyName, description, value, dataType, appliesTo } = req.body;

    if (!policyKey || !policyName || value === undefined) {
      return res.status(400).json(errorResponse('policyKey, policyName, and value are required'));
    }

    await createPolicy({ policyKey, policyName, description, value, dataType, appliesTo });
    return res.status(201).json(successResponse({ policyKey }, 'Policy created'));
  }

  if (req.method === 'PUT') {
    const { policyKey, value, isActive } = req.body;

    if (!policyKey || value === undefined) {
      return res.status(400).json(errorResponse('policyKey and value are required'));
    }

    await updatePolicy(policyKey, value, { isActive });
    return res.status(200).json(successResponse({ policyKey }, 'Policy updated'));
  }

  return res.status(405).json(errorResponse('Method not allowed'));
}

export default withErrorHandler(handler);
