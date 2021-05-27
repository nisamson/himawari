import React, {Context, ReactElement, useReducer} from "react";
import {Alert, Collapse} from "react-bootstrap";

export enum AlertVariant {
    PRIMARY = "primary",
    SECONDARY = "secondary",
    SUCCESS = "success",
    DANGER = "danger",
    WARNING = "warning",
    INFO = "info",
    LIGHT = "light",
    DARK = "dark"
}

export interface AlertInfo {
    header?: string;
    message: string;
    variant: AlertVariant
}

export interface AlertState {
    show: boolean;
    info: AlertInfo;
}

const defaultState: AlertState = {
    show: false,
    info: {
        message: "",
        variant: AlertVariant.PRIMARY
    }
};

export interface AlertAction {
    type: "dismiss" | "show";
    info?: AlertInfo;
}

const storeKey = "ALERT";

interface ProvContext {
    state: AlertState;
    dispatch: React.Dispatch<AlertAction>
};

// @ts-ignore
const store: Context<ProvContext> = React.createContext({});

export function AlertProvider(props: React.PropsWithChildren<{}>) {
    let def;
    try {
        let cur = sessionStorage.getItem(storeKey);
        def = cur ? JSON.parse(cur) as AlertState : defaultState;
    } catch (e) {
        console.error(e);
        def = defaultState;
    }


    function reducer(state: AlertState, action: AlertAction): AlertState {
        let out;
        switch (action.type) {
            case "dismiss":
                out = {
                    ...state,
                    show: false,
                };
                break;
            case "show":
                out = {
                    show: true,
                    info: action.info || defaultState.info
                };
                break;
        }

        try {
            sessionStorage.setItem(storeKey, JSON.stringify(out));
        } catch (e) {
            console.error(e)
        }

        return out;
    }

    const [state, dispatch] = useReducer(reducer, def);

    return <store.Provider value={{state, dispatch}}>{props.children}</store.Provider>;
}

export function AlertDisplay() {
    return <store.Consumer>
        {(alert) =>
            <Alert variant={alert.state.info.variant} onClose={() => alert.dispatch({
                type: "dismiss"
            })} show={alert.state.show} dismissible transition={Collapse}>
                {alert.state.info.header && <Alert.Heading>
                    <span>{alert.state.info.header}</span>
                </Alert.Heading>}
                <p>
                    {alert.state.info.message}
                </p>
            </Alert>
        }
    </store.Consumer>
}

export const AlertConsumer = store.Consumer;