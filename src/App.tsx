import React, { CSSProperties, useEffect, useState } from "react";
import { Buffer } from 'buffer'; // Required for class-transformer to work
(window as any).Buffer = Buffer;

import 'bootstrap/dist/css/bootstrap.min.css';
import { Modal } from "react-bootstrap";
import { Routes, Route, BrowserRouter, HashRouter } from "react-router-dom";
import { useLocation, useNavigate } from "react-router-dom";
// import { inject } from '@vercel/analytics';

import "./birdUI.css";
import "./default.css";
import AlgorithmProvider from "./hooks/useAlgorithm";
import AuthProvider from './hooks/useAuth';
import CallbackWrapper from "./components/CallbackWrapper";
import CallbackPage from './pages/CallbackPage';
import Feed from './pages/Feed';
import Footer from './components/Footer';
import Header from './components/Header';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import { isProduction } from './helpers/react_helpers';
import { logLocaleInfo, logMsg } from "./helpers/string_helpers";


export default function App(): React.ReactElement {
    const [error, setError] = useState<string>("");
    logLocaleInfo();

    if ('serviceWorker' in navigator) {
        console.log('Service Worker is supported, registering...');

        // Service worker for github pages: https://gist.github.com/kosamari/7c5d1e8449b2fbc97d372675f16b566e
        try {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('./service-worker.js');
            });
        } catch (error) {
            console.error('Error registering service worker:', error);
        }
    }

    return (
        <HashRouter basename={isProduction ? "/fedialgo_demo_app_foryoufeed" : "/"}>
            <AuthProvider>
                <div className='container-fluid min-vh-100' style={containerStyle}>
                    <Modal show={error !== ""} onHide={() => setError("")} style={{color: "black"}}>
                        <Modal.Header closeButton>
                            <Modal.Title>Error</Modal.Title>
                        </Modal.Header>

                        <Modal.Body>{error}</Modal.Body>
                    </Modal>

                    <Header />

                    <Routes>
                        <Route path="/" element={<CallbackWrapper setError={setError} />} />
                        <Route path="/callback" element={<CallbackPage setError={setError} />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="*" element={<NotFoundPage />} />
                    </Routes>

                    <Footer />
                </div>
            </AuthProvider>
        </HashRouter>
    );
};


const containerStyle: CSSProperties = {
    alignItems: 'center',
    backgroundColor: 'black',
    display: 'flex',
    flexDirection: 'column',
    height: 'auto',
};


function NotFoundPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const currentPath = location.pathname;

    // Use currentPath to determine the current route
    logMsg(`<NotFoundPage> currentPath: "${currentPath}", location:`, location);

    useEffect(() => {
        navigate('/');
    }, [navigate]);

    return <div>Redirecting...</div>;
}
