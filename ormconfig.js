export default {
    type: "postgres",
    url: process.env.DATABASE_URL,
    entities: [
        "build_server/server/model/entities/*.js",
    ],
    migrations: [
        "build_server/server/model/migrations/*.js",
    ],
    cli: {
        "entitiesDir": ["src/server/model/entities/"],
        "migrationsDir": ["src/server/model/migrations/"]
    }
}