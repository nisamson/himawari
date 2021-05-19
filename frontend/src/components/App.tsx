import React from 'react';
import {BrowserRouter, Switch, Route} from "react-router-dom";
import Home from "./Home";
import Header from "./Header";
import {AuthContext, AuthState, GlobalAuthState} from "./AuthContext";
import {UserRef} from "../model/users";
import NoMatch from "./NoMatch";
import Login from "./Login";
import {Jumbotron} from "react-bootstrap";

interface SessionLoader {
    isLoadingSession: boolean;
    setLoadingSession: (loading: boolean) => void;
}

interface AppState extends GlobalAuthState, SessionLoader {
}

class App extends React.Component<{}, AppState> {
    state: AppState = {
        currentUser: new AuthState(null),
        setCurrentUser: (state: AuthState) => {
            this.setState({
                currentUser: state
            })
        },
        isLoadingSession: true,
        setLoadingSession: loading => {
            this.setState({
                isLoadingSession: loading
            })
        }
    };

    render() {
        return (
            <AuthContext.Provider value={this.state}>
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
                                <Login state={this.state}/>
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
