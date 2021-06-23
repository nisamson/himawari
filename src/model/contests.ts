import {IsFQDN, Length, MaxLength, validateSync, ValidationError} from "class-validator";
import {Http} from "./httpErrors";
import {err, ok, Result} from "neverthrow";
import {validateOrThrow, Validator} from "./validation";
import {StatusCodes} from "http-status-codes";
import {$NewEntry, Entry as FullEntry, EntryMeta, NewEntry} from "./gen";
import {ValidationFailure} from "./errors";


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
            let json = await res.json();
            let parsed = json.map((val: {id: number, name: string, owner: string, created: string}) => {
                return {
                    ...val,
                    created: new Date(val.created)
                }
            })
            return ok(parsed);
        }
    }

    export async function deleteContest(tok: string, id: number): Promise<Result<void, Http.Error>> {
        let res = await fetch(`/api/contest/${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer: ${tok}`
            }
        });

        if (!res.ok) {
            return err(Http.Error.fromStatus(res.status));
        }
        return ok(undefined);
    }

    export async function getForUserOrThrow(tok: string | undefined): Promise<Info[]> {
        let res = await getForUser(tok);
        if (res.isErr()) {
            throw res.error;
        } else {
            return res.value;
        }
    }

    export class New {
        constructor(name: string) {
            this.name = name;
            validateOrThrow(this);
        }

        @Length(1, 1024)
        name: string;

        async create(tok: string): Promise<Result<Info, Http.Error>> {
            let res = await fetch("/api/contest", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer: ${tok}`,
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

    export namespace Entry {
        export type Meta = EntryMeta;
        export type Info = FullEntry;
        export class New implements NewEntry {
            contestId: number;
            @Length(1, $NewEntry.properties.creator.maxLength)
            creator: string;
            @Length(1, $NewEntry.properties.name.maxLength)
            name: string;
            @MaxLength($NewEntry.properties.url.maxLength)
            url: string;
            constructor(contestId: number, creator: string, name: string, url: string) {
                this.contestId = contestId;
                this.creator = creator;
                this.name = name;

                try {
                    if (url) {
                        new URL(url);
                    }
                } catch (e) {
                    throw new ValidationFailure(e.message)
                }

                this.url = url;

                validateOrThrow(this);
            }

            async create(tok: string): Promise<Result<Meta, Http.Error>> {
                let res = await fetch(`/api/entry`, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer: ${tok}`,
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

        export async function getEntry(tok: string, entryId: number): Promise<Result<Info, Http.Error>> {
            let res = await fetch(`/api/entry/${entryId}`, {
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

        export async function deleteEntry(tok: string, entryId: number): Promise<Result<void, Http.Error>> {
            let res = await fetch(`/api/entry/${entryId}`, {
                method: "DELETE",
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
    }

}