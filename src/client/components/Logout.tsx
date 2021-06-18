import {useHistory} from "react-router-dom";
import {useEffect} from "react";
import {toast} from "react-toastify";
import {AuthContextState} from "./AuthContext";


export default function(props: {state: AuthContextState}) {
    let history = useHistory();

    useEffect(() => {
        props.state.dispatch({type: "logout"});
        toast.info("You are now logged out.");
        history.push("/");
    })

    return <></>
}