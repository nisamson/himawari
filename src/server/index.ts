import dotenv from "dotenv";

const result = dotenv.config();
if (result.error) {
    throw result.error;
}

import express from "express";
import {StatusCodes} from "http-status-codes";

const app = express();
const port = Number.parseInt(process.env.SERVER_PORT || "3000");

app.post('/api/login', (req, res) => {
    res.status(StatusCodes.UNAUTHORIZED)
        .send('Hello World!');
});

app.listen(port, "localhost", () => {
    console.log(`Listening on port ${port}`)
});
