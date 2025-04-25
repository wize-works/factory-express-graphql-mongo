// src/generators/generateResolvers.ts
import { GraphQLFieldConfigMap, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLString } from 'graphql';
import { GraphQLFactoryContext } from '../interfaces/GraphQLFactoryContext';
import { GraphQLModel } from '../models/types';
import { generateObjectType, generateInputType } from './generateTypes';
import { generateFilterInput } from './generateFilters';
import { buildMongoFilter, applyPagination, applySorting } from '../utils/mongoHelpers';

export function generateResolvers(model: GraphQLModel): GraphQLFieldConfigMap<any, GraphQLFactoryContext> {
    const objectType = generateObjectType(model);
    const inputType = generateInputType(model);
    const filterInput = generateFilterInput(model);
    const collectionName = model.collection || model.name.toLowerCase();

    return {
        [`find${model.name}`]: {
            type: objectType,
            args: {
                filter: { type: filterInput },
            },
            resolve: async (_parent, args, ctx) => {
                const filter = buildMongoFilter(args.filter);
                filter.tenantId = ctx.tenantId;
                const doc = await ctx.db.db().collection(collectionName).findOne(filter);
                return doc;
            },
        },
        [`findMany${model.name}`]: {
            type: new GraphQLList(objectType),
            args: {
                filter: { type: filterInput },
                sort: { type: GraphQLString }, // TODO: enhance to input type
                skip: { type: GraphQLString },
                limit: { type: GraphQLString },
            },
            resolve: async (_parent, args, ctx) => {
                const filter = buildMongoFilter(args.filter);
                filter.tenantId = ctx.tenantId;

                let cursor = ctx.db.db().collection(collectionName).find(filter);
                cursor = applySorting(cursor, args.sort);
                cursor = applyPagination(cursor, { skip: +args.skip || 0, limit: +args.limit || 100 });

                return await cursor.toArray();
            },
        },
        [`create${model.name}`]: {
            type: objectType,
            args: {
                input: { type: new GraphQLNonNull(inputType) },
            },
            resolve: async (_parent, args, ctx) => {
                const input = { ...args.input, tenantId: ctx.tenantId };
                const { insertedId } = await ctx.db.db().collection(collectionName).insertOne(input);
                return { _id: insertedId, ...input };
            },
        },
        [`update${model.name}`]: {
            type: objectType,
            args: {
                filter: { type: new GraphQLNonNull(filterInput) },
                input: { type: new GraphQLNonNull(inputType) },
            },
            resolve: async (_parent, args, ctx) => {
                const filter = buildMongoFilter(args.filter);
                filter.tenantId = ctx.tenantId;
                const update = { $set: args.input };
                await ctx.db.db().collection(collectionName).updateOne(filter, update);
                return ctx.db.db().collection(collectionName).findOne(filter);
            },
        },
        [`delete${model.name}`]: {
            type: objectType,
            args: {
                filter: { type: new GraphQLNonNull(filterInput) },
            },
            resolve: async (_parent, args, ctx) => {
                const filter = buildMongoFilter(args.filter);
                filter.tenantId = ctx.tenantId;
                const doc = await ctx.db.db().collection(collectionName).findOne(filter);
                if (doc) await ctx.db.db().collection(collectionName).deleteOne(filter);
                return doc;
            },
        },
    };
}
