import { useEffect, useRef, useState } from "react";

export const UploadToDrive = ({ clientId, projectId }) => {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [progress, setProgress] = useState(0);

  const [files, setFiles] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const fileRef = useRef(null);

  // ✅ fetch uploaded files (public)
  const fetchFiles = async () => {
    try {
      if (!clientId) return;
      setLoadingList(true);

      const res = await fetch(`${API}/api/files/list/${clientId}`);
      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to load files");
      }

      setFiles(data.files || []);
    } catch (e) {
      setMsg(e.message || "Failed to load files");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchFiles();
    // eslint-disable-next-line
  }, [clientId]);

  // ✅ upload with progress (NO LOGIN)
  const uploadFile = async () => {
    try {
      setMsg("");
      setProgress(0);

      if (!clientId) throw new Error("Client not found");
      if (!projectId) throw new Error("Project not found");
      if (!file) throw new Error("Please choose a file");

      setBusy(true);

      const fd = new FormData();
      fd.append("file", file);
      fd.append("projectId", projectId);

      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${API}/api/files/upload/${clientId}`, true);

        xhr.upload.onprogress = (evt) => {
          if (!evt.lengthComputable) return;
          const percent = Math.round((evt.loaded / evt.total) * 100);
          setProgress(percent);
        };

        xhr.onload = () => {
          try {
            const data = JSON.parse(xhr.responseText || "{}");

            if (xhr.status >= 200 && xhr.status < 300 && data.ok) {
              setProgress(100);
              setMsg("✅ Uploaded successfully");
              setFile(null);
              if (fileRef.current) fileRef.current.value = "";
              resolve();
            } else {
              reject(new Error(data.error || "Upload failed"));
            }
          } catch {
            reject(new Error("Invalid server response"));
          }
        };

        xhr.onerror = () => reject(new Error("Network error"));
        xhr.send(fd);
      });

      await fetchFiles();
    } catch (e) {
      setMsg(e.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ border: "1px solid #eee", padding: 14, borderRadius: 12 }}>
      <h4 style={{ margin: 0, marginBottom: 10 }}>
        Upload Files
      </h4>

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <input
          ref={fileRef}
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />

        <button
          type="button"
          onClick={uploadFile}
          disabled={busy}
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: "none",
            background: "#000",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          {busy ? "Uploading..." : "Upload"}
        </button>
      </div>

      {/* ✅ progress */}
      {busy && progress > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 12 }}>Uploading… {progress}%</div>
          <div
            style={{
              width: "100%",
              height: 8,
              background: "#eee",
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progress}%`,
                background: "#000",
                transition: "width 0.15s linear",
              }}
            />
          </div>
        </div>
      )}

      {msg && (
        <p
          style={{
            marginTop: 10,
            fontSize: 13,
            color: msg.includes("✅") ? "green" : "red",
          }}
        >
          {msg}
        </p>
      )}

      {/* ✅ file list */}
      <div style={{ marginTop: 16 }}>
        <h4 style={{ marginBottom: 8 }}>Uploaded Files</h4>

        {loadingList ? (
          <p style={{ fontSize: 13 }}>Loading…</p>
        ) : files.length === 0 ? (
          <p style={{ fontSize: 13 }}>No files yet.</p>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {files.map((f) => (
              <div
                key={f.id}
                style={{
                  border: "1px solid #f0f0f0",
                  borderRadius: 10,
                  padding: 10,
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    {f.name}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>
                    {f.modifiedTime
                      ? new Date(f.modifiedTime).toLocaleString("en-IN")
                      : ""}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  {f.webViewLink && (
                    <a href={f.webViewLink} target="_blank" rel="noreferrer">
                      Open
                    </a>
                  )}
                  {f.webContentLink && (
                    <a href={f.webContentLink} target="_blank" rel="noreferrer">
                      Download
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
