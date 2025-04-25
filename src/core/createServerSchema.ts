// src/core/createServerSchema.ts

import { GraphQLSchema, GraphQLObjectType } from 'graphql';
import { MongoClient } from 'mongodb';
import { GraphQLModel } from '../models/types';
import { generateResolvers } from '../generators/generateResolvers';
import { loadSchemasFromMongo } from '../utils/loadSchemas';

interface CreateSchemaOptions {
    mongo: MongoClient;
    tenantId: string;
    clientApp: string;
}

/**
 * Builds a GraphQLSchema by loading persisted schemas from MongoDB
 * for the given tenantId and clientApp, generating resolvers, and
 * assembling the Query and Mutation types.
 */
export async function createServerSchema({
    mongo,
    tenantId,
    clientApp,
}: CreateSchemaOptions): Promise<GraphQLSchema> {
    // 1) Load dynamic schemas
    const persisted = await loadSchemasFromMongo(mongo, tenantId, clientApp);

    // 2) Map to in-memory GraphQLModel
    const models: GraphQLModel[] = persisted.map(doc => ({
        name: doc.name,
        collection: doc.name.toLowerCase(),
        fields: doc.metadata.fields,
    }));

    // 3) Generate resolver maps
    const queryFields: Record<string, any> = {};
    const mutationFields: Record<string, any> = {};

    for (const model of models) {
        const resolvers = generateResolvers(model);
        for (const [fieldName, fieldConfig] of Object.entries(resolvers)) {
            if (fieldName.startsWith('find')) {
                queryFields[fieldName] = fieldConfig;
            } else {
                mutationFields[fieldName] = fieldConfig;
            }
        }
    }

    // 4) Construct root types
    const Query = new GraphQLObjectType({
        name: 'Query',
        fields: queryFields,
    });
    const Mutation = new GraphQLObjectType({
        name: 'Mutation',
        fields: mutationFields,
    });

    // 5) Return assembled schema
    return new GraphQLSchema({
        query: Query,
        mutation: Mutation,
    });
}
