import {createConnection, Connection, QueryFailedError} from "typeorm";
import {PostgresConnectionOptions} from "typeorm/driver/postgres/PostgresConnectionOptions";
import {UserEntity} from "./model/entities/users";
import AsyncLock from "async-lock";
import assert from "assert";
import {InitUsers1621753068278} from "./model/migrations/1621753068278-InitUsers";
import {DatabaseError} from "pg-protocol";
import {ContestEntity, EntryEntity} from "./model/entities/contests";
import {InitContests1623225915473} from "./model/migrations/1623225915473-InitContests";

assert(process.env.DB_DOMAIN, "DB_DOMAIN must be set to the database domain.");
assert(process.env.DB_USER, "DB_USER must be set to the database user.");
assert(process.env.DB_PASS, "DB_PASS must be set to the database password.");
assert(process.env.DB_PORT, "DB_PORT must be set to a port number.")
let port = parseInt(process.env.DB_PORT);

const options: PostgresConnectionOptions = {
    name: "himawari-db",
    host: process.env.DB_DOMAIN,
    port: port,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    connectTimeoutMS: 5000,
    type: "postgres",
    entities: [UserEntity, ContestEntity, EntryEntity],
    logging: ["warn"],
    migrations: [InitUsers1621753068278, InitContests1623225915473],
}

const lock = new AsyncLock();
let conn: Connection | null = null;

export async function getConn(){
    if (!conn) {
        await lock.acquire("conn", async () => {
            // Recheck because someone could have assigned while we were waiting.
            if (!conn) {
                conn = await createConnection(options);
            }
        });
    }
    return conn!;
}

export function isFailedQuery(err: any): err is QueryFailedError & DatabaseError {
    return err.code && err instanceof QueryFailedError;
}
