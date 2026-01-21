// import { useEffect, useState } from "react";
// import { AdminLogin } from "./pages/AdminLogin";
// import { AdminDashboard } from "./pages/AdminDashboard";
// import { TeamDashboard } from "./pages/TeamDashboard";
// import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom';
// import './App.css'

// export const App = () => {
//   const [role, setRole] = useState(localStorage.getItem("role"));
//   const [token, setToken] = useState(localStorage.getItem("token"));

//   const isLoggedIn = !!token;

//   const logout = () => {
//     localStorage.removeItem("token");
//     localStorage.removeItem("role");
//     setToken(null);
//     setRole(null);
//   };

//   if (!isLoggedIn) {
//     return (
//       <AdminLogin
//         onLoginSuccess={(userRole) => {
//           setToken(localStorage.getItem("token"));
//           setRole(userRole);
//         }}
//       />
//     );
//   }

//   if (role === "ADMIN") return <AdminDashboard onLogout={logout} />;
//   if (role === "TEAM_MEMBER") return <TeamDashboard onLogout={logout} />;

//   return (
//     <div>
//       <p>Unauthorized role: {role}</p>
//       <button onClick={logout}>Logout</button>
//     </div>
//   );
// };



import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AdminLogin } from "./pages/AdminLogin";
import { AdminDashboard } from "./pages/AdminDashboard";
import { TeamDashboard } from "./pages/TeamDashboard";
import { ClientDashboard } from "./pages/ClientDashboard"; // 👈 create this page

import "./App.css";

export const App = () => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [role, setRole] = useState(localStorage.getItem("role"));

  const isLoggedIn = !!token;

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setToken(null);
    setRole(null);
  };

  // 🔒 Private Route Wrapper
  const PrivateRoute = ({ allowedRoles, children }) => {
    if (!isLoggedIn) return <Navigate to="/" />;
    if (!allowedRoles.includes(role)) return <Navigate to="/" />;
    return children;
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* LOGIN */}
        <Route
          path="/"
          element={
            isLoggedIn ? (
              role === "ADMIN" ? (
                <Navigate to="/admin" />
              ) : role === "TEAM_MEMBER" ? (
                <Navigate to="/team" />
              ) : role === "CLIENT" ? (
                <Navigate to="/client" />
              ) : (
                <Navigate to="/" />
              )
            ) : (
              <AdminLogin
                onLoginSuccess={(userRole) => {
                  setToken(localStorage.getItem("token"));
                  setRole(userRole);
                }}
              />
            )
          }
        />

        {/* ADMIN */}
        <Route
          path="/admin"
          element={
            <PrivateRoute allowedRoles={["ADMIN"]}>
              <AdminDashboard onLogout={logout} />
            </PrivateRoute>
          }
        />

        {/* TEAM */}
        <Route
          path="/team"
          element={
            <PrivateRoute allowedRoles={["TEAM_MEMBER"]}>
              <TeamDashboard onLogout={logout} />
            </PrivateRoute>
          }
        />

        {/* CLIENT */}
        <Route
          path="/client"
          element={
            <PrivateRoute allowedRoles={["CLIENT"]}>
              <ClientDashboard onLogout={logout} />
            </PrivateRoute>
          }
        />

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
};
