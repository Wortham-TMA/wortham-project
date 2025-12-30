import { useEffect, useRef, useState } from "react";

export const UploadToDrive = ({ clientId, onUploaded, onError }) => {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [progress, setProgress] = useState(0);

  // ✅ list states
  const [files, setFiles] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  const token = localStorage.getItem("token") || "";
  const fileRef = useRef(null);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("google") === "connected") {
        setMsg("✅ Google Drive connected!");
      }
    } catch {}
  }, []);

  const safeJson = async (res) => {
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) return await res.json();
    const text = await res.text();
    throw new Error(text?.slice(0, 180) || "Non-JSON response from server");
  };

  const connectDrive = async () => {
    try {
      setMsg("");
      setBusy(true);

      const res = await fetch("http://localhost:5000/api/files/google/connect", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await safeJson(res);
      if (!res.ok || !data.ok) throw new Error(data.error || "Failed to connect Google");

      window.location.href = data.url;
    } catch (e) {
      const errMsg = e.message || "Connect failed";
      setMsg(errMsg);
      if (onError) onError(errMsg);
    } finally {
      setBusy(false);
    }
  };

  // ✅ FETCH LIST
  const fetchFiles = async () => {
    try {
      if (!clientId) return;
      setLoadingList(true);

      const res = await fetch(`http://localhost:5000/api/files/list/${clientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await safeJson(res);
      if (!res.ok || !data.ok) throw new Error(data.error || "Failed to load files");

      setFiles(data.files || []);
    } catch (e) {
      const errMsg = e.message || "Failed to load files";
      setMsg(errMsg);
      if (onError) onError(errMsg);
    } finally {
      setLoadingList(false);
    }
  };

  // auto-load list when clientId changes
  useEffect(() => {
    fetchFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  // ✅ XHR upload for real progress %
  const uploadFile = async () => {
    try {
      setMsg("");
      setProgress(0);

      if (!clientId) throw new Error("clientId missing (project client not found)");
      if (!file) throw new Error("Please choose a file first");
      if (!token) throw new Error("Token missing. Please login again.");

      setBusy(true);

      const fd = new FormData();
      fd.append("file", file);

      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.open("POST", `http://localhost:5000/api/files/upload/${clientId}`, true);
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);

        xhr.upload.onprogress = (evt) => {
          if (!evt.lengthComputable) return;
          const percent = Math.round((evt.loaded / evt.total) * 100);
          setProgress(percent);
        };

        xhr.onload = () => {
          try {
            const ct = xhr.getResponseHeader("content-type") || "";
            const isJson = ct.includes("application/json");
            const data = isJson ? JSON.parse(xhr.responseText || "{}") : null;

            if (xhr.status >= 200 && xhr.status < 300 && data?.ok) {
              setProgress(100);
              setMsg("✅ Uploaded!");
              setFile(null);
              if (fileRef.current) fileRef.current.value = "";
              if (onUploaded) onUploaded(data.file);

              resolve();
            } else {
              const errMsg = data?.error || xhr.responseText?.slice(0, 180) || "Upload failed";
              reject(new Error(errMsg));
            }
          } catch {
            reject(new Error("Invalid server response"));
          }
        };

        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.send(fd);
      });

      // ✅ refresh list after upload
      await fetchFiles();
    } catch (e) {
      const errMsg = e.message || "Upload failed";
      setMsg(errMsg);
      if (onError) onError(errMsg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ border: "1px solid #eee", padding: 12, borderRadius: 12 }}>
      <h4 style={{ margin: 0, marginBottom: 10 }}>Upload (Client Drive)</h4>

      <button
        type="button"
        onClick={connectDrive}
        disabled={busy}
        style={{
          padding: "8px 10px",
          borderRadius: 10,
          border: "1px solid #ddd",
          background: "#fff",
          cursor: "pointer",
          marginBottom: 10,
        }}
      >
        {busy ? "Please wait..." : "Connect Google Drive"}
      </button>

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <input ref={fileRef} type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />

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

        <button
          type="button"
          onClick={fetchFiles}
          disabled={loadingList || busy}
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid #ddd",
            background: "#fff",
            cursor: "pointer",
          }}
        >
          {loadingList ? "Refreshing..." : "Refresh List"}
        </button>
      </div>

      {/* ✅ Progress bar */}
      {busy && progress > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 12, marginBottom: 6 }}>Uploading... {progress}%</div>
          <div
            style={{
              width: "100%",
              height: 8,
              background: "#e8e8e8",
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progress}%`,
                background: "#111",
                transition: "width 0.15s linear",
              }}
            />
          </div>
        </div>
      )}

      {msg && (
        <p style={{ marginTop: 10, fontSize: 13, color: msg.includes("✅") ? "green" : "red" }}>
          {msg}
        </p>
      )}

      {/* ✅ Files list */}
      <div style={{ marginTop: 14 }}>
        <h4 style={{ margin: 0, marginBottom: 8 }}>Uploaded Files</h4>

        {loadingList ? (
          <p style={{ fontSize: 13, opacity: 0.8 }}>Loading files...</p>
        ) : files.length === 0 ? (
          <p style={{ fontSize: 13, opacity: 0.8 }}>No files found in this client folder.</p>
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
                  gap: 10,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {f.name}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>
                    {f.modifiedTime ? new Date(f.modifiedTime).toLocaleString("en-IN") : ""}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  {f.webViewLink && (
                    <a href={f.webViewLink} target="_blank" rel="noreferrer" style={{ fontSize: 12 }}>
                      Open
                    </a>
                  )}
                  {f.webContentLink && (
                    <a href={f.webContentLink} target="_blank" rel="noreferrer" style={{ fontSize: 12 }}>
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
