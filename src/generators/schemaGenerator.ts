import { GraphQLScalarType, Kind } from 'graphql';
import { GraphQLDateTime, GraphQLJSON } from 'graphql-scalars';
import { GraphQLModel } from '../interfaces/GraphQLModel';
import { scalarMap, toSDL } from './typeMaps';

export interface GeneratedSchema {
    typeDefs: string;
    scalars: Record<string, GraphQLScalarType>;
}

export function generateSDL(models: GraphQLModel[]): GeneratedSchema {
    const lines: string[] = [
    // Root types – will be merged incrementally
    /* GraphQL */ `
      type Query
      type Mutation
      type Subscription
    `,
    ];
    const customScalars: Record<string, GraphQLScalarType> = {
        DateTime: GraphQLDateTime,
        JSON: GraphQLJSON,
        ObjectId: scalarMap.ObjectId.gql as any,
    };

    for (const model of models) {
        // 1. Object type
        lines.push(`type ${model.name} {`);
        for (const [field, meta] of Object.entries(model.fields))
            if (!meta.exclude?.output)
                lines.push('  ' + toSDL(field, meta));
        lines.push('}\n');

        // 2. Input type
        lines.push(`input ${model.name}Input {`);
        for (const [field, meta] of Object.entries(model.fields))
            if (!meta.exclude?.input)
                lines.push('  ' + toSDL(field, { ...meta, required: false }));
        lines.push('}\n');

        // 3. Filter input
        lines.push(`input ${model.name}Filter {`);
        for (const [field, meta] of Object.entries(model.fields))
            if (!meta.exclude?.filter)
                lines.push(
                    `  ${field}_eq: ${scalarSDL(meta)}\n` +
                    `  ${field}_in: [${scalarSDL(meta)}!]\n` +
                    (meta.type === 'string'
                        ? `  ${field}_regex: String\n`
                        : '') +
                    (['int', 'float', 'DateTime'].includes(meta.type)
                        ? `  ${field}_gt: ${scalarSDL(meta)}\n  ${field}_lt: ${scalarSDL(meta)}\n`
                        : ''),
                );
        lines.push('}\n');

        // 4. Sort input
        lines.push(
            `input ${model.name}Sort { field: String! direction: SortDir! }\n` +
            `enum SortDir { ASC DESC }`,
        );

        // 5. List result wrapper
        lines.push(
            `type ${model.name}ListResult {\n` +
            '  count: Int!\n' +
            `  data: [${model.name}!]!\n` +
            '}\n',
        );

        // 6. Root field stitching
        lines.push(
      /* GraphQL */ `
      extend type Query {
        ${lc(model.name)}(id: ID!): ${model.name}
        ${lc(model.name)}s(
          filter: ${model.name}Filter
          sort: ${model.name}Sort
          paging: PagingInput
        ): ${model.name}ListResult!
      }

      extend type Mutation {
        create${model.name}(data: ${model.name}Input!): ${model.name}!
        update${model.name}(id: ID!, data: ${model.name}Input!): ${model.name}!
        delete${model.name}(id: ID!): Boolean!
      }

      extend type Subscription {
        on${model.name}Created: ${model.name}!
        on${model.name}Updated: ${model.name}!
        on${model.name}Deleted: ID!
      }
      `,
        );
    }

    // global paging input (once)
    lines.push(
    /* GraphQL */ `
    input PagingInput { limit: Int = 25 skip: Int = 0 }
  `,
    );

    return { typeDefs: lines.join('\n'), scalars: customScalars };
}

function lc(str: string) {
    return str.charAt(0).toLowerCase() + str.slice(1);
}

function scalarSDL(meta: { type: string }) {
    const s = scalarMap[meta.type as keyof typeof scalarMap].gql;
    return typeof s === 'string' ? s : s.name;
}
