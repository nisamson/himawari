import {err, ok, Result} from "neverthrow";
import {SimpleMessageError} from "./errors";

export module User {
    export interface Ref {
        username: string;
    }

    export interface LoginRequest extends Ref {
        password: Password;
    }

    export interface CreationRequest extends LoginRequest {
        email: string;
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
}