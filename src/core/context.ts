
import { MongoClient } from 'mongodb';
import { YogaInitialContext } from 'graphql-yoga';
import { ILogger } from '../interfaces/ILogger';
import { ITracer } from '../interfaces/ITracer';
import { GraphQLFactoryContext } from '../interfaces/GraphQLFactoryContext';

export function createContext(mongo: MongoClient, logger: ILogger, tracer: ITracer) {
    return async function ({ request }: YogaInitialContext): Promise<GraphQLFactoryContext> {
        const expressReq = (request as any).bodyInit;

        const auth = expressReq?.auth as { tenantId: string; tenantName: string } | undefined;
        if (!auth || !auth.tenantId) {
            throw new Error('Missing auth context. API key authentication failed or not provided.');
        }

        return {
            tenantId: auth.tenantId,
            tenantName: auth.tenantName,
            db: mongo,
            logger,
            tracer,
        };
    };
}