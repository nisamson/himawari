import {validateSync, ValidationError} from "class-validator";
import {ValidationFailure} from "./errors";


type Constructor = new (...args: any[]) => {};

export function Validator<T extends Constructor>(base: T) {
    return class Validatable extends base {
        validateSync(): ValidationError[] {
            return validateSync(this);
        }

        isValid() {
            return this.validateSync().length === 0
        }
    }
}

export function validateOrThrow(obj: object) {
    let res = validateSync(obj);
    if (res.length > 0) {
        throw new ValidationFailure(res);
    }
}