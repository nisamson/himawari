import {Logger} from "tslog";

import random from "random";
import express from "express";
import * as http from "http";

const consoleLogger = new Logger({name: "console", overwriteConsole: true});

export const baseLogger = new Logger(
    {
        name: "himawari"
    }
)

let requestsSeen = 0;
function generateRequestId(): number {
    requestsSeen++;
    return requestsSeen;
}

interface WithLogger {
    log: Logger
}

export function loggerMiddleware (req: express.Request & Partial<WithLogger>, res: express.Response, next: express.NextFunction) {
    req.log = baseLogger.getChildLogger({
        requestId: generateRequestId().toString()
    })
    next();
}