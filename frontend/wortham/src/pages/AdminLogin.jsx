import "../assets/css/admin.css";
import { useState } from "react";

export const AdminLogin = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // ✅ boolean

  const loginHandle = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Login failed");
      }

      const user = data.user || data.admin || {};
      if (!data.token) throw new Error("Token missing from response");
      if (!user.role) throw new Error("Role missing from response");

      // ✅ save token + role
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", user.role);
      if (user.name) localStorage.setItem("name", user.name);

      // ✅ Only allow ADMIN or TEAM_MEMBER (client ko abhi block)
      if (user.role !== "ADMIN" && user.role !== "TEAM_MEMBER") {
        throw new Error("Access not allowed for this portal");
      }

      // ✅ parent ko role bhejo
      if (typeof onLoginSuccess === "function") {
        onLoginSuccess(user.role);
      }
    } catch (err) {
      setError(err.message || "Login Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-first">
      <div className="inside-login-first">
        <div className="inside-login-first-img"></div>

        <div className="inside-login-first-form">
          <form onSubmit={loginHandle}>
            <h1>Login</h1>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
            />

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
            />

            {error && (
              <p style={{ color: "red", fontSize: "14px", marginTop: "4px" }}>
                {error}
              </p>
            )}

            <button type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
