import { useEffect, useState } from "react";
import { ClientProjectDetails } from "./ClientProjectDetails";

export const ClientDashboard = ({ onLogout }) => {
  const API = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");

  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);

  // useEffect(() => {
  //   fetch(`${API}/api/client/projects`, {
  //     headers: {
  //       Authorization: `Bearer ${token}`,
  //     },
  //   })
  //     .then((r) => r.json())
  //     .then((d) => setProjects(d.projects || []));
  // }, []);


  useEffect(() => {
  if (!token) return;

  fetch(`${API}/api/client/projects`, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((r) => r.json())
    .then((d) => setProjects(d.projects || []));
}, [API, token]);

  return (
    <div style={{ padding: 20 }}>
      <h1>Client Dashboard</h1>
      <button onClick={onLogout}>Logout</button>

      <h2 style={{ marginTop: 30 }}>My Projects</h2>

      <div style={{ display: "grid", gap: 16 }}>
        {projects.map((p) => (
          <div
            key={p._id}
            style={{
              border: "1px solid #ddd",
              padding: 14,
              cursor: "pointer",
            }}
            onClick={() => setActiveProject(p)}
          >
            <h3>{p.name}</h3>
            <p>Status: {p.status}</p>
          </div>
        ))}
      </div>

      {activeProject && (
        <ClientProjectDetails
          project={activeProject}
          onClose={() => setActiveProject(null)}
        />
      )}
    </div>
  );
};
