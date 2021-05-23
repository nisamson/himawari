import dotenv from "dotenv";

import "reflect-metadata";

import morgan from "morgan";

const result = dotenv.config();
if (result.error) {
    throw result.error;
}

import express from "express";
import {apiRouter} from "./api";
import {loggerMiddleware, baseLogger} from "./log";
import {getConn} from "./db";

export async function go() {
    // Initialize the database connection.
    await getConn();

    const app = express();
    const port = Number.parseInt(process.env.SERVER_PORT || "3000");
    const logger = morgan("dev");

    app.use(logger);
    app.use(loggerMiddleware);
    app.use(express.json());
    app.use("/api", apiRouter);

    app.listen(port, "localhost", () => {
        baseLogger.info(`Listening on port ${port}`)
    });
}