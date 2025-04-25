// server/server.ts
dotenv.config();
import express from 'express';
import { createYoga } from 'graphql-yoga';
import { MongoClient } from 'mongodb';
import { registerSchemaRoutes } from '../../src/routes/schema';
import { createContext } from '../../src/core/context';
import { createServerSchema } from '../../src/core/createServerSchema';
import dotenv from 'dotenv';

async function start() {
    // 1) Connect to MongoDB
    const mongo = new MongoClient(process.env.MONGO_URI!);
    await mongo.connect();

    // 2) Initialize Express
    const app = express();
    app.use(express.json());

    // 3) Schema registration endpoint (/schema)
    registerSchemaRoutes(app, mongo);

    // 4) GraphQL endpoint (/graphql)
    const yoga = createYoga({
        graphqlEndpoint: '/graphql',
        // Dynamically load schemas for this tenant+clientApp
        schema: async (req) => {
            const { tenantId, clientApp } = (req as any).auth as { tenantId: string; clientApp: string };
            return createServerSchema({ mongo, tenantId, clientApp });
        },
        // Build context per request
        context: ({ request }) => createContext( mongo, console, console ),
        graphiql: true,
    });
    app.use('/graphql', yoga);

    // 5) Start listening
    const port = parseInt(process.env.PORT ?? '3000', 10);
    app.listen(port, () => {
        console.log(`🚀 Server listening at http://localhost:${port}`);
    });
}

start().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
