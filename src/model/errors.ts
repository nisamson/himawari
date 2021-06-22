import {ValidationError} from "class-validator";

export abstract class ApiError extends Error {}

export class BadArgument extends Error {
    constructor(message?: string) {
        let mess;
        if (message) {
            mess = `Got a bad argument: ${message}`;
        } else {
            mess = "Got a bad argument.";
        }
        super(mess)
    }
}

export abstract class SimpleMessageError extends ApiError {
    protected constructor(message: string) {
        super(message)
    }
}

export class ValidationFailure extends ApiError {
    readonly failInfo: ValidationError[];

    constructor(failures: ValidationError[] | string) {
        let message;
        if (typeof failures === "string") {
            message = failures;
        } else {
            message = failures.map(ValidationError.toString).join("\n");
        }

        super(message);
        this.failInfo = typeof failures === "string" ? [] : failures;
    }
}