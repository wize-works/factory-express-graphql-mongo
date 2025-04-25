import type { ILogger } from '../interfaces/ILogger';

export const noopLogger: ILogger = {
    info: () => { },
    warn: () => { },
    error: () => { },
    debug: () => { },
};
