// src/interfaces/FieldMeta.ts
export type ScalarName =
    | 'string'
    | 'int'
    | 'float'
    | 'boolean'
    | 'DateTime'
    | 'JSON'
    | 'ID'
    | 'ObjectId';

export interface FieldMeta {
    /** Base scalar type */
    type: ScalarName;
    /** Required (non-null) in GraphQL */
    required?: boolean;
    /** Treat value as array */
    array?: boolean;
    /** Enumeration of valid values (for scalars that support it) */
    enum?: readonly string[];
    /** Default value inserted on create */
    defaultValue?: unknown;
    /**
     * Fine-grained exclude switches –
     *   input: omit from inserts/updates
     *   output: omit from selects
     *   filter/sort: omit from respective helpers
     */
    exclude?: {
        input?: boolean;
        output?: boolean;
        filter?: boolean;
        sort?: boolean;
    };
}
