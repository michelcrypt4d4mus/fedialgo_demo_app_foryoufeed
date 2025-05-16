/*
 * https://stackoverflow.com/questions/70687611/react-router-v6-change-component-based-on-query-string
 */
import React, { CSSProperties, useEffect, useState } from "react";

import 'bootstrap/dist/css/bootstrap.min.css';
import { Modal } from "react-bootstrap";
import { Routes, Route, BrowserRouter, HashRouter, useSearchParams } from "react-router-dom";
import { useLocation, useNavigate } from "react-router-dom";

import AlgorithmProvider from "../hooks/useAlgorithm";
import CallbackPage from "../pages/CallbackPage";
import Feed from "../pages/Feed";
import ProtectedRoute from "./ProtectedRoute";

interface CallbackWrapperProps {
    setError?: (error: string) => void,
};


function CallbackWrapper() {
    const navigate = useNavigate();
    const location = useLocation();
    const currentPath = location.pathname;

    const AdminPage = (props) => {
    const [searchParams, setSearchParams] = useSearchParams();

    const pageId = searchParams.get("id");

    const Page = adminPages[pageId] || adminPages["one"];



    if (searchParams) {
        return <CallbackPage searchParams={searchParams} />;
        

        return (
            <ProtectedRoute>
                <AlgorithmProvider setError={setError}>
                    <Feed />
                </AlgorithmProvider>
            </ProtectedRoute>
        )
    }
    return <Page {...props} />;

    // Use currentPath to determine the current route
    logMsg(`<NotFoundPage> currentPath: "${currentPath}", location:`, location);

    useEffect(() => {
        navigate('/');
    }, [navigate]);

    return <div>Redirecting...</div>;
}
