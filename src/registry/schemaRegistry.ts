import { Db, ChangeStream } from 'mongodb';
import { GraphQLModel } from '../interfaces/GraphQLModel';
import { generateSDL } from '../generators/schemaGenerator';
import { generateResolvers } from '../generators/resolverGenerator';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { PubSub } from 'graphql-yoga';
import { ILogger } from '../interfaces/ILogger';

export class SchemaRegistry {
    private cache = new Map<string, ReturnType<typeof makeExecutableSchema>>();
    private stream?: ChangeStream;

    constructor(
        private db: Db,
        private staticModels: GraphQLModel[],
        private log: ILogger,
    ) { }

    /** Initialise and begin watching */
    async start() {
        // ensure index on schemas collection for change streams
        await this.db
            .collection('schemas')
            .createIndex({ tenantId: 1, schemaName: 1, clientApp: 1 }, { unique: true });

        this.stream = this.db.collection('schemas').watch([], { fullDocument: 'updateLookup' });
        this.stream.on('change', (evt) => {
            const doc = evt.fullDocument as any;
            this.rebuild(doc.tenantId, doc.clientApp);
        });

        // eager build default “global” schema used when no per-tenant override exists
        await this.rebuild('global', 'default');
    }

    /** Retrieve executable schema for a given tenant+app */
    get(tenantId: string, clientApp = 'default') {
        return (
            this.cache.get(`${tenantId}:${clientApp}`) ||
            this.cache.get('global:default')! // fallback
        );
    }

    /** (Re)build schema and store in cache */
    async rebuild(tenantId: string, clientApp = 'default') {
        this.log.info(`Rebuilding schema for ${tenantId}/${clientApp}…`);
        const custom =
            (await this.db
                .collection('schemas')
                .findOne({ tenantId, clientApp }))?.models || [];

        const models: GraphQLModel[] = [...this.staticModels, ...custom];
        const { typeDefs, scalars } = generateSDL(models);
        const pubsub = new PubSub();
        const resolvers = generateResolvers(models, this.db, pubsub);
        const schema = makeExecutableSchema({
            typeDefs,
            resolvers,
            resolvers: Object.values(scalars).reduce(
                (acc, s) => ({ ...acc, [s.name]: s }),
                resolvers,
            ),
        });
        this.cache.set(`${tenantId}:${clientApp}`, schema);
    }

    stop() {
        this.stream?.close();
    }
}
