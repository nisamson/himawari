/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $NewEntry = {
    properties: {
        contestId: {
            type: 'number',
            format: 'int',
        },
        creator: {
            type: 'string',
            isRequired: true,
            maxLength: 1024,
        },
        name: {
            type: 'string',
            isRequired: true,
            maxLength: 1024,
        },
        url: {
            type: 'string',
            isRequired: true,
            format: 'url',
            maxLength: 1024,
        },
    },
};