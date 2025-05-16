import React, { CSSProperties, useState } from "react";
import { Buffer } from 'buffer'; // Required for class-transformer to work
(window as any).Buffer = Buffer;

import 'bootstrap/dist/css/bootstrap.min.css';
import { Modal } from "react-bootstrap";
import { Routes, Route, BrowserRouter } from "react-router-dom";
// import { inject } from '@vercel/analytics';

import "./birdUI.css";
import "./default.css";
import AlgorithmProvider from "./hooks/useAlgorithm";
import AuthProvider from './hooks/useAuth';
import CallbackPage from './pages/CallbackPage';
import Feed from './pages/Feed';
import Footer from './components/Footer';
import Header from './components/Header';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import { logLocaleInfo, logMsg } from "./helpers/string_helpers";


export default function App(): React.ReactElement {
    const [error, setError] = useState<string>("");
    logLocaleInfo();

    if ('serviceWorker' in navigator) {
        console.log('Service Worker is supported, registering...');

        try {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('./service-worker.js');
            });
        } catch (error) {
            console.error('Error registering service worker:', error);
        }
    }

    return (
        <BrowserRouter>
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
                        <Route path="/" element={
                            <ProtectedRoute>
                                <AlgorithmProvider setError={setError}>
                                    <Feed />
                                </AlgorithmProvider>
                            </ProtectedRoute>
                        } />

                        <Route path="/callback" element={<CallbackPage setError={setError} />} />
                        <Route path="/login" element={<LoginPage />} />
                    </Routes>

                    <Footer />
                </div>
            </AuthProvider>
        </BrowserRouter>
    );
};


const containerStyle: CSSProperties = {
    alignItems: 'center',
    backgroundColor: 'black',
    display: 'flex',
    flexDirection: 'column',
    height: 'auto',
};
