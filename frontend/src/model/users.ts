import {err, Err, Ok, ok, Result, ResultAsync} from "neverthrow";
import {ApiError, HttpError, SimpleMessageError} from "../errors";
import {StatusCodes} from "http-status-codes";

export class UserRef {
    username: string;

    constructor(username: string) {
        this.username = username;
    }

    async logOut(): Promise<Result<void, HttpError>> {
        let resp = await fetch("/api/login", {
            method: "DELETE",
            credentials: "same-origin"
        });

        if (resp.ok) {
            return ok(undefined);
        } else {
            return err(new HttpError(resp.status));
        }
    }
}

export class LoginUser extends UserRef {
    password: string;

    constructor(username: string, password: string) {
        super(username);
        this.password = password;
    }

    async logIn(): Promise<Result<UserRef, HttpError>> {
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
        } else {
            return err(new HttpError(resp.status));
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

    constructor(username: string, password: string, email: string) {
        super(username, password);
        this.email = email;
    }

    async register(): Promise<Result<void, ApiError>> {
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
            if (resp.status == StatusCodes.CONFLICT) {
                return new Err(new UserAlreadyExists());
            }
            return new Err(new HttpError(resp.status));
        }
    }
}

