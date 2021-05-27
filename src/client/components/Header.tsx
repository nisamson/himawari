import React from 'react';
import {Alert, Nav, Navbar, NavDropdown, Toast} from "react-bootstrap";
import {UserRef} from "../model/users";
import {AuthContext, AuthState, GlobalAuthState} from "./AuthContext";
import {Link, NavLink, useHistory} from "react-router-dom";
import {AlertAction, AlertConsumer, AlertVariant} from "./AlertContext";
import {toast} from "react-toastify";

interface NavMenuArg {
    authState: GlobalAuthState
}

function UserNavMenu(props: NavMenuArg) {
    let user = props.authState.currentUser.user!;
    let history = useHistory();

    function logout(_e: React.MouseEvent) {
        props.authState.setCurrentUser(new AuthState(null));
        toast.info("You are now logged out.");
        history.push("/");
    }

    return <Nav.Item>
        <NavDropdown id={"user-nav-dropdown"} title={user.username}>
            <NavDropdown.Divider/>
            <NavDropdown.Item href={"#"} onClick={logout}>Logout</NavDropdown.Item>
        </NavDropdown>
    </Nav.Item>
}

function NavbarLogin() {
    return <AuthContext.Consumer>
        {function (state) {
            if (state.currentUser.user) {
                return <UserNavMenu authState={state}/>
            } else {
                return <>
                    <Nav.Item>
                        <Nav.Link as={NavLink} to={"/login"} activeClassName={"active"}>Login</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link as={NavLink} to={"/register"} activeClassName={"active"}>Register</Nav.Link>
                    </Nav.Item>
                </>
            }
        }}
    </AuthContext.Consumer>
}

function Header() {
    return <Navbar bg="dark" variant="dark" expand="lg">
        <Navbar.Brand as={Link} to="/">
            <img
                src="/favicon.svg"
                width="30"
                height="30"
                className="d-inline-block align-top"
                alt="Himawari logo"
            />{' '}
            Himawari
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav"/>
        <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="mr-auto">
                <Nav.Item>
                    <Nav.Link as={NavLink} to={"/"} exact={true} activeClassName={"active"}>Home</Nav.Link>
                </Nav.Item>
                <NavbarLogin/>
            </Nav>
        </Navbar.Collapse>
    </Navbar>
}

export default Header;