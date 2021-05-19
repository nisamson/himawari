
import {useLocation} from "react-router-dom";

export default function () {
    let location = useLocation();

    return <div className={"text-center"}>
        <h1>404 Not Found</h1>
        <h3>Sorry! There isn't a page at <code>{location.pathname}</code>.</h3>
    </div>
}