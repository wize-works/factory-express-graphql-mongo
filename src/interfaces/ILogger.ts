export interface ILogger {
    info(msg: string, meta?: unknown): void;
    warn(msg: string, meta?: unknown): void;
    error(msg: string | Error, meta?: unknown): void;
    debug(msg: string, meta?: unknown): void;
}
