/*
 * https://stackoverflow.com/questions/70687611/react-router-v6-change-component-based-on-query-string
 */
import React, { CSSProperties, useEffect, useState } from "react";

import 'bootstrap/dist/css/bootstrap.min.css';
import { useLocation, useNavigate } from "react-router-dom";
import { useSearchParams } from "react-router-dom";

import AlgorithmProvider from "../hooks/useAlgorithm";
import CallbackPage from "../pages/CallbackPage";
import Feed from "../pages/Feed";
import ProtectedRoute from "./ProtectedRoute";

interface CallbackWrapperProps {
    setError?: (error: string) => void,
};


export default function CallbackWrapper(props: CallbackWrapperProps): React.ReactElement {
    const { setError } = props;
    // const navigate = useNavigate();
    // const location = useLocation();
    // const currentPath = location.pathname;

    const [searchParams, setSearchParams] = useSearchParams();
    console.log(`[CallbackWrapper] searchParams:`, searchParams);
    const callbackCode = searchParams.get("code");

    if (callbackCode) {
        return <CallbackPage searchParams={searchParams} setError={setError} />;
    } else {
        return (
            <ProtectedRoute>
                <AlgorithmProvider setError={setError}>
                    <Feed />
                </AlgorithmProvider>
            </ProtectedRoute>
        );
    }
};
