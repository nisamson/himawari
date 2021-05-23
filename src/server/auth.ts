import express from "express";
import {StatusCodes} from "http-status-codes";
import {validator} from "./model/validator";
import passport from "passport";
import {Strategy} from "passport-local";
import {WithLogger} from "./log";
import {getConn} from "./db";
import {User} from "./model/entities/users";
import {Http} from "../model";
import * as argon from "argon2";
import {Claims, makeToken} from "./jwt";


export const loginRouter = express.Router();

passport.use('login', new Strategy({
        session: false,
        passReqToCallback: true
    },
    async function(req: express.Request & WithLogger, user, pass, done){
        req.log?.debug(`Login attempt for ${user}`);
        let conn = await getConn();
        let repo = conn.getRepository(User);
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