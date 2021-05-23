import passport from "passport";
import {Strategy, ExtractJwt} from "passport-jwt";
import * as passjwt from "passport-jwt";
import assert from "assert";
import {User} from "../model";
import {User as UserEntity} from "./model/entities/users";
import {getConn} from "./db";
import express from "express";
import {WithLogger} from "./log";
import jwt from "jsonwebtoken";

assert(process.env.HASH_KEY, "$HASH_KEY must be set or non-empty.");
assert(process.env.DOMAIN, "$DOMAIN must be set or non-empty.");

passport.use('jwt', new Strategy(
    {
        secretOrKey: process.env.HASH_KEY,
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        issuer: process.env.DOMAIN,
        passReqToCallback: true
    },
    async (req: express.Request & Partial<WithLogger>, jwt_payload: any, done: passjwt.VerifiedCallback) => {
        let ref: User.Ref = {
            username: jwt_payload.sub
        }

        let conn = await getConn();
        let repo = conn.getRepository(UserEntity);
        try {
            let user = await repo.findOne({
                username: ref.username
            });
            if (user) {
                let user_info: User.Info = user.claims();
                return done(null, user_info);
            }
        } catch (e) {
            req.log?.error(e);
            return done(e, false);
        }

        return done(null, false, {message: "No such user"});
    }
));

export interface WithUser {
    readonly user: User.Info;
}

export type Claims = User.Info;

export function makeToken(ref: Claims): string {
    return jwt.sign({
            sub: ref.username,
            email: ref.email,
            displayName: ref.displayName,
            created: ref.created
        },
        process.env.HASH_KEY!,
        {
            issuer: process.env.DOMAIN!,
            expiresIn: "7d",
            algorithm: "HS256"
        }
    );
}

