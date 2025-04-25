
import { MongoClient } from 'mongodb';
import { YogaInitialContext } from 'graphql-yoga';

export interface ILogger {
    log: (msg: string, meta?: Record<string, unknown>) => void;
    error: (msg: string, meta?: Record<string, unknown>) => void;
}

export interface ITracer {
    trace: (span: string, meta?: Record<string, unknown>) => void;
}

export interface GraphQLFactoryContext {
    tenantId: string;
    tenantName: string;
    db: MongoClient;
    logger: ILogger;
    tracer: ITracer;
}

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