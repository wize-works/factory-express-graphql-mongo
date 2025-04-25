// src/interfaces/GraphQLModel.ts
import { FieldMeta } from './FieldMeta';

export interface GraphQLModel {
    /** PascalCase GraphQL type / camelCase Mongo collection */
    name: string;
    /** Field definitions */
    fields: Record<string, FieldMeta>;
    /** Adds createdAt / updatedAt (DateTime) automatically */
    timestamps?: boolean;
}
