import { useEffect, useMemo, useState } from "react";
import { UploadToDrive } from "../components/UploadToDrive";

export const TeamTask = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);

  const [loadingList, setLoadingList] = useState(false);
  const [msg, setMsg] = useState("");
  const [savingStageKey, setSavingStageKey] = useState(null);

  const myId = useMemo(() => {
    return (
      localStorage.getItem("userId") ||
      localStorage.getItem("id") ||
      localStorage.getItem("uid") ||
      ""
    );
  }, []);

  const [uploadedInfo, setUploadedInfo] = useState(null);
  const [modalMsg, setModalMsg] = useState(""); // ✅ modal-specific message

  const getToken = () => localStorage.getItem("token") || "";

  const getProjectId = (p) => p?.id || p?._id;

  const getClientId = (p) => {
    const c = p?.client;
    if (!c) return "";
    return c.id || c._id || "";
  };

  // ✅ SAFE JSON helper (prevents Unexpected token "<")
  const safeJson = async (res) => {
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) return await res.json();
    const text = await res.text();
    throw new Error(text?.slice(0, 180) || "Non-JSON response from server");
  };

  const fetchMyProjects = async () => {
    try {
      setLoadingList(true);
      setMsg("");

      const token = getToken();
      const res = await fetch("http://localhost:5000/api/team/my-projects", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await safeJson(res);
      if (!res.ok || !data.ok) throw new Error(data.error || "Failed to load projects");

      setProjects(data.projects || []);
    } catch (err) {
      setMsg(err.message || "Failed to load projects");
    } finally {
      setLoadingList(false);
    }
  };

  // ✅ TEAM MEMBER can update ONLY: status + latestUpdate
  const updateStage = async (projectId, key, payload) => {
    try {
      setSavingStageKey(key);

      const token = getToken();
      const res = await fetch(
        `http://localhost:5000/api/team/projects/${projectId}/stages/${key}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await safeJson(res);
      if (!res.ok || !data.ok) throw new Error(data.error || "Update failed");

      const updatedStages = data?.project?.stages || [];

      setSelectedProject((prev) => (prev ? { ...prev, stages: updatedStages } : prev));

      setProjects((prev) =>
        prev.map((p) => {
          const pid = getProjectId(p);
          if (String(pid) !== String(projectId)) return p;
          return { ...p, stages: updatedStages };
        })
      );
    } catch (err) {
      alert(err.message || "Update failed");
    } finally {
      setSavingStageKey(null);
    }
  };

  const toDateInput = (d) => {
    if (!d) return "";
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return "";
    return dt.toISOString().slice(0, 10);
  };

  const lastUpdatedByLabel = (s) => {
    const lub = s?.lastUpdatedBy;
    if (!lub) return "—";

    if (typeof lub === "string") {
      if (myId && String(lub) === String(myId)) return "Me";
      return "Team";
    }

    const lubId = lub?._id || lub?.id;
    if (myId && lubId && String(lubId) === String(myId)) return "Me";
    return lub?.name || "Team";
  };

  useEffect(() => {
    fetchMyProjects();
  }, []);

  return (
    <div style={{ padding: 16 }} className="etp">
      <h2>My Assigned Projects</h2>

      {msg && <p style={{ color: "red" }}>{msg}</p>}

      {loadingList ? (
        <p>Loading...</p>
      ) : projects.length === 0 ? (
        <p>No assigned projects yet.</p>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {projects.map((p) => (
            <div
              key={getProjectId(p)}
              style={{
                border: "1px solid #ddd",
                borderRadius: 12,
                padding: 12,
                cursor: "pointer",
              }}
              onClick={() => {
                setUploadedInfo(null);
                setModalMsg("");
                setSelectedProject(p);
              }}
            >
              <h3 className="teamtaskname">{p.name}</h3>
              <p>
                <b>Client:</b> {p.client?.companyName || "—"}
              </p>
              <p>
                <b>Due:</b> {p.dueDate ? new Date(p.dueDate).toDateString() : "—"}
              </p>
              <p>
                <b>Stages:</b> {p.stages?.length || 0}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ================= MODAL (Overlay) ================= */}
      {selectedProject && (
        <div
          className="project-modal-overlay"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            zIndex: 9999,
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
            padding: 24,
            overflowY: "auto",
          }}
          onClick={() => setSelectedProject(null)}
        >
          <div
            className="project-modal"
            style={{
              width: "min(980px, 100%)",
              background: "#fff",
              borderRadius: 16,
              padding: 16,
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <h3 style={{ margin: 0 }}>
                {selectedProject.client?.companyName} / {selectedProject.name}
              </h3>
              <button
                className="primary"
                onClick={() => setSelectedProject(null)}
                style={{
                  padding: "8px 14px",
                  borderRadius: 10,
                  border: "none",
                  background: "#000",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>

            {/* ✅ Upload Section */}
            <div style={{ marginTop: 12 }}>
              <UploadToDrive
                clientId={getClientId(selectedProject)}
                onUploaded={(file) => setUploadedInfo(file)}
                onError={(e) => setModalMsg(e)} // ✅ modal msg only
              />

              {uploadedInfo?.webViewLink && (
                <p style={{ marginTop: 8, fontSize: 13 }}>
                  Uploaded file link:{" "}
                  <a href={uploadedInfo.webViewLink} target="_blank" rel="noreferrer">
                    Open in Drive
                  </a>
                </p>
              )}

              {modalMsg && (
                <p style={{ marginTop: 8, fontSize: 13, color: "red" }}>{modalMsg}</p>
              )}
            </div>

            {(selectedProject.stages || []).map((s) => (
              <div
                key={s.key}
                style={{
                  border: "1px solid #eee",
                  borderRadius: 12,
                  padding: 12,
                  marginTop: 12,
                }}
              >
                {/* 🔒 STAGE NAME (READ ONLY) */}
                <p style={{ margin: 0, fontSize: 12, opacity: 0.7 }}>STAGE NAME</p>
                <input
                  value={s.stageName || ""}
                  readOnly
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 10,
                    border: "1px solid #ddd",
                    background: "#f5f5f5",
                    marginTop: 6,
                  }}
                />

                {/* 🔒 TIMELINE (READ ONLY) */}
                <p style={{ marginTop: 12, marginBottom: 0, fontSize: 12, opacity: 0.7 }}>
                  TIMELINE
                </p>
                <input
                  type="date"
                  value={toDateInput(s.timeline)}
                  readOnly
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 10,
                    border: "1px solid #ddd",
                    background: "#f5f5f5",
                    marginTop: 6,
                  }}
                />

                {/* ✅ STATUS (EDITABLE) */}
                <p style={{ marginTop: 12, marginBottom: 0, fontSize: 12, opacity: 0.7 }}>
                  STATUS
                </p>
                <select
                  value={s.status || "PENDING"}
                  disabled={savingStageKey === s.key}
                  onChange={(e) =>
                    updateStage(getProjectId(selectedProject), s.key, {
                      status: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 10,
                    border: "1px solid #ddd",
                    marginTop: 6,
                  }}
                >
                  <option value="PENDING">PENDING</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="COMPLETED">COMPLETED</option>
                </select>

                {/* ✅ LATEST UPDATE (EDITABLE) */}
                <p style={{ marginTop: 12, marginBottom: 0, fontSize: 12, opacity: 0.7 }}>
                  LATEST UPDATE
                </p>
                <textarea
                  value={s.latestUpdate || ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setSelectedProject((prev) => ({
                      ...prev,
                      stages: prev.stages.map((x) =>
                        x.key === s.key ? { ...x, latestUpdate: v } : x
                      ),
                    }));
                  }}
                  onBlur={() => {
                    // ✅ always take latest value from state at blur time
                    const latest =
                      selectedProject?.stages?.find((x) => x.key === s.key)?.latestUpdate || "";
                    updateStage(getProjectId(selectedProject), s.key, { latestUpdate: latest });
                  }}
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 10,
                    border: "1px solid #ddd",
                    marginTop: 6,
                    minHeight: 90,
                    resize: "vertical",
                  }}
                />

                <p style={{ fontSize: 12, opacity: 0.7, marginTop: 10 }}>
                  Last update by: {lastUpdatedByLabel(s)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
