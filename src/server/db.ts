import {Entity, PrimaryColumn, Column, createConnection} from "typeorm";
import {PostgresConnectionOptions} from "typeorm/driver/postgres/PostgresConnectionOptions";
import {User} from "./model/entities/users.js";

const options: PostgresConnectionOptions = {
    name: "himawari-db",
    url: process.env.DATABASE_URL,
    connectTimeoutMS: 5000,
    type: "postgres",
    entities: [User],
    logging: true,
    migrations: [],
    migrationsRun: true
}


export const conn = await createConnection(options);