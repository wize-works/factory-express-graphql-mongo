import { Filter, Document } from 'mongodb';

/** Maps GraphQL-style { field_eq: value } into Mongo $ operators */
export function buildFilter<T extends Document>(
    input: Record<string, unknown> | null | undefined,
): Filter<T> {
    if (!input) return {};
    const mongo: Filter<T> = {};

    for (const [k, v] of Object.entries(input)) {
        // expected pattern: field_op  e.g.  title_regex, price_gt
        const [field, op] = k.split('_');
        switch (op) {
            case 'eq':
                mongo[field] = { ...(mongo[field] as any), $eq: v };
                break;
            case 'in':
                mongo[field] = { ...(mongo[field] as any), $in: v };
                break;
            case 'regex':
                mongo[field] = { ...(mongo[field] as any), $regex: v };
                break;
            case 'gt':
                mongo[field] = { ...(mongo[field] as any), $gt: v };
                break;
            case 'lt':
                mongo[field] = { ...(mongo[field] as any), $lt: v };
                break;
            // add more ops as needed
            default:
                throw new Error(`Unknown filter op: ${op}`);
        }
    }
    return mongo;
}
