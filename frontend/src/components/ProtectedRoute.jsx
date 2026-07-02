// ProtectedRoute.jsx

import { Navigate } from "react-router-dom";

function ProtectedRoutes({children}){
    const token = sessionStorage.getItem("token");
    if(!token)
        return <Navigate to="/login" replace/>
    return children;
}
export default ProtectedRoutes;