// PublicRoute.jsx

import { Navigate } from "react-router-dom";

function PublicRoute({ children }) {
    const token = sessionStorage.getItem("token");
    if (token)  
        return <Navigate to="/chat" replace />;
    return children;
}
export default PublicRoute;