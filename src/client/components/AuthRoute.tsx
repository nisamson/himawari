import {PropsWithChildren} from "react";
import {Redirect, Route} from "react-router-dom";
import {AuthContext, AuthContextState, AuthProvider} from "./AuthContext";

export default function (props: PropsWithChildren<any>) {
    let {children, ...rest} = props;
    return <AuthContext.Consumer>
        {state =>
            <Route {...rest} render={({location}) => {
                return state.state ? children : <Redirect to={{
                    pathname: "/login",
                    state: {from: location}
                }}/>;
            }}/>
        }</AuthContext.Consumer>
}