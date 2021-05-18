import {StatusCodes, getReasonPhrase} from "http-status-codes";

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

export class HttpError extends ApiError {
    readonly code: StatusCodes
    constructor(code: StatusCodes) {
        if (code < 400) {
            throw new BadArgument("must be an HTTP error code");
        }

        super(getReasonPhrase(code));
        this.code = code
    }

    longMessage(): string {
        return `${this.code}: ${this.message}`
    }
}