import {err, Err, Ok, ok, Result, ResultAsync} from "neverthrow";
import {User, Http, SimpleMessageError} from "himawari-model";
import {StatusCodes} from "http-status-codes";

export class UserRef implements User.Ref {
    username: string;

    constructor(username: string) {
        this.username = username;
    }

    async logOut(): Promise<Result<void, Http.AnyError>> {
        let resp = await fetch("/api/login", {
            method: "DELETE",
            credentials: "same-origin"
        });

        if (resp.ok) {
            return ok(undefined);
        } else {
            return err(Http.Error.fromStatus(resp.status));
        }
    }
}

export class BadLogin extends SimpleMessageError {
    constructor() {
        super("Invalid login. Please check your username and password.");
    }
}

export class LoginUser extends UserRef implements User.LoginRequest {
    password: User.Password;

    constructor(username: string, password: User.Password) {
        super(username);
        this.password = password;
    }

    async logIn(): Promise<Result<UserRef, Http.AnyError | BadLogin>> {
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
            return err(Http.Error.fromStatus(resp.status));
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

export class CreateUser extends LoginUser implements User.CreationRequest {
    email: string;

    constructor(username: string, password: User.Password, email: string) {
        super(username, password);
        this.email = email;
    }

    async register(): Promise<Result<void, Http.Error | UserAlreadyExists>> {
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
            return new Err(Http.Error.fromStatus(resp.status));
        }
    }
}

