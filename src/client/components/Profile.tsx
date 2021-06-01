import {AuthContext, AuthContextState} from "./AuthContext";
import {PropsWithoutRef} from "react";
import {ListGroup, ListGroupItem, Row} from "react-bootstrap";

function ProfileInfo(props: PropsWithoutRef<{}> & {state: AuthContextState}) {
    let state = props.state;
    let info = state.state!.info;
    return <div className={"profile-info align-content-center"}>
        <h1>Profile - {info.displayName} {info.displayName === info.username ? "" : `(${info.username})`}</h1>
        <hr/>
        <ListGroup>
            <ListGroupItem>
                    <div className={"col-form-label"}>Username</div>
                    <div className={"col-auto"}>{info.username}</div>
            </ListGroupItem>
            <ListGroupItem>
                <div className={"col-form-label"}>Display Name</div>
                <div className={"col-auto"}>{info.displayName}</div>
            </ListGroupItem>
            <ListGroupItem>
                <div className={"col-form-label"}>Email</div>
                <div className={"col-auto"}>{info.email}</div>
            </ListGroupItem>
            <ListGroupItem>
                <div className={"col-form-label"}>Created</div>
                <div className={"col-auto"}>{info.created.toLocaleString()}</div>
            </ListGroupItem>
        </ListGroup>
    </div>
}

export function Profile() {
    return <div className={"Profile"}>
        <AuthContext.Consumer>
            {state => <ProfileInfo state={state}/>}
        </AuthContext.Consumer>
    </div>;
}