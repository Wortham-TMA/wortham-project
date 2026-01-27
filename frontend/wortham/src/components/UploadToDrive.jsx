import { useEffect, useRef, useState } from "react";

export const UploadToDrive = ({ clientId, project, onUploaded }) => {
  const API = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");

  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [progress, setProgress] = useState(0);

  const fileRef = useRef(null);

  const uploadFile = async () => {
    try {
      setMsg("");
      setProgress(0);

      if (!file) throw new Error("Please choose a file");
      if (!clientId) throw new Error("Client not found");

      setBusy(true);

      const fd = new FormData();
      fd.append("file", file);
      fd.append("projectId", project._id);

      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.open("POST", `${API}/api/files/upload-client/${clientId}`);
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);

        xhr.upload.onprogress = (e) => {
          if (!e.lengthComputable) return;
          const percent = Math.round((e.loaded / e.total) * 100);
          setProgress(percent);
        };

        xhr.onload = () => {
          try {
            const res = JSON.parse(xhr.responseText || "{}");

            if (xhr.status === 200 && res.ok) {
              setMsg("✅ File uploaded successfully");
              setFile(null);
              fileRef.current.value = "";
              onUploaded && onUploaded(res.file);
              resolve();
            } else {
              reject(new Error(res.error || "Upload failed"));
            }
          } catch {
            reject(new Error("Invalid server response"));
          }
        };

        xhr.onerror = () => reject(new Error("Network error"));
        xhr.send(fd);
      });
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ border: "1px solid #eee", padding: 16, borderRadius: 12 }}>
      <h4>Upload Files</h4>

      <input
        ref={fileRef}
        type="file"
        disabled={busy}
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      <div style={{ marginTop: 10 }}>
        <button
          onClick={uploadFile}
          disabled={busy}
          style={{
            padding: "10px 16px",
            background: "#000",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          {busy ? "Uploading..." : "Upload"}
        </button>
      </div>

      {progress > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 12 }}>{progress}%</div>
          <div
            style={{
              height: 8,
              background: "#eee",
              borderRadius: 10,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background: "#000",
              }}
            />
          </div>
        </div>
      )}

      {msg && (
        <p style={{ marginTop: 10, color: msg.includes("✅") ? "green" : "red" }}>
          {msg}
        </p>
      )}
    </div>
  );
};
