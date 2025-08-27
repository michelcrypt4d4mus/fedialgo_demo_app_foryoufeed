import React, { CSSProperties, useEffect } from "react";
import { Buffer } from "buffer"; // Required for class-transformer to work
(window as any).Buffer = Buffer;

import "bootstrap/dist/css/bootstrap.min.css";
import { Routes, Route, HashRouter } from "react-router-dom";
import { useLocation, useNavigate } from "react-router-dom";
// import { inject } from "@vercel/analytics";

import "./birdUI.css";
import "./default.css";
import AlgorithmProvider from "./hooks/useAlgorithm";
import AuthProvider from "./hooks/useAuth";
import CallbackPage from "./pages/CallbackPage";
import ErrorHandler from "./components/helpers/ErrorHandler";
import Feed from "./pages/Feed";
import Footer from "./components/Footer";
import Header from "./components/Header";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { getLogger, logLocaleInfo } from "./helpers/log_helpers";
import { blackBackground } from "./helpers/style_helpers";

const logger = getLogger("App.tsx");


export default function App(): React.ReactElement {
    logLocaleInfo();

    // This is a workaround for Github pages (which only allows GET query params), the HashRouter,
    // and OAuth redirects. OAuth redirects cannot include a hash and Github Pages doesn't accept
    // any route URLs without a hash.
    //       otherwise this: http://localhost:3000/?code=abcdafwgwdgw
    //    is routed to this: http://localhost:3000/?code=abcdafwgwdgw#/login
    // From: https://github.com/auth0/auth0-spa-js/issues/407
    if (window.location.href.includes("?code=")){
        const newUrl = window.location.href.replace(/\/(\?code=.*)/, '/#/callback$1')
        logger.trace(`<App.tsx> OAuth callback to "${window.location.href}", redirecting to "${newUrl}"`);
        window.location.href = newUrl;
    }

    if ("serviceWorker" in navigator) {
        logger.log("Service Worker is supported, registering...");

        // Service worker for github pages: https://gist.github.com/kosamari/7c5d1e8449b2fbc97d372675f16b566e
        try {
            window.addEventListener("load", () => {
                navigator.serviceWorker.register("./service-worker.js");
            });
        } catch (error) {
            logger.error("Error registering service worker:", error);
        }
    }

    return (
        <HashRouter>
            <div className="container-fluid min-vh-100" style={containerStyle}>
                <ErrorHandler>
                    <AuthProvider>
                        <Header />

                        <Routes>
                            <Route path="/" element={
                                <ProtectedRoute>
                                    <AlgorithmProvider>
                                        <Feed />
                                    </AlgorithmProvider>
                                </ProtectedRoute>
                            } />

                            <Route path="/callback" element={<CallbackPage/>} />
                            <Route path="/login" element={<LoginPage/>} />
                            <Route path="*" element={<NotFoundPage />} />
                        </Routes>

                        <Footer />
                    </AuthProvider>
                </ErrorHandler>
            </div>
        </HashRouter>
    );
};


const containerStyle: CSSProperties = {
    ...blackBackground,
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
    height: "auto",
};


function NotFoundPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const currentPath = location.pathname;

    logger.log(`<NotFoundPage> You shouldn't be here! currentPath: "${currentPath}", location:`, location);
    useEffect(() => {navigate("/")}, [navigate]);
    return <div>Redirecting...</div>;
};
