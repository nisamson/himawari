import {validateSync, ValidationError} from "class-validator";


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