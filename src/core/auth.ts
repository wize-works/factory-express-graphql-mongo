import { NextFunction, Request, Response } from 'express';
import { MongoClient } from 'mongodb';

export interface TenantContext {
    tenantId: string;
    tenantName: string;
}

export async function createAuthMiddleware(mongo: MongoClient) {
    const db = mongo.db();
    const tenants = db.collection('tenants');

    return async function auth(req: Request, res: Response, next: NextFunction) {
        const apiKey = req.header('wize-api-key');
        if (!apiKey) {
            return res.status(401).json({ error: 'Missing wize-api-key header' });
        }

        const tenant = await tenants.findOne({ key: apiKey });
        
        if (!tenant) {
            return res.status(403).json({ error: 'Invalid API key' });
        }

        (req as any).auth = {
            tenantId: tenant.tenantId,
            tenantName: tenant.name,
        } satisfies TenantContext;

        next();
    };
}