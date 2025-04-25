// src/core/createServerSchema.ts
import { GraphQLObjectType, GraphQLSchema } from 'graphql';
import { GraphQLModel } from '../models/types';
import { generateResolvers } from '../generators/generateResolvers';
import { PubSub } from 'graphql-subscriptions';

const pubsub = new PubSub();

export function createServerSchema(models: GraphQLModel[]) {
    const queryFields: any = {};
    const mutationFields: any = {};
    const subscriptionFields: any = {};

    for (const model of models) {
        const resolvers = generateResolvers(model);

        for (const [key, config] of Object.entries(resolvers)) {
            if (key.startsWith('find')) {
                queryFields[key] = config;
            } else if (key.startsWith('subscribe')) {
                subscriptionFields[key] = {
                    subscribe: config.subscribe,
                    resolve: config.resolve,
                };
            } else {
                mutationFields[key] = config;
            }
        }
    }

    const Query = new GraphQLObjectType({
        name: 'Query',
        fields: queryFields,
    });

    const Mutation = new GraphQLObjectType({
        name: 'Mutation',
        fields: mutationFields,
    });

    const Subscription = new GraphQLObjectType({
        name: 'Subscription',
        fields: subscriptionFields,
    });

    return new GraphQLSchema({
        query: Query,
        mutation: Mutation,
        subscription: Subscription,
    });
}