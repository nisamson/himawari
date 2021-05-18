import React from "react";


interface ConditionalWrapperProps {
    condition: boolean,
    wrapper: ((children: JSX.Element) => JSX.Element)
    children: JSX.Element
}

export default function({
    condition,
    wrapper,
    children
}: React.PropsWithChildren<ConditionalWrapperProps>) {
    return condition ? wrapper(children) : children
}