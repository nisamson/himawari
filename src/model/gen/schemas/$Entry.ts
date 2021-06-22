/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $Entry = {
    type: 'all-of',
    contains: [{
        type: 'EntryMeta',
    }, {
        properties: {
            description: {
                type: 'string',
                isRequired: true,
                maxLength: 65535,
            },
        },
    }],
};