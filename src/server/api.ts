import express from "express";
import {loginRouter} from "./auth.js";


export const apiRouter = express.Router();

apiRouter.use("/login", loginRouter);
apiRouter.route("/report-csp-violation")
    .post(async (req, res, next) => {

    });