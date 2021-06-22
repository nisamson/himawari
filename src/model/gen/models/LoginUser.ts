/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { UserRef } from './UserRef';

export type LoginUser = (UserRef & {
    password: string,
    captchaToken?: string,
});
