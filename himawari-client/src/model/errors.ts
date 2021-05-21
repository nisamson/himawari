
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