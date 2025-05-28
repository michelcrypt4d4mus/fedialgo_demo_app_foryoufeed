/*
 * Generic omponent to display a set of filter options with a switchbar at the top.
 * Note this doesn't handle errors from event handlers: https://kentcdodds.com/blog/use-react-error-boundary-to-handle-errors-in-react
 */
import { CSSProperties, PropsWithChildren, createContext, useContext, useState } from "react";
import { Modal } from "react-bootstrap";

import { ErrorBoundary } from "react-error-boundary";

import { ComponentLogger } from "../../helpers/log_helpers";
import BugReportLink from "./BugReportLink";

const logger = new ComponentLogger("ErrorHandler");

interface ErrorContextProps {
    setError?: (error: string) => void,
};

const ErrorContext = createContext<ErrorContextProps>({});
export const useError = () => useContext(ErrorContext);


export default function ErrorHandler(props: PropsWithChildren) {
    const [errorMsg, setError] = useState<string>("");

    const errorPage = ({ error, resetErrorBoundary }) => {
        logger.error(`ErrorHandler: errorPage() called with error: ${error}`);

        return (
            <div style={{backgroundColor: "black", color: "white", fontSize: "16px", padding: "100px"}}>
                <h1>Something went wrong!</h1>

                <p style={errorParagraph}>
                    Error: {error.message}
                </p>

                <p style={errorParagraph}>
                    <BugReportLink />
                </p>
            </div>
        );
    };

    return (
        <ErrorBoundary fallbackRender={errorPage}>
            <Modal show={errorMsg !== ""} onHide={() => setError("")} style={{color: "black"}}>
                <Modal.Header closeButton>
                    <Modal.Title>Error</Modal.Title>
                </Modal.Header>

                <Modal.Body>{errorMsg}</Modal.Body>
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
