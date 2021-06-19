import {useQuery} from "react-query";
import {AuthContextState, AuthState} from "./AuthContext";
import {Contest} from "../../model/contests";
import {Http} from "../../model";
import {useEffect} from "react";
import {toast} from "react-toastify";
import {Redirect} from "react-router-dom";
import LoadingSpinner from "./LoadingSpinner";

export function Contests(props: {state: AuthContextState}) {
    const contests = useQuery<Contest.Info[], Http.Error>(["contests", props.state.state?.jwt], ({queryKey}) => Contest.getForUserOrThrow(queryKey[1] as string));
    useEffect(() => {
        if (contests.isError) {
            toast.error(contests.error.longMessage());
        }
    }, [contests.isError])

    if (!props.state.state) {
        return <Redirect to={"/login"}/>;
    }

    return <div className={"Contests"}>
        {contests.isLoading && <LoadingSpinner/>}
    </div>
}
