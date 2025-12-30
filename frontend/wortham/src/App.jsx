

// export const App = () => {


//   const [isLoggedIn, SetLoggedIn] = useState(
//     !!localStorage.getItem("token")
//   );


//   return<>


//       {isLoggedIn ? (
//         <AdminDashboard onLogout={()=> SetLoggedIn(false)}/>
//       ):(
//         <AdminLogin onLoginSuccess={()=> SetLoggedIn(true)}/>
//       )}
//   </>


// }



import { useEffect, useState } from "react";
import { AdminLogin } from "./pages/AdminLogin";
import { AdminDashboard } from "./pages/AdminDashboard";
import { TeamDashboard } from "./pages/TeamDashboard";
import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom';
import './app.css'

export const App = () => {
  const [role, setRole] = useState(localStorage.getItem("role"));
  const [token, setToken] = useState(localStorage.getItem("token"));

  const isLoggedIn = !!token;

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setToken(null);
    setRole(null);
  };

  if (!isLoggedIn) {
    return (
      <AdminLogin
        onLoginSuccess={(userRole) => {
          setToken(localStorage.getItem("token"));
          setRole(userRole);
        }}
      />
    );
  }

  if (role === "ADMIN") return <AdminDashboard onLogout={logout} />;
  if (role === "TEAM_MEMBER") return <TeamDashboard onLogout={logout} />;

  return (
    <div>
      <p>Unauthorized role: {role}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
};
