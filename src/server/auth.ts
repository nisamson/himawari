import express from "express";
import {StatusCodes} from "http-status-codes";
import {Validated, Validator, validator} from "./model/validator";
import passport from "passport";
import {Strategy} from "passport-local";
import {WithLogger} from "./log";
import {getConn, isFailedQuery} from "./db";
import {UserEntity} from "./model/entities/users";
import {User} from "../model/users";
import {Http} from "../model";
import * as argon from "argon2";
import {Claims, makeToken} from "./jwt";
import {err, ok, Result} from "neverthrow";
import {IsEmail, MaxLength, validateSync, ValidationError} from "class-validator";
import {QueryFailedError} from "typeorm";
import {PG_CHECK_VIOLATION, PG_UNIQUE_VIOLATION} from "@drdgvhbh/postgres-error-codes";


export const loginRouter = express.Router();

passport.use('login', new Strategy({
        session: false,
        passReqToCallback: true
    },
    async function(req: express.Request & WithLogger, user, pass, done){
        req.log?.debug(`Login attempt for ${user}`);
        let conn = await getConn();
        let repo = conn.getRepository(UserEntity);
        try {
            let storedUser = await repo.findOne({
                username: user
            });

            if (storedUser) {
                if (await argon.verify(storedUser.hash, pass)) {
                    return done(null, storedUser.claims());
                }
            }
        } catch (e) {
            req.log?.error(e);
            return done(new Http.InternalError(), false);
        }
        req.log?.debug("Login failed");
        return done(null, false);
    }
));

loginRouter.route("/")
    .post(async (req: express.Request & WithLogger, res, next) => {
        passport.authenticate('login', async (err, user: Claims | null, info) => {
            try {
                if (err || !user) {
                    return next(err || new Http.Unauthorized());
                }

                req.login(user, {session: false}, (err) => {
                    if (err) return next(err);
                    let token = makeToken(user);
                    return res.json(token);
                });
            } catch (e) {
                return next(e);
            }
        })(req, res, next);
    });

export const registrationRouter = express.Router();

class RegistrationForm implements User.CreationRequest {
    @IsEmail()
    email: string;

    password: User.Password;

    @MaxLength(64)
    username: string;

    private constructor(email: string, password: User.Password, username: string) {
        this.email = email;
        this.password = password;
        this.username = username;
    }

    static new(email: string, password: User.Password, username: string): Result<RegistrationForm, ValidationError[]> {
        let provisional = new RegistrationForm(email, password, username);
        let errs = validateSync(provisional);
        if (errs) {
            return err(errs);
        } else {
            return ok(provisional);
        }
    }

    static fromAny(obj: Partial<{email: string; password: string; username: string}>): Result<RegistrationForm, Http.BadRequest> {
        if (!obj.email || !obj.password || !obj.username) {
            return err(new Http.BadRequest("Missing at least one field."));
        }

        let pass = User.Password.new(obj.password);

        if (pass.isErr()) {
            return err(new Http.BadRequest(JSON.stringify(pass.error)));
        }

        return RegistrationForm.new(obj.email, pass.value, obj.username)
            .mapErr((e) => new Http.BadRequest(JSON.stringify(e)));
    }

}

registrationRouter.route("/")
    .post(validator(RegistrationForm), async (req: express.Request & WithLogger & Partial<Validated<RegistrationForm>>,
                                              res, next) => {
        if (!req.validated) {
            return next(new Http.BadRequest());
        }

        let form = req.validated;

        let conn = await getConn();
        let repo = conn.getRepository(UserEntity);

        let hash = await argon.hash(form.password.value, {
            type: argon.argon2id,
            memoryCost: 37 * 1024,
            timeCost: 1,
            parallelism: 1
        });


        try {
            await repo.insert({
                hash: hash,
                username: form.username,
                displayName: form.username,
                email: form.email,
                emailValidated: false
            });
            req.log?.info(`Registered new user ${form.username}`);
            return res.status(StatusCodes.CREATED).send({message: "Success"})
        } catch (e) {
            if (!isFailedQuery(e)) {
                return next(e);
            }

            switch (e.code) {
                case PG_UNIQUE_VIOLATION:
                    return next(new Http.Conflict());
                case PG_CHECK_VIOLATION:
                    return next(new Http.BadRequest());
                default:
                    return next(e);
            }
        }
    });