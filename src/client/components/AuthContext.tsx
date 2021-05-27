import React, {useReducer} from "react";
import {LoggedInUser, UserRef} from "../model/users";
import {User} from "../../model";
import localforage from "localforage";

export interface AuthInfo {
    info: User.Info,
    jwt: string
}

export type AuthState = AuthInfo | null;

export interface AuthContextState {
    readonly state: AuthState,
    readonly dispatch: React.Dispatch<AuthAction>
}

export interface AuthAction {
    readonly type: "login" | "logout";
    readonly jwt?: string
}

function infoFromJwt(jwt: string | undefined | null): AuthState {
    if (!jwt) {
        return null;
    }

    let loggedIn = LoggedInUser.new(jwt);

    if (loggedIn.isErr()) {
        console.error(loggedIn.error);
        return null;
    } else {
        return {
            info: loggedIn.value,
            jwt
        };
    }
}

const AUTH_KEY = "authTok";

export const AuthContext: React.Context<AuthContextState> = React.createContext({} as AuthContextState);

export function AuthProvider(props: React.PropsWithChildren<{}>) {
    let curState = localStorage.getItem(AUTH_KEY);

    function reducer(state: AuthState, action: AuthAction) {
        switch (action.type) {
            case "login":
                let out = infoFromJwt(action.jwt);
                if (out) {
                    localStorage.setItem(AUTH_KEY, action.jwt!);
                }
                return out;
            case "logout":
                localStorage.removeItem(AUTH_KEY);
                return null;
        }
    }

    const [state, dispatch] = useReducer(reducer, infoFromJwt(curState));

    return <AuthContext.Provider value={{state, dispatch}}>{props.children}</AuthContext.Provider>
}