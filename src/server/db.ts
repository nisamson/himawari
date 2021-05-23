import assert from "assert";
import AsyncLock from "async-lock";
import {baseLogger} from "./log.js";
import mongoose from "mongoose";
const {Mongoose, connect} = mongoose;

export {};

const lock = new AsyncLock();
let baseConn: typeof Mongoose | null = null;

export default async function() {
    if (!baseConn) {
        await lock.acquire('conn', async () => {
            baseLogger.info("Initializing connection to database.");
            if (baseConn) { return; }
            assert(process.env.DATABASE_URL,
                "You need to specify $DATABASE_URL for the server to connect properly.")
            baseConn = await connect(process.env.DATABASE_URL, {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });
        })
    }

    return baseConn;
}