import express from "express";
import {Result} from "neverthrow";
import {Http} from "../../model";

interface Validatable {
    readonly fromAny: (obj: any) => Result<this, Http.BadRequest>
}

interface Validated<T> {
    validated: T
}

export function validator<T extends Validatable>(v: T) {
    return function (req: express.Request & Partial<Validated<T>>, res: express.Response, next: express.NextFunction) {
        let out = v.fromAny(req.body);
        if (out.isOk()) {
            req.validated = out.value;
            next();
        } else {
            next(out.error);
        }
    }
}