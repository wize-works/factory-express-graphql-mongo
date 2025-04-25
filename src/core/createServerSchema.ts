// src/core/createServerSchema.ts
import { GraphQLSchema, GraphQLObjectType } from 'graphql';
import { GraphQLModel } from '../models/types';
import { generateResolvers } from '../generators/generateResolvers';

export function createServerSchema(models: GraphQLModel[]) {
    const queryFields: any = {};
    const mutationFields: any = {};

    for (const model of models) {
        const resolvers = generateResolvers(model);

        for (const [key, config] of Object.entries(resolvers)) {
            if (key.startsWith('find')) {
                queryFields[key] = config;
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

    return new GraphQLSchema({
        query: Query,
        mutation: Mutation,
    });
}