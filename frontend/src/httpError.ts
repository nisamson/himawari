import {getReasonPhrase, StatusCodes} from "http-status-codes";
import {ApiError, BadArgument} from "./errors";

export type AnyHttpError =
    BadRequest
    | Conflict
    | Unauthorized
    | RateLimited
    | Forbidden
    | NotFound
    | InternalError
    | HttpError;

export abstract class RawHttpError extends ApiError {
    readonly code: StatusCodes

    protected constructor(code: StatusCodes) {
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

export class BadRequest extends RawHttpError {
    constructor() {
        super(StatusCodes.BAD_REQUEST);
    }
}

export class Conflict extends RawHttpError {
    constructor() {
        super(StatusCodes.CONFLICT);
    }
}

export class Unauthorized extends RawHttpError {
    constructor() {
        super(StatusCodes.UNAUTHORIZED);
    }
}

export class RateLimited extends RawHttpError {
    constructor() {
        super(StatusCodes.TOO_MANY_REQUESTS);
    }
}

export class Forbidden extends RawHttpError {
    constructor() {
        super(StatusCodes.FORBIDDEN);
    }
}

export class NotFound extends RawHttpError {
    constructor() {
        super(StatusCodes.NOT_FOUND);
    }
}

export class InternalError extends RawHttpError {
    constructor() {
        super(StatusCodes.INTERNAL_SERVER_ERROR);
    }
}

export class HttpError extends RawHttpError {
    constructor(code: StatusCodes) {
        super(code);
    }

    static fromStatus(code: StatusCodes): AnyHttpError {
        switch (code) {
            case StatusCodes.CONFLICT:
                return new Conflict();
            case StatusCodes.FORBIDDEN:
                return new Forbidden();
            case StatusCodes.BAD_REQUEST:
                return new BadRequest();
            case StatusCodes.INTERNAL_SERVER_ERROR:
                return new InternalError();
            case StatusCodes.UNAUTHORIZED:
                return new Unauthorized();
            case StatusCodes.NOT_FOUND:
                return new NotFound();
            case StatusCodes.TOO_MANY_REQUESTS:
                return new RateLimited();
            default:
                return new HttpError(code);
        }
    }
}