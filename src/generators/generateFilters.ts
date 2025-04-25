import {
    GraphQLInputObjectType,
    GraphQLList,
    GraphQLString,
    GraphQLFloat,
    GraphQLBoolean,
} from 'graphql';
import GraphQLJSON from 'graphql-type-json';
import { GraphQLModel, ModelField } from '../models/types';

function getBaseType(field: ModelField) {
    return {
        string: GraphQLString,
        number: GraphQLFloat,
        boolean: GraphQLBoolean,
        uuid: GraphQLString,
        datetime: GraphQLString,
        json: GraphQLJSON, // future: GraphQLJSON
    }[field.type];
}
function generateFilterField(name: string, field: ModelField) {
    const type = getBaseType(field);

    const fields: any = {
        eq: { type },
        in: { type: new GraphQLList(type) },
    };

    if (field.type === 'string') {
        fields.regex = { type: GraphQLString };
    }
    if (['number', 'datetime'].includes(field.type)) {
        fields.gt = { type };
        fields.lt = { type };
    }

    return {
        type: new GraphQLInputObjectType({
            name: `${name}Filter`,
            fields,
        }),
    };
}

export function generateFilterInput(model: GraphQLModel): GraphQLInputObjectType {
    return new GraphQLInputObjectType({
        name: `${model.name}FilterInput`,
        fields: () => {
            const fields: any = {};
            for (const [key, meta] of Object.entries(model.fields)) {
                fields[key] = generateFilterField(`${model.name}_${key}`, meta);
            }
            return fields;
        },
    });
}
