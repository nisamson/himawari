import {Button, Container, Form, Jumbotron} from "react-bootstrap";
import React, {useRef, useState} from "react";
import {Link, useHistory} from "react-router-dom";
import {User} from "../../model";
import {validateSync, IsEmail, Length, ValidationError} from "class-validator";
import {err, ok, Result} from "neverthrow";
import {load} from "recaptcha-v3";
import {toast} from "react-toastify";
import {CreateUser} from "../model/users";
import useStateWithCallback, {useStateWithCallbackLazy} from "use-state-with-callback";
import ReCAPTCHA from "react-google-recaptcha";

class RegistrationForm {

    @IsEmail({}, {groups: ["email"]})
    readonly email: string;

    @Length(4, 128, {groups: ["password"]})
    readonly password: string;

    @Length(1, 64, {groups: ["username"]})
    readonly username: string;

    constructor(username: string, email: string, password: string) {
        this.username = username;
        this.password = password;
        this.email = email;
    }

    validUsername(): Result<void, ValidationError[]> {
        let res = validateSync(this, {
            groups: ["username"]
        });

        if (res.length > 0) {
            return err(res);
        } else {
            return ok(void (0));
        }
    }

    validPassword(): Result<User.Password, User.InvalidPassword> {
        return User.Password.new(this.password);
    }

    validEmail(): Result<void, ValidationError[]> {
        let res = validateSync(this, {
            groups: ["email"]
        });

        if (res.length > 0) {
            return err(res);
        } else {
            return ok(void (0));
        }
    }

    validate(): Result<User.CreationRequest, ValidationError[]> {
        let res = validateSync(this);
        if (res.length > 0) {
            return err(res);
        } else {
            return ok({
                username: this.username,
                email: this.email,
                password: User.Password.new(this.password)._unsafeUnwrap()
            });
        }
    }
}

const recaptchaRef = React.createRef<ReCAPTCHA>();

export function Register() {

    let [username, setUsername] = useState("");
    let [password, setPassword] = useState("");
    let [passwordConfirm, setPasswordConfirm] = useState("");
    let [email, setEmail] = useState("");
    let [emailConfirm, setEmailConfirm] = useState("");
    let [captchaToken, setCaptchaToken] = useState("" as string | null)
    let [authenticating, setAuthenticating] = useStateWithCallbackLazy(false);
    let history = useHistory();

    let regForm = new RegistrationForm(username, email, password);

    function passwordInvalid(): string | false {
        let match = password === passwordConfirm;
        if (!match) {
            return "Passwords must match.";
        }

        let passReg = regForm.validPassword();
        if (passReg.isErr()) {
            return passReg.error.message;
        }

        return false;
    }

    function emailInvalid(): string | false {
        let match = email === emailConfirm;
        if (!match) {
            return "Email must match.";
        }

        let passReg = regForm.validEmail();
        if (passReg.isErr()) {
            return passReg.error[0].toString(false);
        }

        return false;
    }

    function isValid(): Result<void, ValidationError[] | string> {
        let pass = passwordInvalid();
        if (pass) {
            return err(pass);
        }

        let email = emailInvalid();
        if (email) {
            return err(email);
        }

        if (!captchaToken) {
            return err("Captcha hasn't been set.");
        }

        let v = regForm.validate();
        if (v.isErr()) {
            return err(v.error);
        }

        return ok(void (0));
    }

    let validated = isValid();

    async function handleSubmit(event: React.FormEvent) {

        if (!event) {
            return;
        }

        event.preventDefault();

        try {
            await new Promise<void>((resolve) => {
                setAuthenticating(true, () => {
                    resolve()
                });
            });

            if (validated.isErr()) {
                return;
            }

            let form: User.VerifiedCreationRequest = {
                captchaToken: captchaToken!,
                password: regForm.validPassword()._unsafeUnwrap(),
                email: regForm.email,
                username: regForm.username
            };

            let res = await new CreateUser(
                form.username,
                form.password,
                form.email,
                form.captchaToken)
                .register();

            if (res.isErr()) {
                toast.error(res.error.toString());
            } else {
                toast.success("Created account! You can now log in.");
                history.push("/");
                return;
            }

        } catch (e) {
            console.error(e);
            toast.error("An error occurred while trying to submit the form. Try again later.");
        }

        await new Promise<void>((resolve) => {
            setAuthenticating(false, () => {
                resolve()
            });
        });

        setCaptchaToken(null);
        recaptchaRef.current!.reset();
    }

    return <div className={"Register text-center"}>
        <Jumbotron>
            <h1 className={"mb-3"}>Himawari</h1>
            <h3 className={"mb-3"}>Welcome! Please create an account or <Link to={"/login"}>login</Link>.</h3>
            <Form onSubmit={(e) => handleSubmit(e)} className={"form-register"}>
                <Form.Group controlId={"username"} id={"user-group"}>
                    <Form.Label className={"sr-only"}>Username</Form.Label>
                    <Form.Control
                        autoFocus
                        type={"text"}
                        value={username}
                        autoComplete={"username"}
                        isValid={regForm.validUsername().isOk()}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder={"Username"}
                        required
                    />
                </Form.Group>
                <Form.Group controlId={"email"} id={"email-group"}>
                    <Form.Label className={"sr-only"}>Email</Form.Label>
                    <Form.Control
                        type={"email"}
                        value={email}
                        isValid={!emailInvalid()}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={"Email"}
                        required
                    />
                </Form.Group>
                <Form.Group controlId={"emailConfirm"} id={"email-confirm-group"}>
                    <Form.Label className={"sr-only"}>Confirm Email</Form.Label>
                    <Form.Control
                        type={"email"}
                        value={emailConfirm}
                        isValid={!emailInvalid()}
                        onChange={(e) => setEmailConfirm(e.target.value)}
                        placeholder={"Confirm Email"}
                        required
                    />
                </Form.Group>
                <Form.Group controlId={"password"} id={"password-group"}>
                    <Form.Label className={"sr-only"}>Password</Form.Label>
                    <Form.Control
                        type={"password"}
                        value={password}
                        autoComplete={"new-password"}
                        isValid={!passwordInvalid()}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={"Password"}
                        required
                    />
                </Form.Group>
                <Form.Group controlId={"passwordConfirm"} id={"password-confirm-group"}>
                    <Form.Label className={"sr-only"}>Confirm Password</Form.Label>
                    <Form.Control
                        type={"password"}
                        value={passwordConfirm}
                        autoComplete={"new-password"}
                        isValid={!passwordInvalid()}
                        onChange={(e) => setPasswordConfirm(e.target.value)}
                        placeholder={"Confirm Password"}
                        required
                    />
                </Form.Group>
                <ReCAPTCHA sitekey={"6LeD-voaAAAAAEUgls6a3FQJDB56w-OpRjd5bBja"}
                           onChange={setCaptchaToken}
                           ref={recaptchaRef}
                />
                <Button block size="lg" variant={"primary"} className={"btn-block mt-3"} type="submit"
                        active={validated.isOk() && !authenticating} disabled={validated.isErr() || authenticating}
                        style={(validated.isErr() || authenticating) ? {pointerEvents: "none"} : {}}>
                    {authenticating && <span className={"fas fa-sync animation-spin text-white"}/>} Register
                </Button>

            </Form>
        </Jumbotron>
    </div>
}