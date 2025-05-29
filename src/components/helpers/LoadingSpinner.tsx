/*
 * Loading spinner.
 */
import Spinner from 'react-bootstrap/esm/Spinner';
import { CSSProperties } from 'react';

import { READY_TO_LOAD_MSG } from "fedialgo";

import { config } from '../../config';

interface LoadingSpinnerProps {
    isFullPage?: boolean,
    message?: string,
    style?: CSSProperties,
};


export default function LoadingSpinner(props: LoadingSpinnerProps) {
    const { isFullPage, message, style } = props;
    const spinnerStyle = isFullPage ? fullPageCenteredSpinner : inlineSpinner;

    return (
        <div style={{...spinnerStyle, ...(style || {})}}>
            {isFullPage
                ? <Spinner animation={config.app.loadingSpinnerType} />
                : <Spinner animation={config.app.loadingSpinnerType} size="sm" />}

            <div style={{marginLeft: "12px"}}>
                <p>{`${message || READY_TO_LOAD_MSG}...`}</p>
            </div>
        </div>
    );
};


const centeredSpinner: CSSProperties = {
    alignItems: "center",
    display: 'flex',
    flexDirection: "row",
    justifyContent: "center",
    verticalAlign: "center",
};

export const fullPageCenteredSpinner: CSSProperties = {
    ...centeredSpinner,
    flex: 1,
    height: "100vh",
};

const inlineSpinner: CSSProperties = {
    ...centeredSpinner,
    height: "20px",
    justifyContent: "start",
    marginTop: "5px",
};
