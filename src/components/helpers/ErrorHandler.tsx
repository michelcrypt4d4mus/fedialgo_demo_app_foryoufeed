/*
 * Generic omponent to display a set of filter options with a switchbar at the top.
 * Note this doesn't handle errors from event handlers: https://kentcdodds.com/blog/use-react-error-boundary-to-handle-errors-in-react
 */
import { CSSProperties, PropsWithChildren, ReactNode, createContext, useContext, useState } from "react";
import { Modal } from "react-bootstrap";

import { ErrorBoundary } from "react-error-boundary";
import { isString } from "lodash";
import { Logger } from "fedialgo";

import BugReportLink from "./BugReportLink";
import { config } from "../../config";
import { extractText } from "../../helpers/react_helpers";
import { getLogger } from "../../helpers/log_helpers";
import { isEmptyStr } from "../../helpers/string_helpers";
import { rawErrorContainer } from "../../helpers/style_helpers";

const errorLogger = getLogger("ErrorHandler");

type ErrorLogProps = {
    args?: any;
    errorObj?: Error;
    logger?: Logger;
    msg: string;
    note?: string;
};


interface ErrorContextProps {
    logAndSetError?: (msg: Logger | Error | string, ...args: unknown[]) => void,
    logAndSetFormattedError?: (props: ErrorLogProps) => void,
    resetErrors?: () => void,
    setErrorMsg?: (error: string) => void,
};

const ErrorContext = createContext<ErrorContextProps>({});
export const useError = () => useContext(ErrorContext);


export default function ErrorHandler(props: PropsWithChildren) {
    // If there's a non empty string in errorMsg, the error modal will be shown
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [errorNote, setErrorNote] = useState<string | null>(null);
    const [errorObj, setErrorObj] = useState<Error | null>(null);

    const resetErrors = () => {
        setErrorMsg(null);
        setErrorNote(null);
        setErrorObj(null);
    }

    // TODO: this error page rendering is a bit unresolved / not 100% correct, but it works for now.
    const errorPage = ({ error, resetErrorBoundary }) => {
        errorLogger.error(`ErrorHandler: errorPage() called with error: ${error}`);

        return (
            <div style={errorContainer}>
                <h1>Something went wrong!</h1>

                <p style={{...rawErrorInPopup, margin: "50px"}}>
                    Error: {error.message}
                </p>

                <p>
                    <BugReportLink />
                </p>

                <div style={{marginTop: "50px"}}>
                    <button
                        className="btn btn-primary"
                        onClick={() => {
                            resetErrorBoundary();
                            resetErrors();
                        }}
                    >
                        Try again
                    </button>
                </div>
            </div>
        );
    };

    // First argument can be the Logger you wish to use to write the error
    // If first non Logger arg is a string, that will be put in setError()
    // for the user to see and the actual rest of the args (including any Errors) will be logged.
    const logAndSetError = (error: Logger | Error | ReactNode, ...args: any[]) => {
        let firstArg: any = error;
        let logger = errorLogger;

        // If the first argument is a Logger use it to log the error
        if (error instanceof Logger) {
            logger = error;

            if (!args.length) {
                logger.error("logAndSetError called with a Logger but no message!");
                return;
            }

            firstArg = args.shift();
        }

        // Dig out the first Error argument from the args list (if any)
        const errorArg = firstArg instanceof Error ? firstArg : args.find((arg) => arg instanceof Error);
        const formattedErrorMsg = logger.error(firstArg, ...args);

        if (errorArg) {
            setErrorObj(errorArg);
            if (!(firstArg instanceof Error)) setErrorMsg(firstArg);
        } else {
            setErrorMsg(formattedErrorMsg);
        }
    }

    // Accepts the 3 parts of an error popup as separate props (see ErrorLogProps above).
    // args props is not shown to the user but they are passed through to the logger.
    const logAndSetFormattedError = (errorProps: ErrorLogProps) => {
        let { args, errorObj, logger, msg, note } = errorProps;
        setErrorObj(errorObj || null);
        setErrorNote(note || null);
        setErrorMsg(msg);
        args ||= [];

        // Handle writing to console log, which means putting errorObj first for Logger
        args = Array.isArray(args) ? args : [args];
        args = errorObj ? [errorObj, ...args] : args;
        let logMsg: string = isString(msg) ? msg : (extractText(msg) as string[]).join(' '); // TODO: WTF with extractText() here?
        logMsg += isEmptyStr(note) ? '' : `\n(note: ${note})`;
        (logger || errorLogger).error(logMsg, ...args);
    }

    return (
        <ErrorBoundary fallbackRender={errorPage}>
            <Modal
                dialogClassName="modal-lg"
                onHide={resetErrors}
                show={!!errorMsg || !!errorObj}
                style={{color: "black"}}
            >
                <Modal.Header closeButton>
                    <Modal.Title>Error</Modal.Title>
                </Modal.Header>

                <Modal.Body style={errorModalBody}>
                    {errorMsg && (
                        isString(errorMsg)
                            ? <p style={errorHeadline}>{(errorMsg as string).length ? errorMsg : "No message."}</p>
                            : errorMsg)}

                    {errorNote &&
                        <p style={errorNoteStyle}>{errorNote}</p>}

                    {errorObj &&
                        <div style={rawErrorContainer}>
                            <p style={rawErrorInPopup}>
                                {errorObj.toString()}
                            </p>
                        </div>}
                </Modal.Body>
            </Modal>

            <ErrorContext.Provider value={{
                logAndSetFormattedError,
                logAndSetError,
                resetErrors,
                setErrorMsg
            }}>
                {props.children}
            </ErrorContext.Provider>
        </ErrorBoundary>
    );
};


const errorContainer: CSSProperties = {
    backgroundColor: "black",
    color: "white",
    fontSize: config.theme.errorFontSize,
    padding: "100px"
};

const errorHeadline: CSSProperties = {
    color: "black",
    fontSize: config.theme.errorFontSize,
    fontWeight: "bold",
    marginBottom: "10px",
    width: "100%",
};

const errorModalBody: CSSProperties = {
    backgroundColor: "pink",
    display: "flex",
    flexDirection: "column",
    paddingTop: "20px",
    paddingBottom: "20px",
    paddingLeft: "40px",
    paddingRight: "40px",
};

const errorNoteStyle: CSSProperties = {
    color: "black",
    fontSize: config.theme.errorFontSize - 4,
};

const rawErrorInPopup: CSSProperties = {
    backgroundColor: "black",
    color: "red",
    fontSize: config.theme.errorFontSize + 1,
    width: "100%",
};
