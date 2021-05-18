import React from 'react';
import {BrowserRouter, Switch, Route} from "react-router-dom";
import Home from "./Home";
import Header from "./Header";
import {AuthContext, AuthState, GlobalAuthState} from "./AuthContext";
import {UserRef} from "../model/users";
import NoMatch from "./NoMatch";
import Login from "./Login";
import {Jumbotron} from "react-bootstrap";

interface AppState extends GlobalAuthState {}

class App extends React.Component<{}, AppState> {
    state: AppState = {
        currentUser: new AuthState(null),
        setCurrentUser: (state: AuthState) => {
            this.setState({
                currentUser: state
            })
        }
    };

    render() {

        return (
            <AuthContext.Provider value={this.state}>
                <BrowserRouter>
                    <header>
                        <Header/>
                    </header>
                    <Jumbotron>
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
                    </Jumbotron>
                </BrowserRouter>
            </AuthContext.Provider>
        );
    }
}

export default App;
