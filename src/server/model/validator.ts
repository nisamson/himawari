import express from "express";
import {Result} from "neverthrow";
import {Http} from "../../model";

export interface Validator<T> {
    readonly fromAny: (obj: any) => Result<T, Http.BadRequest>
}

export interface Validated<T> {
    validated: T
}

export function validator<U, T extends Validator<U>>(v: T) {
    return function (req: express.Request & Partial<Validated<U>>, res: express.Response, next: express.NextFunction) {
        let out = v.fromAny(req.body);
        if (out.isOk()) {
            req.validated = out.value;
            next();
        } else {
            next(out.error);
        }
    }
}