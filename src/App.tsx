import * as React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Routes, Route, BrowserRouter } from "react-router-dom";

import { inject } from '@vercel/analytics';

import AuthProvider from './hooks/useAuth';
import CallbackPage from './pages/CallbackPage';
import Feed from './pages/Feed';
import Footer from './components/Footer';
import Header from './components/Header';
import LoginPage from './pages/LoginPage';
import LogoutPage from './pages/LogoutPage';
import ProtectedRoute from './components/ProtectedRoute';


const App: React.FC = () => {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js');
        });
    }

    if (process.env.NODE_ENV === "production") inject();

    return (
        <BrowserRouter>
            <AuthProvider>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        height: '100vh'
                    }}
                    className='container-fluid'
                >
                    <Header />
                    <Routes>
                        <Route path="/" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
                        <Route path="/callback" element={<CallbackPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/logout" element={<LogoutPage />} />
                    </Routes>
                    <Footer />
                </div>
            </AuthProvider>
        </BrowserRouter>
    );
};

export default App;
