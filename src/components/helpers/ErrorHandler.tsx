"use client"; // TODO: wtf is this?

/*
 * Generic omponent to display a set of filter options with a switchbar at the top.
 */
import React, { CSSProperties, PropsWithChildren, createContext, useContext, useState } from "react";

import { ErrorBoundary } from "react-error-boundary";
import { Modal } from "react-bootstrap";

import BugReportLink, { BUG_REPORT_WEBFINGER_URI } from "./BugReportLink";

interface ErrorContextProps {
    setError?: (error: string) => void,
};

const ErrorContext = createContext<ErrorContextProps>({});
export const useError = () => useContext(ErrorContext);


export default function ErrorHandler(props: PropsWithChildren) {
    const [error, setError] = useState<string>("");

    const errorPage = (fallbackError?: Error, resetErrorBoundary?: () => void) => {
        console.log(`ErrorHandler: errorPage() called with error: ${fallbackError?.message}`);

        return (
            <div style={{backgroundColor: "black", color: "white", fontSize: "16px", padding: "100px"}}>
                <h1>Something went wrong!</h1>

                <p style={errorParagraph}>
                    Error: {fallbackError.message}
                </p>

                <p style={errorParagraph}>
                    <BugReportLink />
                </p>
            </div>
        );
    };

    return (
        <ErrorBoundary fallbackRender={({ error, resetErrorBoundary }) => errorPage(error, resetErrorBoundary)}>
            <Modal show={error !== ""} onHide={() => setError("")} style={{color: "black"}}>
                <Modal.Header closeButton>
                    <Modal.Title>Error</Modal.Title>
                </Modal.Header>

                <Modal.Body>{error}</Modal.Body>
            </Modal>

            <ErrorContext.Provider value={{setError}}>
                {props.children}
            </ErrorContext.Provider>
        </ErrorBoundary>
    );
};


const errorParagraph: CSSProperties = {
    marginTop: "20px",
};
