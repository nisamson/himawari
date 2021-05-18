import React from "react";
import {HttpError, SimpleMessageError} from "../errors";
import {Alert, Button, Collapse, Form, OverlayTrigger, Popover} from "react-bootstrap";
import {withRouter, RouteComponentProps} from "react-router-dom";
import {LoginUser, Password} from "../model/users";
import ConditionalWrapper from "./ConditionalWrapper";
import {AuthState, GlobalAuthState} from "./AuthContext";
import {Err} from "neverthrow";

interface LoginState {
    username: string;
    password: string;
    lastAlert: (show: boolean) => JSX.Element;
    showAlert: boolean;
}

function Overlay(children: JSX.Element) {
    return <OverlayTrigger overlay={<Popover id={"login-tooltip"} placement={"top"}>
        <Popover.Title as={"h3"}>
            Invalid Form
        </Popover.Title>
        <Popover.Content>
            Please ensure that:
            <ul>
                <li>You have entered a username at least one character long, and</li>
                <li>You have entered at least 4 bytes and no more than 128 bytes into the password field.</li>
            </ul>
        </Popover.Content>
    </Popover>}
                           placement={"top"}
                           trigger={["hover", "focus"]}
    >
        {({ref, ...triggerHandler}) => <div ref={ref} {...triggerHandler}> {children} </div>}
    </OverlayTrigger>;
}

interface LoginProps {
    state: GlobalAuthState
}


export default class Login extends React.Component<LoginProps & RouteComponentProps, LoginState> {
    state: LoginState = {
        username: "",
        password: "",
        lastAlert: () => <></>,
        showAlert: false
    }

    render() {
        return <div>
            <div>{this.state.lastAlert(this.state.showAlert)}</div>
            <Form onSubmit={(e) => this.handleSubmit(e)}>
                <Form.Group controlId="username">
                    <Form.Label>Username</Form.Label>
                    <Form.Control
                        autoFocus
                        type="text"
                        value={this.state.username}
                        isValid={!!this.state.username}
                        onChange={e => this.setState({
                            username: e.target.value
                        })}
                    />
                </Form.Group>
                <Form.Group controlId="password">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                        type="password"
                        value={this.state.password}
                        onChange={(e) => this.setState({
                            password: e.target.value
                        })}
                        isValid={
                            Password.new(this.state.password).isOk()
                        }
                    />
                </Form.Group>
                <ConditionalWrapper condition={!this.isValid()} wrapper={Overlay}>
                    <div>
                        <Button block size="lg" type="submit" active={this.isValid()} disabled={!this.isValid()}
                                style={!this.isValid() ? {pointerEvents: "none"} : {}}>
                            Login
                        </Button>
                    </div>
                </ConditionalWrapper>

            </Form>
        </div>
    }

    private isValid() {
        return Password.new(this.state.password).isOk() && !!this.state.username
    }

    private async handleSubmit(event: React.FormEvent) {

        if (!event) {
            return;
        }

        event.preventDefault();

        let req = new LoginUser(this.state.username, Password.new(this.state.password)._unsafeUnwrap());
        let out = await req.logIn();
        if (out.isErr()) {
            let error = out.error;
            if (error instanceof HttpError) {
                let e = error;
                this.setState({
                    lastAlert: (show) => (<Alert variant={"warning"} show={show} dismissible transition={Collapse} onClose={() => this.clearAlert()}>
                        <Alert.Heading>
                            Login failed.
                        </Alert.Heading>
                        <p>
                            An error occurred: {e.longMessage()}
                        </p>
                    </Alert>),
                    showAlert: true
                });
            } else {
                this.setState({
                    lastAlert: (show) => <Alert variant={"danger"} show={show} dismissible transition={Collapse} onClose={() => this.clearAlert()}>
                        <Alert.Heading>
                            Invalid login.
                        </Alert.Heading>
                        <p>
                            The login failed. Please check your username and password.
                        </p>
                    </Alert>,
                    showAlert: true
                });
            }
        } else {
            this.props.state.setCurrentUser(new AuthState(out.value));
            this.props.history.push("/");
        }
    }

    private clearAlert() {
        this.setState({
            showAlert: false
        })
    }

}

withRouter(Login);