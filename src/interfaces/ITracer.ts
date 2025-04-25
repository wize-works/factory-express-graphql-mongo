export interface ITracer {
    span<T>(name: string, fn: () => Promise<T> | T): Promise<T>;
}
