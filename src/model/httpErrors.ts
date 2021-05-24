import {getReasonPhrase, StatusCodes} from "http-status-codes";
import {ApiError, BadArgument} from "./errors";

export module Http {
    export type AnyError =
        BadRequest
        | Conflict
        | Unauthorized
        | RateLimited
        | Forbidden
        | NotFound
        | InternalError
        | Error;

    export abstract class RawError extends ApiError {
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

    export class BadRequest extends RawError {
        readonly details: string | null;
        constructor(details?: string) {
            super(StatusCodes.BAD_REQUEST);
            this.details = details || null;
        }

        longMessage(): string {
            let original = super.longMessage();
            if (!this.details) {
                return original;
            } else {
                return `${original}\n${this.details}`
            }
        }
    }

    export class Conflict extends RawError {
        constructor() {
            super(StatusCodes.CONFLICT);
        }
    }

    export class Unauthorized extends RawError {
        constructor() {
            super(StatusCodes.UNAUTHORIZED);
        }
    }

    export class RateLimited extends RawError {
        constructor() {
            super(StatusCodes.TOO_MANY_REQUESTS);
        }
    }

    export class Forbidden extends RawError {
        constructor() {
            super(StatusCodes.FORBIDDEN);
        }
    }

    export class NotFound extends RawError {
        constructor() {
            super(StatusCodes.NOT_FOUND);
        }
    }

    export class InternalError extends RawError {
        constructor() {
            super(StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }

    export class Error extends RawError {
        constructor(code: StatusCodes) {
            super(code);
        }

        static fromStatus(code: StatusCodes): AnyError {
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
                    return new Error(code);
            }
        }
    }
}