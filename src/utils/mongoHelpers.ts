// src/utils/mongoHelpers.ts
import { Filter } from 'mongodb';

/**
 * Converts a GraphQL filter input object to a MongoDB filter.
 */
export function buildMongoFilter(filterInput: any = {}): Filter<any> {
    const mongoFilter: Record<string, any> = {};

    for (const [field, operators] of Object.entries(filterInput)) {
        if (!operators || typeof operators !== 'object') continue;

        const fieldQuery: Record<string, any> = {};

        for (const [op, value] of Object.entries(operators)) {
            if (value === undefined) continue;

            switch (op) {
                case 'eq':
                    fieldQuery['$eq'] = value;
                    break;
                case 'in':
                    fieldQuery['$in'] = value;
                    break;
                case 'regex':
                    fieldQuery['$regex'] = value;
                    break;
                case 'gt':
                    fieldQuery['$gt'] = value;
                    break;
                case 'lt':
                    fieldQuery['$lt'] = value;
                    break;
            }
        }

        if (Object.keys(fieldQuery).length > 0) {
            mongoFilter[field] = fieldQuery;
        }
    }

    return mongoFilter;
}

/**
 * Applies pagination options to MongoDB find cursor.
 */
export function applyPagination<T>(cursor: any, args: { skip?: number; limit?: number }) {
    if (args.skip !== undefined) cursor = cursor.skip(args.skip);
    if (args.limit !== undefined) cursor = cursor.limit(args.limit);
    return cursor;
}

/**
 * Applies sort options to MongoDB find cursor.
 */
export function applySorting<T>(cursor: any, sort: Record<string, 1 | -1>) {
    if (sort && Object.keys(sort).length > 0) {
        cursor = cursor.sort(sort);
    }
    return cursor;
}