import { useEffect, useState } from "react";
import { UploadToDrive } from "../components/UploadToDrive";

export const ClientProjectDetails = ({ project, onClose }) => {
  const API = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");

  const [files, setFiles] = useState([]);

  const fetchFiles = () => {
    fetch(`${API}/api/client/projects/${project._id}/files`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((r) => r.json())
      .then((d) => setFiles(d.files || []));
  };

  useEffect(fetchFiles, [project._id]);

  return (
    <div
      style={{
        marginTop: 30,
        padding: 20,
        border: "2px solid #000",
      }}
    >
      <button onClick={onClose}>Close</button>

      <h2>{project.name}</h2>

      {/* 🔹 STAGES */}
      <h3>Project Stages</h3>
      {project.stages?.map((s) => (
        <div key={s.key} style={{ marginBottom: 8 }}>
          <strong>{s.stageName}</strong> — {s.status}
        </div>
      ))}

      {/* 🔹 UPLOAD */}
      <h3 style={{ marginTop: 20 }}>Upload Files</h3>
      <UploadToDrive
        clientId={project.client}
        project={project}
        onUploaded={fetchFiles}
      />

      {/* 🔹 FILES + REMARKS */}
      <h3 style={{ marginTop: 20 }}>Files & Remarks</h3>

      {files.map((f) => (
        <div
          key={f._id}
          style={{
            border: "1px solid #ddd",
            padding: 12,
            marginBottom: 10,
          }}
        >
          <a href={f.driveLink} target="_blank">
            {f.fileName}
          </a>

          <textarea
            defaultValue={f.remark}
            placeholder="Your remarks..."
            style={{ width: "100%", marginTop: 6 }}
            onBlur={(e) =>
              fetch(`${API}/api/files/remark/${f._id}`, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ remark: e.target.value }),
              })
            }
          />
        </div>
      ))}
    </div>
  );
};
