import express from 'express';
import { createYoga } from 'graphql-yoga';
import { MongoClient } from 'mongodb';
import { registerSchemaRoutes } from '../../src/routes/schema';
import { createContext } from '../../src/core/context';
import { createServerSchema } from '../../src/core/createServerSchema';


async function start() {
    const mongo = new MongoClient(process.env.MONGO_URI!);
    await mongo.connect();

    const app = express();
    app.use(express.json());

    // Mount /schema so clients can upsert into Mongo + (re)load in memory
    registerSchemaRoutes(app, mongo);

    // GraphQL endpoint—schema loader will pull from DB each request
    const yoga = createYoga({
        graphqlEndpoint: '/graphql',
        schema: async (req) =>
            createServerSchema({
                mongo,
                tenantId: (req as any).auth.tenantId,
                clientApp: (req as any).auth.clientApp,
            }),
        context: createContext(mongo, console, console),
        graphiql: true,
    });
    app.use('/graphql', yoga);

    app.listen(process.env.PORT || 3000, () => {
        console.log('🚀 API listening on port', process.env.PORT || 3000);
    });
}

start().catch(console.error);
