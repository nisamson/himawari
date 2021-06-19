import {Length} from "class-validator";
import {Http} from "./httpErrors";
import {err, ok, Result} from "neverthrow";
import {Validator} from "./validation";
import {StatusCodes} from "http-status-codes";


export namespace Contest {
    export interface Info {
        id: number;
        name: string;
        owner: string;
        created: Date;
    }

    export async function getForUser(tok: string | undefined): Promise<Result<Info[], Http.Error>> {

        if (!tok) {
            return err(Http.Error.fromStatus(StatusCodes.UNAUTHORIZED));
        }

        let res = await fetch("/api/contest", {
            method: "GET",
            headers: {
                "Authorization": `Bearer: ${tok}`
            }
        });

        if (!res.ok) {
            return err(Http.Error.fromStatus(res.status));
        } else {
            return ok(await res.json());
        }
    }

    export async function getForUserOrThrow(tok: string | undefined): Promise<Info[]> {
        let res = await getForUser(tok);
        if (res.isErr()) {
            throw res.error;
        } else {
            return res.value;
        }
    }

    class _New {
        constructor(name: string) {
            this.name = name;
        }

        @Length(1, 1024)
        name: string;

        async create(tok: string): Promise<Result<Info, Http.Error>> {
            let res = await fetch("/api/contest", {
                method: "POST",
                headers: {
                    "Authentication": `Bearer: ${tok}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(this)
            });

            if (!res.ok) {
                return err(Http.Error.fromStatus(res.status));
            } else {
                return ok(await res.json());
            }
        }
    }

    export const New = Validator(_New);

}