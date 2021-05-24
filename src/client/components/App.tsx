import React, {useState} from 'react';
import {BrowserRouter, Switch, Route} from "react-router-dom";
import Home from "./Home";
import Header from "./Header";
import {AuthContext, AuthState, GlobalAuthState} from "./AuthContext";
import {UserRef} from "../model/users";
import NoMatch from "./NoMatch";
import Login from "./Login";
import {Jumbotron} from "react-bootstrap";
import {Helmet} from "react-helmet";
import Privacy from "./Privacy";
import {Link} from "react-router-dom";

interface SessionLoader {
    isLoadingSession: boolean;
    setLoadingSession: (loading: boolean) => void;
}

interface AppState extends GlobalAuthState, SessionLoader {
}

function HimaHelmet(props: {
    readonly title?: string;
    readonly description?: string;
}) {
    return <Helmet titleTemplate={"Himawari - %s"} defaultTitle={"Himawari Contest App"}>
        {props.title && <title>{props.title}</title>}
        <meta name={"description"} content={props.description ? props.description : "The Himawari contest app, a judging platform for running contests."}/>
    </Helmet>;
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
                            <HimaHelmet/>
                            <Home/>
                        </Route>
                        <Route exact path="/login">
                            <HimaHelmet title={"Login"}/>
                            {/* @ts-ignore */}
                            <Login state={state}/>
                        </Route>
                        <Route exact path="/privacy">
                            <HimaHelmet title={"Privacy Policy"}/>
                            <Privacy/>
                        </Route>
                        <Route path={"*"}>
                            <HimaHelmet title={"Not Found"}/>
                            <NoMatch/>
                        </Route>

                    </Switch>
                    <hr/>
                    <footer className={"text-center text-muted"}>
                        <span>Copyright &copy; {copyrightYears()} Nick Samson</span>
                        <br/>
                        <span> <a className={"text-muted"}
                                  href={"https://github.com/nisamson/himawari"}>Himawari on GitHub</a> | <Link to={"/privacy"} className={"text-muted"}>Privacy Policy</Link></span>
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
