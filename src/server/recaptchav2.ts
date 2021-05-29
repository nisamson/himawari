import {IsFQDN, Max, Min, validateSync, ValidationError} from "class-validator";
import {err, ok, Result} from "neverthrow";
import assert from "assert";
import * as https from "https";
import axios, {AxiosResponse} from "axios";
import {baseLogger} from "./log";
import {Logger} from "tslog";
import qs from "qs";


export enum ErrorCode {
    MISSING_SECRET = "missing-input-secret",
    INVALID_SECRET = "invalid-input-secret",
    MISSING_RESPONSE = "missing-input-response",
    INVALID_RESPONSE = "invalid-input-response",
    BAD_REQUEST = "bad-request",
    TIMEOUT_OR_DUPLICATE = "timeout-or-duplicate"
}

export interface RawRecaptchaResponse {
    success: boolean;
    challenge_ts: string;
    hostname: string;
    "error-codes"?: ErrorCode[];
}

const RECAPTCHA_URL = "https://www.google.com/recaptcha/api/siteverify";

export interface RecaptchaRequest {
    secret: string;
    response: string;
    remoteip?: string;
}

export const DEFAULT_THRESHOLD = 0.5;

export class RecaptchaV2Response {
    success: boolean;
    challengeTs: Date;
    @IsFQDN()
    hostname: string;
    errorCodes?: ErrorCode[]

    private constructor(success: boolean, challengeTs: Date, hostname: string, errorCodes: ErrorCode[]) {
        this.success = success;
        this.challengeTs = challengeTs;
        this.hostname = hostname;
        this.errorCodes = errorCodes;
    }

    static new(resp: Partial<RawRecaptchaResponse>): Result<RecaptchaV2Response, ErrorCode[] | ValidationError[] | Error> {
        // Will give the wrong error on a 0 score, but that's probably a bot anyways.
        if (!(resp.challenge_ts && resp.hostname)) {
            if (resp["error-codes"]) {
                return err(resp["error-codes"]);
            }
            return err(new Error("Missing attribute from response."));
        }

        if (!resp["error-codes"]) {
            resp["error-codes"] = [];
        }

        if (typeof resp.success === "undefined") {
            return err(new Error("Missing success attribute"));
        }
        let ts;
        try {
            ts = new Date(resp.challenge_ts);
        } catch (e) {
            return err(e);
        }

        let provisional = new RecaptchaV2Response(resp.success, ts, resp.hostname, resp["error-codes"]);
        let errs = validateSync(this);
        if (errs.length !== 0) {
            return err(errs);
        }

        return ok(provisional);
    }
}

assert(process.env.RECAPTCHA_SECRET_KEY, "RECAPTCHA_SECRET_KEY must be set.");

export async function verifyRecaptcha(token: string, logger?: Logger): Promise<Result<RecaptchaV2Response, ErrorCode[] | ValidationError[] | Error>> {
    let req: RecaptchaRequest = {
        secret: process.env.RECAPTCHA_SECRET_KEY!,
        response: token,
    };

    let resp: AxiosResponse<RawRecaptchaResponse> = await axios.post(RECAPTCHA_URL, qs.stringify(req), {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
        }
    });
    logger?.debug(resp.data);
    return RecaptchaV2Response.new(resp.data);
}