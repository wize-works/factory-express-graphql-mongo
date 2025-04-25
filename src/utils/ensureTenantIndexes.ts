import { Db } from 'mongodb';
import { ILogger } from '../interfaces/ILogger';

export async function ensureTenantIndexes(db: Db, log: ILogger) {
    const colls = await db.listCollections().toArray();
    await Promise.all(
        colls.map(({ name }) =>
            db
                .collection(name)
                .createIndex({ tenantId: 1, _id: 1 })
                .catch((err) => log.debug(`index ${name} skipped: ${err.message}`)),
        ),
    );
}
