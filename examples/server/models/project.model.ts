import { GraphQLModel } from '../../../src/models/types';

export const ProjectModel: GraphQLModel = {
    name: 'Project',
    fields: {
        tenantId: { type: 'uuid', required: true },
        name: { type: 'string', required: true },
        status: { type: 'string' },
        budget: { type: 'number' },
        createdAt: { type: 'datetime', defaultValue: 'now()', required: true },
        updatedAt: { type: 'datetime', defaultValue: 'now()', required: true },
    },
};
