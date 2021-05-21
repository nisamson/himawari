import express from "express";
import {StatusCodes} from "http-status-codes";
import {validator} from "./model/validator.js";


export const loginRouter = express.Router();

loginRouter.route("/")
    .post((req, res) => {
        res.status(StatusCodes.UNAUTHORIZED)
            .send("Not implemented yet");
    })
    .delete(((req, res) => {
        res.status(StatusCodes.UNAUTHORIZED)
            .send("Not implemented yet");
    }));