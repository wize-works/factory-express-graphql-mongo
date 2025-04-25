export type SortDirection = 1 | -1;

/** GraphQL `{ field: ASC|DESC }` ➜ Mongo `{ field: 1|-1 }` */
export function buildSort(input: Record<string, 'ASC' | 'DESC'> | null | undefined) {
    if (!input) return undefined;
    const out: Record<string, SortDirection> = {};
    for (const [k, v] of Object.entries(input))
        out[k] = v === 'ASC' ? 1 : -1;
    return out;
}
