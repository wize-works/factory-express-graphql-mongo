
export type FieldType =
    | 'string'
    | 'number'
    | 'boolean'
    | 'datetime'
    | 'uuid'
    | 'json';

export interface ModelField {
    type: FieldType;
    required?: boolean;
    array?: boolean;
    defaultValue?: any;
    description?: string;
}

export interface GraphQLModel {
    name: string;
    collection?: string; // Defaults to lowercased name
    description?: string;
    fields: Record<string, ModelField>;
}
