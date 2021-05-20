import React from "react";
import {UserRef} from "../../model/old_users";


export interface GlobalAuthState {
    currentUser: AuthState,
    setCurrentUser: ((state: AuthState) => void)
}

export class AuthState {
    readonly user: UserRef | null;
    constructor(user: UserRef | null) {
        this.user = user;
    }

    isAuthenticated(): boolean {
        return !!this.user;
    }
}

export const AuthContext = React.createContext({} as GlobalAuthState)
AuthContext.displayName = "AuthContext";
