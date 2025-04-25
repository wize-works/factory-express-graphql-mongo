import { MongoClient } from "mongodb";
import { ILogger } from "./ILogger";
import { ITracer } from "./ITracer";

export interface GraphQLFactoryContext {
    tenantId: string;
    tenantName: string;
    db: MongoClient;
    logger: ILogger;
    tracer: ITracer;
}