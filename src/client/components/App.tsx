import React, {useContext, useEffect, useState} from 'react';
import {BrowserRouter, Switch, Route} from "react-router-dom";
import Home from "./Home";
import Header from "./Header";
import {AuthContext, AuthProvider, AuthState} from "./AuthContext";
import {UserRef} from "../model/users";
import * as localforage from "localforage";
import NoMatch from "./NoMatch";
import Login from "./Login";
import {Helmet} from "react-helmet";
import Privacy from "./Privacy";
import {Link, useHistory} from "react-router-dom";
import {AlertDisplay, AlertProvider} from "./AlertContext";
import {cssTransition, ToastContainer} from "react-toastify";
import {Register} from "./Register";

interface SessionLoader {
    isLoadingSession: boolean;
    setLoadingSession: (loading: boolean) => void;
}

interface AppState extends SessionLoader {
}

function HimaHelmet(props: {
    readonly title?: string;
    readonly description?: string;
}) {
    return <Helmet titleTemplate={"Himawari - %s"} defaultTitle={"Himawari Contest App"}>
        {props.title && <title>{props.title}</title>}
        <meta name={"description"}
              content={props.description ? props.description : "The Himawari contest app, a judging platform for running contests."}/>
    </Helmet>;
}

function App() {

    return (
        <AlertProvider>
            <BrowserRouter>
                <header className={"pb-3"}>
                    <Header/>
                </header>
                <ToastContainer
                    autoClose={5000}
                    position={"top-right"}
                    hideProgressBar={true}
                    transition={cssTransition({
                        enter: "animista-fade-in-right",
                        exit: "animista-fade-out-right"
                    })}
                    pauseOnHover
                    pauseOnFocusLoss
                    closeOnClick
                />
                <div className={"container"}>
                    <AlertDisplay/>
                    <Switch>
                        <Route exact path="/">
                            <HimaHelmet/>
                            <Home/>
                        </Route>
                        <Route exact path="/login">
                            <HimaHelmet title={"Login"}/>
                            {/* @ts-ignore */}
                            <AuthContext.Consumer>
                                {state => <Login state={state}/>}
                            </AuthContext.Consumer>
                        </Route>
                        <Route exact path="/privacy">
                            <HimaHelmet title={"Privacy Policy"}/>
                            <Privacy/>
                        </Route>
                        <Route>
                            <HimaHelmet title={"Register"}/>
                            <Register/>
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
                                  href={"https://github.com/nisamson/himawari"}>Himawari on GitHub</a> | <Link
                            to={"/privacy"} className={"text-muted"}>Privacy Policy</Link></span>
                    </footer>
                </div>
            </BrowserRouter>
        </AlertProvider>
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
