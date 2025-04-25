// src/routes/registerSchemaRoutes.ts

import { Application, Request, Response, RequestHandler } from 'express';
import { MongoClient } from 'mongodb';
import { createAuthMiddleware } from '../core/auth';

interface SchemaPayload {
    name: string;
    clientApp: string;
    metadata: Record<string, any>;
}

/**
 * Mounts POST /schema on your Express app.
 * Expects JSON payload: { name, clientApp, metadata }
 */
export async function registerSchemaRoutes(
    app: Application,
    mongo: MongoClient
) {
    // Acquire the authentication middleware
    const auth: RequestHandler = await createAuthMiddleware(mongo);

    app.post(
        '/schema',
        auth,
        async (req: Request, res: Response) => {
            const { name, clientApp, metadata } = req.body as SchemaPayload;
            if (!name || !clientApp || !metadata) {
                return res
                    .status(400)
                    .json({ error: 'Missing required fields: name, clientApp, metadata' });
            }

            // Auth middleware has injected tenant context
            const { tenantId } = (req as any).auth as { tenantId: string };

            try {
                // Upsert the schema in MongoDB
                const db = mongo.db('wize-configuration');
                await db.collection('schemas').updateOne(
                    { name, clientApp, tenantId },
                    { $set: { name, clientApp, tenantId, metadata, updatedAt: new Date() } },
                    { upsert: true }
                );
                return res
                    .status(200)
                    .json({ message: 'Schema registered successfully' });
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                return res
                    .status(500)
                    .json({ error: 'Failed to register schema', details: msg });
            }
        }
    );
}
