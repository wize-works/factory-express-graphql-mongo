import { GraphQLScalarType } from 'graphql';
import { GraphQLDateTime, GraphQLJSON } from 'graphql-scalars';
import { ObjectId } from 'mongodb';
import { FieldMeta, ScalarName } from '../interfaces/FieldMeta';

/**
 * GraphQL scalars supported by the library.
 * ObjectIdScalar is created lazily so we don’t pull an extra dep.
 */
export const ObjectIdScalar = new GraphQLScalarType({
    name: 'ObjectId',
    serialize: (v: unknown) => (v instanceof ObjectId ? v.toHexString() : v),
    parseValue: (v: unknown) => new ObjectId(String(v)),
});

export const scalarMap: Record<
    ScalarName,
    { gql: GraphQLScalarType | 'String' | 'Int' | 'Float' | 'Boolean'; ts: string }
> = {
    string: { gql: 'String', ts: 'string' },
    int: { gql: 'Int', ts: 'number' },
    float: { gql: 'Float', ts: 'number' },
    boolean: { gql: 'Boolean', ts: 'boolean' },
    DateTime: { gql: GraphQLDateTime, ts: 'Date' },
    JSON: { gql: GraphQLJSON, ts: 'any' },
    ID: { gql: 'ID', ts: 'string' },
    ObjectId: { gql: ObjectIdScalar, ts: 'string' },
};

/**
 * Helper – return GraphQL SDL for a field (handles arrays/required).
 */
export function toSDL(name: string, meta: FieldMeta): string {
    const base = typeof scalarMap[meta.type].gql === 'string'
        ? scalarMap[meta.type].gql
        : scalarMap[meta.type].gql.name;              // custom scalar
    const sdl = meta.array ? `[${base}!]` : base;
    return `${name}: ${sdl}${meta.required ? '!' : ''}`;
}
