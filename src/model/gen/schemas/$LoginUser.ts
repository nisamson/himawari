/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $LoginUser = {
    type: 'all-of',
    contains: [{
        type: 'UserRef',
    }, {
        properties: {
            password: {
                type: 'string',
                isRequired: true,
                format: 'password',
                maxLength: 128,
                minLength: 4,
            },
            captchaToken: {
                type: 'string',
            },
        },
    }],
};