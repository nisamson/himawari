/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $ContestInfo = {
    properties: {
        id: {
            type: 'number',
            isRequired: true,
            format: 'int',
        },
        name: {
            type: 'string',
            isRequired: true,
            maxLength: 1024,
            minLength: 1,
        },
        owner: {
            type: 'string',
            isRequired: true,
        },
        created: {
            type: 'string',
            isRequired: true,
            format: 'datetime',
        },
    },
};