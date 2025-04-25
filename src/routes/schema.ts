// src/routes/registerSchemaRoutes.ts

import { Application, Request, Response } from 'express';
import { MongoClient } from 'mongodb';
import { createAuthMiddleware } from '../core/auth';
import { GraphQLModel } from '../models/types';

interface SchemaPayload {
    name: string;
    clientApp: string;
    metadata: {
        fields: Record<string, any>;
        tenantScoped?: boolean;
        subscriptions?: Record<string, boolean>;
    };
}

/**
 * Mounts POST /schema on your Express app.
 * @param app    Your Express instance (after app.use(express.json()))
 * @param mongo  Connected MongoClient
 * @param models Mutable array of GraphQLModel definitions
 */
export function registerSchemaRoutes(
    app: Application,
    mongo: MongoClient,
    models: GraphQLModel[]
) {
    // Protect with API-key auth
    const auth = createAuthMiddleware(mongo);

    app.post('/schema', auth, async (req: Request, res: Response) => {
        const { name, clientApp, metadata } = req.body as SchemaPayload;
        if (!name || !clientApp || !metadata) {
            return res
                .status(400)
                .json({ error: 'Missing required fields: name, clientApp, metadata' });
        }

        // Auth middleware has set req.auth
        const { tenantId } = (req as any).auth as { tenantId: string };

        try {
            // 1) Upsert into MongoDB
            const db = mongo.db('wize-configuration');
            await db.collection('schemas').updateOne(
                { name, tenantId, clientApp },
                {
                    $set: {
                        name,
                        tenantId,
                        clientApp,
                        metadata,
                        updatedAt: new Date(),
                    },
                },
                { upsert: true }
            );

            // 2) Add to in-memory models
            const newModel: GraphQLModel = {
                name,
                collection: name.toLowerCase(),
                fields: metadata.fields,
            };
            models.push(newModel);

            return res.status(200).json({ message: 'Schema registered successfully' });
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            return res
                .status(500)
                .json({ error: 'Failed to register schema', details: msg });
        }
    });
}
