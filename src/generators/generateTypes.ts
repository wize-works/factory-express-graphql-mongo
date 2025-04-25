import {
    GraphQLObjectType,
    GraphQLInputObjectType,
    GraphQLNonNull,
    GraphQLList,
    GraphQLString,
    GraphQLFloat,
    GraphQLBoolean,
} from 'graphql';
import { GraphQLModel, ModelField } from '../models/types';

function mapFieldType(field: ModelField): GraphQLNonNull<any> | GraphQLList<any> | GraphQLString | GraphQLFloat | GraphQLBoolean {
    const baseType = {
        string: GraphQLString,
        number: GraphQLFloat,
        boolean: GraphQLBoolean,
        uuid: GraphQLString,
        datetime: GraphQLString,
        json: GraphQLString, // TODO: GraphQLJSON
    }[field.type];

    let type: any = baseType;
    if (field.required) type = new GraphQLNonNull(type);
    if (field.array) type = new GraphQLList(type);
    return type;
}

export function generateObjectType(model: GraphQLModel): GraphQLObjectType {
    return new GraphQLObjectType({
        name: model.name,
        fields: () => {
            const fields: any = {};
            for (const [key, meta] of Object.entries(model.fields)) {
                fields[key] = { type: mapFieldType(meta), description: meta.description };
            }
            return fields;
        },
    });
}

export function generateInputType(model: GraphQLModel): GraphQLInputObjectType {
    return new GraphQLInputObjectType({
        name: `${model.name}Input`,
        fields: () => {
            const fields: any = {};
            for (const [key, meta] of Object.entries(model.fields)) {
                fields[key] = { type: mapFieldType(meta) };
            }
            return fields;
        },
    });
}