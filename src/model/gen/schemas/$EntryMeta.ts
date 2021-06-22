/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $EntryMeta = {
    type: 'all-of',
    contains: [{
        properties: {
            id: {
                type: 'number',
                isRequired: true,
                format: 'int',
            },
        },
    }, {
        type: 'NewEntry',
    }],
};