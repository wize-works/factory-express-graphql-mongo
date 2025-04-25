// src/middleware/auth.ts
import type { Request, Response, NextFunction } from 'express';
import { Db } from 'mongodb';
import crypto from 'node:crypto';
import { ILogger } from '../interfaces/ILogger';

const HEADER = 'wize-api-key';


export function createAuthMiddleware(db: Db, log: ILogger) {
    return async function auth(req: Request, _res: Response, next: NextFunction) {
        const rawKey = req.header(HEADER);
        if (!rawKey) {
            return next(new Error(`Missing ${HEADER} header`));
        }

        const hash = crypto.createHash('sha256').update(rawKey).digest('hex');
        const tenant = await db
            .collection<Tenant>('tenants')
            .findOne({ 'apiKeys.hash': hash }, { projection: { _id: 1, 'apiKeys.$': 1 } });

        if (!tenant || !tenant.apiKeys?.[0]) {
            return next(new Error('Invalid API key'));
        }

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore – stash on Express req, Yoga will copy to ctx
        req.auth = {
            tenantId: tenant._id.toHexString(),
            scopes: tenant.apiKeys[0].scopes,
        } satisfies AuthContext;

        // touch lastUsed
        void db.collection('tenants').updateOne(
            { _id: tenant._id, 'apiKeys.hash': hash },
            { $set: { 'apiKeys.$.lastUsedAt': new Date() } },
        );

        next();
    };
}
