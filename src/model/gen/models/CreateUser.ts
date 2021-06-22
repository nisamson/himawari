/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { LoginUser } from './LoginUser';

export type CreateUser = (LoginUser & {
    email: string,
});
