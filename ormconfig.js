const assert = require("assert");
const dotenv = require("dotenv");
dotenv.config();


assert(process.env.DB_DOMAIN, "DB_DOMAIN must be set to the database domain.");
assert(process.env.DB_USER, "DB_USER must be set to the database user.");
assert(process.env.DB_PASS, "DB_PASS must be set to the database password.");
assert(process.env.DB_PORT, "DB_PORT must be set to a port number.")
let port = parseInt(process.env.DB_PORT);

const options = {
    host: process.env.DB_DOMAIN,
    port: port,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    connectTimeoutMS: 5000,
    type: "postgres",
    entities: ["build_server/server/model/entities/*.js"],
    logging: true,
    migrations: ["build_server/server/model/migrations/*.js"],
    cli: {
        entitiesDir: "src/server/model/entities/",
        migrationsDir: "src/server/model/migrations/"
    }
}

module.exports = options;