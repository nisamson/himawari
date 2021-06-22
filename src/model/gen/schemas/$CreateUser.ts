/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $CreateUser = {
    type: 'all-of',
    contains: [{
        type: 'LoginUser',
    }, {
        properties: {
            email: {
                type: 'string',
                isRequired: true,
                format: 'email',
            },
        },
    }],
};