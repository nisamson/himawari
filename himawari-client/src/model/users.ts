import {err, Err, Ok, ok, Result, ResultAsync} from "neverthrow";
import {ApiError, SimpleMessageError} from "../errors";
import {StatusCodes} from "http-status-codes";
import {HttpError, AnyHttpError} from "../httpError";

export class UserRef {
    username: string;

    constructor(username: string) {
        this.username = username;
    }

    async logOut(): Promise<Result<void, AnyHttpError>> {
        let resp = await fetch("/api/login", {
            method: "DELETE",
            credentials: "same-origin"
        });

        if (resp.ok) {
            return ok(undefined);
        } else {
            return err(HttpError.fromStatus(resp.status));
        }
    }
}

export class BadLogin extends SimpleMessageError {
    constructor() {
        super("Invalid login. Please check your username and password.");
    }
}

export class LoginUser extends UserRef {
    password: Password;

    constructor(username: string, password: Password) {
        super(username);
        this.password = password;
    }

    async logIn(): Promise<Result<UserRef, AnyHttpError | BadLogin>> {
        let resp = await fetch("/api/login", {
            method: "POST",
            body: JSON.stringify(this),
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (resp.ok) {
            return ok(new UserRef(this.username));
        } else if (![StatusCodes.UNAUTHORIZED, StatusCodes.BAD_REQUEST].includes(resp.status)) {
            return err(HttpError.fromStatus(resp.status));
        } else {
            return err(new BadLogin())
        }
    }
}


export class UserAlreadyExists extends SimpleMessageError {
    constructor() {
        super("A user with that username already exists.");
    }
}

export class CreateUser extends LoginUser {
    email: string;

    constructor(username: string, password: Password, email: string) {
        super(username, password);
        this.email = email;
    }

    async register(): Promise<Result<void, AnyHttpError | UserAlreadyExists>> {
        let resp = await fetch("/api/register", {
            method: "POST",
            body: JSON.stringify(this),
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "same-origin"
        });

        if (resp.ok) {
            return new Ok(undefined);
        } else {
            if (resp.status === StatusCodes.CONFLICT) {
                return new Err(new UserAlreadyExists());
            }
            return new Err(HttpError.fromStatus(resp.status));
        }
    }
}

export class InvalidPassword extends SimpleMessageError {
    constructor() {
        super("Passwords must be between 4 and 128 bytes long, inclusive.");
    }
}

export class Password {
    readonly value: string;

    private constructor(value: string) {
        this.value = value;
    }

    private isValid(): boolean {
        return this.value.length >= 4 && this.value.length <= 128;
    }

    static new(value: string): Result<Password, InvalidPassword> {
        let out = new Password(value);
        if (out.isValid()) {
            return ok(out);
        } else {
            return err(new InvalidPassword());
        }
    }

    toJSON(): string {
        return this.value;
    }
}

