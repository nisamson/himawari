import React from "react";
import {Alert, Button, Collapse, Form, OverlayTrigger, Popover} from "react-bootstrap";
import {withRouter, RouteComponentProps} from "react-router-dom";
import {BadLogin, LoginUser} from "../model/users";
import ConditionalWrapper from "./ConditionalWrapper";
import {AuthState, GlobalAuthState} from "./AuthContext";
import {Err} from "neverthrow";
import {Link} from "react-router-dom";
import {Http, User} from "../../model";

interface LoginState {
    username: string;
    password: string;
    lastAlert: (show: boolean) => JSX.Element;
    showAlert: boolean;
    isAuthenticating: boolean;
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
    state: GlobalAuthState,
}


class Login extends React.Component<LoginProps & RouteComponentProps, LoginState> {
    state: LoginState = {
        username: "",
        password: "",
        lastAlert: () => <></>,
        showAlert: false,
        isAuthenticating: false,
    }

    render() {
        let isAuth = this.state.isAuthenticating;
        return <div className={"Button text-center"}>
            <div>{this.state.lastAlert(this.state.showAlert)}</div>
            <h1 className={"mb-3"}>Himawari</h1>

            <h3 className={"mb-3"}>Welcome back! Please log in or <Link to={"/register"}>register</Link>.</h3>
            <Form onSubmit={(e) => this.handleSubmit(e)} className={"form-signin"}>
                <Form.Group controlId="username" id={"user-group"}>
                    <Form.Label className={"sr-only"}>Username</Form.Label>
                    <Form.Control
                        autoFocus
                        type="text"
                        value={this.state.username}
                        isValid={!!this.state.username}
                        onChange={e => this.setState({
                            username: e.target.value
                        })}
                        placeholder={"Username"}
                        required
                    />
                </Form.Group>
                <Form.Group controlId="password" id={"pass-group"}>
                    <Form.Label className={"sr-only"}>Password</Form.Label>
                    <Form.Control
                        type="password"
                        value={this.state.password}
                        onChange={(e) => this.setState({
                            password: e.target.value
                        })}
                        placeholder={"Password"}
                        isValid={
                            User.Password.new(this.state.password).isOk()
                        }
                        required
                    />
                </Form.Group>
                <ConditionalWrapper condition={!this.isValid()} wrapper={Overlay}>
                    <div>
                        <Button block size="lg" variant={"primary"} className={"btn-block"} type="submit"
                                active={this.isValid()} disabled={!this.isValid()}
                                style={!this.isValid() ? {pointerEvents: "none"} : {}}>
                            {isAuth && <span className={"fas fa-sync login-spin text-white"}/>} Login
                        </Button>
                    </div>
                </ConditionalWrapper>

            </Form>
        </div>
    }

    private isValid() {
        return User.Password.new(this.state.password).isOk() && !!this.state.username
    }

    private createLoginAlert(danger: boolean, heading: JSX.Element, contents: JSX.Element) {
        return (show: boolean) => (<Alert variant={danger ? "danger" : "warning"}
                                          show={show}
                                          dismissible
                                          transition={Collapse}
                                          onClose={() => this.clearAlert()}>
            <Alert.Heading>
                {heading}
            </Alert.Heading>
            {contents}
        </Alert>);
    }

    private startLogin() {
        return new Promise((resolve => {
            this.setState({
                isAuthenticating: true
            }, () => resolve(undefined));
        }));

    }

    private endLogin() {
        return new Promise((resolve => {
            this.setState({
                isAuthenticating: false
            }, () => resolve(undefined));
        }));
    }

    private async handleSubmit(event: React.FormEvent) {

        if (!event) {
            return;
        }

        event.preventDefault();


        await this.startLogin();
        let req = new LoginUser(this.state.username, User.Password.new(this.state.password)._unsafeUnwrap());
        await this.endLogin();
        let out = await req.logIn();
        if (out.isErr()) {
            let error = out.error;
            if (!(error instanceof BadLogin)) {
                if (error instanceof Http.RateLimited) {
                    this.setState({
                        lastAlert: this.createLoginAlert(true,
                            <>Too many attempts.</>,
                            <p>
                                You are being rate-limited due to too many login attempts too quickly.
                                Please wait a few moments before trying again.
                            </p>),
                        showAlert: true
                    });
                } else {
                    this.setState({
                        lastAlert: this.createLoginAlert(false,
                            <>Login failed</>,
                            <p>
                                An error occurred {error.longMessage()}
                            </p>),
                        showAlert: true
                    });
                }
            } else {
                this.setState({
                    lastAlert: this.createLoginAlert(true, <>Invalid login.</>,
                        <p>The login failed. Please check your
                            username and password before trying again.</p>),
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


export default withRouter(Login);