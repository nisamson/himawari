import {err, ok, Result} from "neverthrow";
import {SimpleMessageError} from "./errors";
import {Length, MaxLength, MinLength, validateSync} from "class-validator";

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

    export interface VerifiedCreationRequest extends CreationRequest {
        captchaToken: string;
    }

    export interface Info extends Ref {
        email: string;
        created: Date;
        displayName: string;
    }

    export class InvalidPassword extends SimpleMessageError {
        constructor() {
            super("Passwords must be between 4 and 128 bytes long, inclusive.");
        }
    }

    export class Password {
        @Length(4, 128, {always: true})
        readonly value: string;

        private constructor(value: string) {
            this.value = value;
        }

        private isValid(): boolean {
            return validateSync(this,
                {validationError: {target: false, value: false}}).length === 0;
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