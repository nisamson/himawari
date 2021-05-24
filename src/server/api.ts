import express from "express";
import {loginRouter, registrationRouter} from "./auth";
import {WithLogger} from "./log";


export const apiRouter = express.Router();

apiRouter.use("/login", loginRouter);
apiRouter.route("/report-csp-violation")
    .post(async (req: express.Request & Partial<WithLogger>, res, next) => {
        req.log?.debug(req.body)
    });

apiRouter.use("/register", registrationRouter);