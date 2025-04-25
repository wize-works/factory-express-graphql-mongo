export interface PagingInput { limit?: number; skip?: number }
export const DEFAULT_LIMIT = 25;

export function applyPaging<T>(cursor: import('mongodb').FindCursor<T>, paging: PagingInput | null | undefined) {
    const { limit = DEFAULT_LIMIT, skip = 0 } = paging ?? {};
    return cursor.limit(limit).skip(skip);
}
