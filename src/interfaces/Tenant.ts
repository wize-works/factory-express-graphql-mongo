// src/interfaces/Tenant.ts
import { ObjectId } from 'mongodb';

export interface TenantApiKey {
    /** SHA-256 hash of the raw API‑key */
    hash: string;
    scopes: string[];
    label?: string;
    createdAt: Date;
    lastUsedAt?: Date;
}

export interface Tenant {
    _id: ObjectId;
    name: string;
    apiKeys: TenantApiKey[];
}
