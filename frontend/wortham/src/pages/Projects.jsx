import { CiCalendar } from "react-icons/ci";
import { PiStackLight } from "react-icons/pi";
import { useEffect, useMemo, useState } from "react";
import { UploadToDrive } from "../components/UploadToDrive"; // ✅ add this

export const Projects = () => {



  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";




  const [showForm, setShowForm] = useState(false);

  // form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [clientId, setClientId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [selectedTeamIds, setSelectedTeamIds] = useState([]);

  // data lists
  const [teams, setTeams] = useState([]);
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);

  // loading + messages
  const [loadingForm, setLoadingForm] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [msg, setMsg] = useState("");

  const [selectedProject, setSelectedProject] = useState(null);
  const [savingStageKey, setSavingStageKey] = useState(null);

  // ✅ Upload info msg (optional)
  const [uploadedInfo, setUploadedInfo] = useState(null);
  const [modalMsg, setModalMsg] = useState("");

  // ✅ SEARCH + FILTER
  const [search, setSearch] = useState("");
  const [teamFilterId, setTeamFilterId] = useState(""); // "" = all

  const token = localStorage.getItem("token") || "";

  // safer json parse (HTML error avoid)
  const safeJson = async (res) => {
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) return await res.json();
    const text = await res.text();
    return { ok: false, error: text?.slice(0, 200) || "Non-JSON response" };
  };

  const getProjectId = (p) => p?.id || p?._id;

  const getClientIdFromProject = (p) => {
    const c = p?.client;
    if (!c) return "";
    return c._id || c.id || p.clientId || "";
  };

  // 🔹 Fetch team, clients, projects
  const fetchInitialData = async () => {
    try {
      setLoadingList(true);

      const headers = { Authorization: `Bearer ${token}` };

      const [teamRes, clientRes, projectRes] = await Promise.all([
        fetch(`${API}/api/admin/teams`, { headers }),
        fetch(`${API}/api/admin/clients`, { headers }),
        fetch(`${API}/api/admin/projects`, { headers }),
      ]);

      const teamData = await safeJson(teamRes);
      const clientData = await safeJson(clientRes);
      const projectData = await safeJson(projectRes);

      if (!teamRes.ok || !teamData.ok)
        throw new Error(teamData.error || "Failed to load team members");
      if (!clientRes.ok || !clientData.ok)
        throw new Error(clientData.error || "Failed to load clients");
      if (!projectRes.ok || !projectData.ok)
        throw new Error(projectData.error || "Failed to load projects");

      setTeams(teamData.teams || []);
      setClients(clientData.clients || []);
      setProjects(projectData.projects || []);
    } catch (err) {
      console.error(err);
      setMsg(err.message || "Failed to load data");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Multi-select dropdown handler (team ids)
  const handleTeamMultiSelect = (e) => {
    const values = Array.from(e.target.selectedOptions).map((o) => o.value);
    setSelectedTeamIds(values);
  };

  // 🔹 Create project submit handler
  const handleCreateProject = async (e) => {
    e.preventDefault();
    setMsg("");
    setLoadingForm(true);

    try {
      if (!name || !clientId) throw new Error("Project name and client are required");

      const res = await fetch(`${API}/api/admin/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          description,
          clientId,
          startDate: startDate || undefined,
          dueDate: dueDate || undefined,
          teamMemberIds: selectedTeamIds,
        }),
      });

      const data = await safeJson(res);

      if (!res.ok || !data.ok) throw new Error(data.error || "Failed to create project");

      setMsg(`Project created: ${data.project.name}`);

      // reset form
      setName("");
      setDescription("");
      setClientId("");
      setStartDate("");
      setDueDate("");
      setSelectedTeamIds([]);
      setShowForm(false);

      await fetchProjectsOnly();
    } catch (err) {
      console.error(err);
      setMsg(err.message || "Something went wrong");
    } finally {
      setLoadingForm(false);
    }
  };

  // 🔹 Only projects refresh
  const fetchProjectsOnly = async () => {
    try {
      const res = await fetch(`${API}/api/admin/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await safeJson(res);

      if (!res.ok || !data.ok) throw new Error(data.error || "Failed to load projects");

      setProjects(data.projects || []);
    } catch (err) {
      console.error(err);
      setMsg(err.message || "Failed to refresh projects");
    }
  };

  const toDateInput = (d) => {
    if (!d) return "";
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return "";
    return dt.toISOString().slice(0, 10);
  };

  const formatDue = (d) => {
    if (!d) return "No due date";
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return "No due date";
    return dt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  const calcProgress = (p) => {
    const stages = p?.stages || [];
    if (!stages.length) return 0;
    const done = stages.filter((s) => s.status === "COMPLETED").length;
    return Math.round((done / stages.length) * 100);
  };

  const updateStage = async (projectId, stageKey, payload) => {
    try {
      setSavingStageKey(stageKey);

      const res = await fetch(
        `${API}/api/admin/projects/${projectId}/stages/${stageKey}`,
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
      if (!res.ok || !data.ok) throw new Error(data.error || "Failed to update stage");

      const updated = data.project;

      setSelectedProject((prev) => ({
        ...prev,
        ...updated,
        stages: updated.stages || prev?.stages || [],
      }));

      setProjects((prev) =>
        prev.map((p) => {
          const pid = p.id || p._id;
          const uid = updated.id || updated._id;
          if (String(pid) !== String(uid)) return p;
          return { ...p, ...updated, id: uid || pid };
        })
      );
    } catch (err) {
      setMsg(err.message || "Stage update failed");
    } finally {
      setSavingStageKey(null);
    }
  };

  // ✅ SEARCH + TEAM FILTER (computed list)
  const filteredProjects = useMemo(() => {
    const q = (search || "").toLowerCase().trim();

    return (projects || []).filter((p) => {
      const pn = (p?.name || "").toLowerCase();
      const pd = (p?.description || "").toLowerCase();
      const pc = (p?.client?.companyName || p?.client?.name || "").toLowerCase();

      const matchesSearch = !q || pn.includes(q) || pd.includes(q) || pc.includes(q);

      const members = p?.teamMembers || [];
      const matchesTeam =
        !teamFilterId ||
        members.some((m) => String(m?._id || m?.id) === String(teamFilterId));

      return matchesSearch && matchesTeam;
    });
  }, [projects, search, teamFilterId]);

  return (
    <>
      <div className="inside-admin-dashboard-project">
        <h2>Active Large-Scale Projects</h2>

        <button className="primary" onClick={() => setShowForm(true)}>
          Add Project
        </button>

        {msg && <p className="admin-msg">{msg}</p>}

        {/* ✅ SEARCH + TEAM FILTER BAR */}
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginTop: 14 }}>
          <input
            type="text"
            placeholder="Search by project / client / description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid #ddd",
              minWidth: 260,
              flex: "1",
            }}
          />

          <select
            value={teamFilterId}
            onChange={(e) => setTeamFilterId(e.target.value)}
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid #ddd",
              minWidth: 220,
              background: "#fff",
            }}
          >
            <option value="">Filter by team member (All)</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} {t.designation ? `(${t.designation})` : ""}
              </option>
            ))}
          </select>

          {(search || teamFilterId) && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setTeamFilterId("");
              }}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid #ddd",
                background: "#fff",
                cursor: "pointer",
              }}
            >
              Clear
            </button>
          )}
        </div>

        {/* ✅ Create Project Form (MODAL OVERLAY) */}
        {showForm && (
          <div
            className="project-form-modal-overlay"
            onClick={() => setShowForm(false)}
          >
            <form
              className="project-form-modal"
              onClick={(e) => e.stopPropagation()}
              onSubmit={handleCreateProject}
            >
              <div className="project-form-header">
                <h3 style={{ margin: 0 }}>Create Project</h3>

                <button
                  type="button"
                  className="close-project-form"
                  onClick={() => setShowForm(false)}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <div className="project-form-body">
                <input
                  type="text"
                  placeholder="Project name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />

                <textarea
                  placeholder="Project description (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />

                <div className="project-field-group">
                  <label>Client</label>
                  <select value={clientId} onChange={(e) => setClientId(e.target.value)}>
                    <option value="">Select client</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.companyName || c.name} ({c.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="project-dates-row">
                  <div>
                    <label>Start Date</label>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  </div>
                  <div>
                    <label>Due Date</label>
                    <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                  </div>
                </div>

                {/* ✅ TEAM MEMBERS DROPDOWN (MULTI SELECT) */}
                <div className="project-field-group">
                  <label>Assign Team Members</label>

                  {teams.length === 0 ? (
                    <p className="hint-text">No team members found. Create some in the Team section.</p>
                  ) : (
                    <>
                      <select
                        multiple
                        value={selectedTeamIds}
                        onChange={handleTeamMultiSelect}
                        className="team-multi-select"
                      >
                        {teams.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} {m.designation ? `(${m.designation})` : ""}
                          </option>
                        ))}
                      </select>

                      <p style={{ marginTop: 8, fontSize: 12, opacity: 0.75 }}>
                        Tip: Ctrl (Windows) / Cmd (Mac) press karke multiple select kar sakte ho.
                      </p>

                      {/* ✅ Selected preview chips */}
                      <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {selectedTeamIds.length === 0 ? (
                          <span style={{ fontSize: 12, opacity: 0.7 }}>No team selected</span>
                        ) : (
                          selectedTeamIds.map((id) => {
                            const m = teams.find((t) => String(t.id) === String(id));
                            return (
                              <span
                                key={id}
                                style={{
                                  fontSize: 12,
                                  padding: "6px 10px",
                                  borderRadius: 999,
                                  border: "1px solid #eee",
                                  background: "#fafafa",
                                }}
                              >
                                {m?.name || "Member"}
                              </span>
                            );
                          })
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <button type="submit" className="addClient" disabled={loadingForm}>
                {loadingForm ? "Creating..." : "Create Project"}
              </button>
            </form>
          </div>
        )}

        {loadingList ? (
          <p>Loading projects...</p>
        ) : filteredProjects.length === 0 ? (
          <p>No projects found.</p>
        ) : (
          <>
            {filteredProjects.map((p) => {
              const percent = calcProgress(p);

              return (
                <div className="main-main-main" key={getProjectId(p)}>
                  <div
                    className="project-card"
                    onClick={() => {
                      setUploadedInfo(null);
                      setModalMsg("");
                      setSelectedProject(p);
                    }}
                  >
                    <h3>{p.client?.companyName || "Client"}</h3>

                    {/* ✅ TEAM MEMBERS ON CARD */}
                    <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {(p.teamMembers || []).length === 0 ? (
                        <span style={{ fontSize: 12, opacity: 0.7 }}>No team assigned</span>
                      ) : (
                        (p.teamMembers || []).slice(0, 4).map((m) => (
                          <span
                            key={m._id || m.id}
                            style={{
                              fontSize: 12,
                              padding: "6px 10px",
                              borderRadius: 999,
                              border: "1px solid #eee",
                              background: "#fafafa",
                            }}
                          >
                            {m.name}
                          </span>
                        ))
                      )}

                      {(p.teamMembers || []).length > 4 && (
                        <span style={{ fontSize: 12, opacity: 0.7 }}>
                          +{(p.teamMembers || []).length - 4} more
                        </span>
                      )}
                    </div>

                    <div className="inside-project-card">
                      <h4>{p.name}</h4>

                      <div className="date-span">
                        <p>
                          <CiCalendar className="aspicon" />
                          {formatDue(p.dueDate)}
                        </p>
                        <p>
                          <PiStackLight className="aspicon" />
                          {(p.stages?.length || 0)} Stages
                        </p>
                      </div>

                      <div className="project-progress">
                        <h4>{percent}%</h4>
                        <p>Complete</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* ✅ Project modal */}
        {selectedProject && (
          <div className="project-modal-overlay" onClick={() => setSelectedProject(null)}>
            <div className="project-modal" onClick={(e) => e.stopPropagation()}>
              <div className="stage-editor-wrap">
                <div className="stage-editor-header">
                  <h3>
                    Stages — {selectedProject.client?.companyName || "Client"} / {selectedProject.name}
                  </h3>
                  <button className="secondary primary" onClick={() => setSelectedProject(null)}>
                    Close
                  </button>
                </div>

                {/* ✅ ADMIN UPLOAD + LIST */}
                <div style={{ margin: "12px 0" }}>
                  <UploadToDrive
                    clientId={getClientIdFromProject(selectedProject)}
                    onUploaded={(file) => setUploadedInfo(file)}
                    onError={(e) => setModalMsg(e)}
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
                  <div className="stage-card" key={s.key}>
                    <div className="stage-top">
                      <div className="stage-col">
                        <p className="stage-label">STAGE NAME</p>
                        <input
                          className="stage-input"
                          value={s.stageName || ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            setSelectedProject((prev) => ({
                              ...prev,
                              stages: prev.stages.map((x) =>
                                x.key === s.key ? { ...x, stageName: v } : x
                              ),
                            }));
                          }}
                          onBlur={() =>
                            updateStage(getProjectId(selectedProject), s.key, { stageName: s.stageName })
                          }
                        />
                      </div>

                      <div className="stage-col">
                        <p className="stage-label">TIMELINE</p>
                        <input
                          className="stage-input"
                          type="date"
                          value={toDateInput(s.timeline)}
                          onChange={(e) => {
                            const v = e.target.value;
                            setSelectedProject((prev) => ({
                              ...prev,
                              stages: prev.stages.map((x) =>
                                x.key === s.key ? { ...x, timeline: v } : x
                              ),
                            }));
                          }}
                          onBlur={() =>
                            updateStage(getProjectId(selectedProject), s.key, { timeline: s.timeline })
                          }
                        />
                      </div>

                      <div className="stage-col">
                        <p className="stage-label">STATUS</p>
                        <select
                          className="stage-select"
                          value={s.status || "PENDING"}
                          disabled={savingStageKey === s.key}
                          onChange={(e) => {
                            const status = e.target.value;
                            setSelectedProject((prev) => ({
                              ...prev,
                              stages: prev.stages.map((x) =>
                                x.key === s.key ? { ...x, status } : x
                              ),
                            }));
                            updateStage(getProjectId(selectedProject), s.key, { status });
                          }}
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="COMPLETED">COMPLETED</option>
                        </select>
                      </div>
                    </div>

                    <div className="stage-update">
                      <p className="stage-label">LATEST UPDATE (VISIBLE TO CLIENT)</p>
                      <textarea
                        className="stage-textarea"
                        value={s.latestUpdate || ""}
                        placeholder="e.g. Day 2 wrap complete. Editing started."
                        onChange={(e) => {
                          const v = e.target.value;
                          setSelectedProject((prev) => ({
                            ...prev,
                            stages: prev.stages.map((x) =>
                              x.key === s.key ? { ...x, latestUpdate: v } : x
                            ),
                          }));
                        }}
                        onBlur={() =>
                          updateStage(getProjectId(selectedProject), s.key, { latestUpdate: s.latestUpdate })
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
