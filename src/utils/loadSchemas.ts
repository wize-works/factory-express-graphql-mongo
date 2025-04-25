// src/utils/loadSchemas.ts

import { MongoClient } from 'mongodb';
import { PersistedSchema } from '../interfaces/PersistedSchema';

/**
 * Load all schemas for a given tenant+clientApp from Mongo.
 */
export async function loadSchemasFromMongo(
    mongo: MongoClient,
    tenantId: string,
    clientApp: string
): Promise<PersistedSchema[]> {
    const db = mongo.db('wize-configuration');
    return db
        .collection('schemas')
        .find({ tenantId, clientApp })
        .project<{ name: string; metadata: any }>({
            name: 1,
            metadata: 1,
            _id: 0,
        })
        .toArray();
}
