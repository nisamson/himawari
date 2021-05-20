import React, {useState} from 'react';
import {BrowserRouter, Switch, Route} from "react-router-dom";
import Home from "./Home";
import Header from "./Header";
import {AuthContext, AuthState, GlobalAuthState} from "./AuthContext";
import {UserRef} from "../../model/old_users";
import NoMatch from "./NoMatch";
import Login from "./Login";
import {Jumbotron} from "react-bootstrap";

interface SessionLoader {
    isLoadingSession: boolean;
    setLoadingSession: (loading: boolean) => void;
}

interface AppState extends GlobalAuthState, SessionLoader {
}

function App() {
    const [currentUser, setCurrentUser] = useState(new AuthState(null));
    const [isLoadingSession, setLoadingSession] = useState(true);
    const state: AppState = {
        currentUser: currentUser,
        setCurrentUser: setCurrentUser,
        isLoadingSession: isLoadingSession,
        setLoadingSession: setLoadingSession
    }

    return (
            <AuthContext.Provider value={state}>
                <BrowserRouter>
                    <header className={"pb-3"}>
                        <Header/>
                    </header>
                    <div className={"container"}>
                        <Switch>
                            <Route exact path="/">
                                <Home/>
                            </Route>
                            <Route exact path="/login">
                                {/* @ts-ignore */}
                                <Login state={state}/>
                            </Route>
                            <Route path={"*"}>
                                <NoMatch/>
                            </Route>
                        </Switch>
                        <hr/>
                        <footer className={"text-center text-muted"}>
                            <span>Copyright &copy; {copyrightYears()} Nick Samson</span>
                            <br/>
                            <span> <a className={"text-muted"}
                                      href={"https://github.com/nisamson/himawari"}>Himawari on GitHub</a></span>
                        </footer>
                    </div>

                </BrowserRouter>
            </AuthContext.Provider>
        );

}
function copyrightYears() {
    let now = new Date().getFullYear();
    if (now !== 2021) {
        return `2021-${now}`;
    } else {
        return "2021";
    }
}

export default App;
