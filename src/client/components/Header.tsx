import React from 'react';
import {Nav, Navbar, NavDropdown} from "react-bootstrap";
import logo from "../logo.svg";
import {UserRef} from "../../model/old_users";
import {AuthContext, AuthState} from "./AuthContext";
import {Link, NavLink} from "react-router-dom";

interface NavbarArgs {
    currentUser: AuthState
}

interface NavMenuArg {
    currentUser: UserRef
}

function UserNavMenu(props: NavMenuArg) {
    let user = props.currentUser;
    return <Nav.Item>
        <NavDropdown id={"user-nav-dropdown"} title={user.username}>
            <NavDropdown.Divider/>
            <NavDropdown.Item as={Link} to={"/logout"}>Logout</NavDropdown.Item>
        </NavDropdown>
    </Nav.Item>
}

function NavbarLogin(props: NavbarArgs) {
    if (props.currentUser.user) {
        return <UserNavMenu currentUser={props.currentUser.user}/>
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
}

function Header() {
    return <Navbar bg="dark" variant="dark" expand="lg">
        <Navbar.Brand as={Link} to="/">
            <img
                src={logo}
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
                <AuthContext.Consumer>
                    {state => <NavbarLogin currentUser={state.currentUser}/>}
                </AuthContext.Consumer>
            </Nav>
        </Navbar.Collapse>
    </Navbar>
}

export default Header;