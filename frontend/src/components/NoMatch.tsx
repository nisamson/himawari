
import {useLocation} from "react-router-dom";

export default function () {
    let location = useLocation();

    return <div>
        <h3>Sorry! There isn't a page at <code>{location.pathname}</code>.</h3>
    </div>
}