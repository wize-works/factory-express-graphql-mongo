export interface ITracer {
    trace: (span: string, meta?: Record<string, unknown>) => void;
}
