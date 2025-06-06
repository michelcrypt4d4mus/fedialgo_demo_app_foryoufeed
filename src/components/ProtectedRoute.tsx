/*
 * Redirect to /login if the user is not authenticated
 */
import React, { ReactElement } from "react";
import { Navigate } from "react-router-dom";

import { useAuthContext } from "../hooks/useAuth";


export default function ProtectedRoute(props: { children: ReactElement }): ReactElement {
    const { user } = useAuthContext();

    if (!user) {  // then user is not authenticated
        return <Navigate to="/login" />;
    }

    return props.children;
};
