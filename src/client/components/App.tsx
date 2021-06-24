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
import {Profile} from "./Profile";
import Logout from "./Logout";
import AuthRoute from "./AuthRoute";
import {Contests} from "./Contests";
import {QueryClient, QueryClientProvider} from "react-query";
import {Container} from "react-bootstrap";

interface SessionLoader {
    isLoadingSession: boolean;
    setLoadingSession: (loading: boolean) => void;
}

interface AppState extends SessionLoader {
}

function HimaHelmet(props: {
    readonly title?: string;
    readonly description?: string;
    readonly disableCSP?: boolean;
}) {
    return <Helmet titleTemplate={"Himawari - %s"} defaultTitle={"Himawari Contest App"}>
        {props.disableCSP || <meta httpEquiv="Content-Security-Policy"
                                   content="
            default-src 'self';
            font-src https://cdnjs.cloudflare.com;
            script-src 'self' https://cdn.jsdelivr.net/npm/bootstrap@4.6.0/dist/css/bootstrap.min.css
            https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css
            https://www.google.com/recaptcha/
            https://www.gstatic.com/recaptcha/;
            img-src 'self' https: data:;
            style-src 'self' https://cdn.jsdelivr.net/npm/bootstrap@4.6.0/dist/css/bootstrap.min.css
            https://cdn.jsdelivr.net/npm/react-toastify@7.0.4/dist/ReactToastify.min.css
            https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css
            https://www.google.com/recaptcha/
            https://www.gstatic.com/recaptcha/;
            frame-src 'self' https://www.google.com/recaptcha/ https://recaptcha.google.com/recaptcha/;
        "
        />}
        {props.title && <title>{props.title}</title>}
        <meta name={"description"}
              content={props.description ? props.description : "The Himawari contest app, a judging platform for running contests."}/>
    </Helmet>;
}

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
        },
    },
});

function App() {

    return (
        <AlertProvider>
            <QueryClientProvider client={queryClient}>
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
                    <Container>
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
                            <Route exact path="/logout">
                                <HimaHelmet title={"Logout"}/>
                                <AuthContext.Consumer>
                                    {state => <Logout state={state}/>}
                                </AuthContext.Consumer>
                            </Route>
                            <Route exact path="/privacy">
                                <HimaHelmet title={"Privacy Policy"}/>
                                <Privacy/>
                            </Route>
                            <Route exact path={"/register"}>
                                <HimaHelmet title={"Register"}/>
                                <Register/>
                            </Route>
                            <Route exact path={"/profile"}>
                                <HimaHelmet title={"Profile"}/>
                                <Profile/>
                            </Route>
                            <Route exact path={"/docs"} render={() => window.location.href = "/docs.html"}/>
                            <AuthRoute exact path={"/contests"}>
                                <HimaHelmet title={"My Contests"}/>
                                <AuthContext.Consumer>
                                    {state => <Contests state={state}/>}
                                </AuthContext.Consumer>
                            </AuthRoute>
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
                                to={"/privacy"} className={"text-muted"}>Privacy Policy</Link> | <Link to={"/docs"}
                                                                                                       className={"text-muted"}>Docs</Link></span>
                        </footer>
                    </Container>
                </BrowserRouter>
            </QueryClientProvider>
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
