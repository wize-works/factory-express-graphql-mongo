import { Db, ObjectId } from 'mongodb';
import { GraphQLModel } from '../interfaces/GraphQLModel';
import { buildFilter } from '../utils/filters';
import { buildSort } from '../utils/sort';
import { applyPaging } from '../utils/paging';
import { PubSub } from 'graphql-yoga';
import { AuthContext } from '../middleware/auth';

const EVENTS = { CREATED: 'created', UPDATED: 'updated', DELETED: 'deleted' };

export function generateResolvers(
    models: GraphQLModel[],
    db: Db,
    pubsub: PubSub,
) {
    const rootQuery: any = {};
    const rootMut: any = {};
    const rootSub: any = {};

    for (const model of models) {
        const col = db.collection(lc(model.name));
        const one = lc(model.name);
        const many = one + 's';
        const topic = `${model.name}`;

        // -------------------- Query --------------------
        rootQuery[one] = async (
            _parent: any,
            { id }: { id: string },
            ctx: { auth: AuthContext },
        ) => {
            return col.findOne({ _id: new ObjectId(id), tenantId: ctx.auth.tenantId });
        };

        rootQuery[many] = async (
            _parent: any,
            { filter, sort, paging }: any,
            ctx: { auth: AuthContext },
        ) => {
            const q = {
                tenantId: ctx.auth.tenantId,
                ...buildFilter(filter),
            };
            const cursor = applyPaging(col.find(q), paging);
            if (sort) cursor.sort(buildSort(sort));
            const data = await cursor.toArray();
            const count = await col.countDocuments(q);
            return { count, data };
        };

        // ------------------- Mutation ------------------
        rootMut[`create${model.name}`] = async (
            _p: any,
            { data }: any,
            ctx: { auth: AuthContext },
        ) => {
            const insert = {
                ...data,
                tenantId: ctx.auth.tenantId,
                ...(model.timestamps
                    ? { createdAt: new Date(), updatedAt: new Date() }
                    : {}),
            };
            const { insertedId } = await col.insertOne(insert);
            const doc = await col.findOne({ _id: insertedId });
            await pubsub.publish(`${topic}.${EVENTS.CREATED}`, doc);
            return doc;
        };

        rootMut[`update${model.name}`] = async (
            _p: any,
            { id, data }: any,
            ctx: { auth: AuthContext },
        ) => {
            await col.updateOne(
                { _id: new ObjectId(id), tenantId: ctx.auth.tenantId },
                {
                    $set: {
                        ...data,
                        ...(model.timestamps && { updatedAt: new Date() }),
                    },
                },
            );
            const doc = await col.findOne({ _id: new ObjectId(id) });
            await pubsub.publish(`${topic}.${EVENTS.UPDATED}`, doc);
            return doc;
        };

        rootMut[`delete${model.name}`] = async (
            _p: any,
            { id }: any,
            ctx: { auth: AuthContext },
        ) => {
            const res = await col.deleteOne({
                _id: new ObjectId(id),
                tenantId: ctx.auth.tenantId,
            });
            if (res.deletedCount)
                await pubsub.publish(`${topic}.${EVENTS.DELETED}`, id);
            return !!res.deletedCount;
        };

        // ---------------- Subscription ---------------
        rootSub[`on${model.name}Created`] = {
            subscribe: () => pubsub.subscribe(`${topic}.${EVENTS.CREATED}`),
            resolve: (p: any) => p,
        };
        rootSub[`on${model.name}Updated`] = {
            subscribe: () => pubsub.subscribe(`${topic}.${EVENTS.UPDATED}`),
            resolve: (p: any) => p,
        };
        rootSub[`on${model.name}Deleted`] = {
            subscribe: () => pubsub.subscribe(`${topic}.${EVENTS.DELETED}`),
            resolve: (id: string) => id,
        };
    }

    return {
        Query: rootQuery,
        Mutation: rootMut,
        Subscription: rootSub,
    };
}

function lc(s: string) {
    return s.charAt(0).toLowerCase() + s.slice(1);
}
