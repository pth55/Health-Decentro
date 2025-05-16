import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

// // src/components/ProtectedRoute.tsx
// import { Navigate, Outlet, useLocation } from "react-router-dom";
// import { useAuth } from "../hooks/useAuth";

// type ProtectedRouteProps = {
//   allowedRoles?: ("patient" | "doctor")[];
// };

// export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
//   const { user, loading, userRole } = useAuth();
//   const location = useLocation();

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
//       </div>
//     );
//   }

//   if (!user) {
//     return <Navigate to="/" replace state={{ from: location }} />;
//   }

//   // If allowedRoles is specified, check if the user has the required role
//   if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
//     // Redirect based on role
//     if (userRole === "patient") {
//       return <Navigate to="/dashboard" replace />;
//     } else if (userRole === "doctor") {
//       return <Navigate to="/doctor/dashboard" replace />;
//     }
//     return <Navigate to="/" replace />;
//   }

//   return <Outlet />;
// }
