// example-server/server.ts
import 'dotenv/config';
import express from 'express';
import { createServer } from 'node:http';
import { createYoga } from 'graphql-yoga';
import { MongoClient } from 'mongodb';

import { createServerSchema } from '../../src/core/createServerSchema';
import { createContext } from '../../src/core/context';
import { createAuthMiddleware } from '../../src/core/auth';
import { ProjectModel } from './models/project.model';

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/graphql-factory';

const logger = console;
const tracer = { trace: (span: string, meta?: any) => logger.log(`[trace] ${span}`, meta) };

async function start() {
    const mongo = new MongoClient(mongoUri);
    await mongo.connect();

    const app = express();
    const authMiddleware = await createAuthMiddleware(mongo);
    app.use((req, res, next) => {
        authMiddleware(req, res, next).catch(next);
    });

    const yoga = createYoga({
        schema: createServerSchema([ProjectModel]),
        context: createContext(mongo, logger, tracer),
        graphqlEndpoint: '/graphql',
        graphiql: true,
    });

    app.use('/graphql', yoga);
    const httpServer = createServer(app);
    httpServer.listen(port, () => {
        console.log(`🚀 Server ready at http://localhost:${port}/graphql`);
    });
}

start();
