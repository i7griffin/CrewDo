import { useState, useRef } from "react";
import { proofAPI } from "../services/api";

const TASK_COLORS = {
  WORKOUT: "#00ff88",
  STUDY: "#00cfff",
  LEETCODE: "#ffd93d",
};

export default function ProgressDisplay({
  clanId,
  progress = 0,
  tasks = [],
  onProofSubmit,
}) {
  const [uploading, setUploading] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [uploadMsg, setUploadMsg] = useState("");
  const fileRef = useRef();

  const clampedProgress = Math.min(100, Math.max(0, progress));
  const fillPercent = clampedProgress;

  const handleTaskClick = (task) => {
    if (task.completed) return;
    setSelectedTask(task);
    setUploadMsg("");
    fileRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedTask) return;

    setUploading(true);
    setUploadMsg("");

    try {
      const formData = new FormData();
      formData.append("proof", file);
      formData.append("taskType", selectedTask.type);

      // ✅ FIXED API CALL
      await proofAPI.submit(formData);

      setUploadMsg(`✓ Proof submitted for ${selectedTask.type}!`);
      onProofSubmit?.();
    } catch (err) {
      setUploadMsg(
        err.response?.data?.message || "Upload failed."
      );
    } finally {
      setUploading(false);
      setSelectedTask(null);
      e.target.value = "";
    }
  };

  return (
    <div className="progress-display">
      <h2 className="panel-title">DAILY PROGRESS</h2>

      <div className="battery-container">
        <div className="battery-cap" />
        <div className="battery-body">
          <div
            className="battery-fill"
            style={{ height: `${fillPercent}%` }}
          />
          <span className="battery-pct">{clampedProgress}%</span>
        </div>

        <div className="battery-cable">
          <svg viewBox="0 0 120 80" fill="none">
            <path
              d="M60 0 C60 40 20 40 20 80"
              stroke="#00ff88"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </div>
      </div>

      <div className="activities-box">
        <p className="activities-label">TODAY'S ACTIVITIES</p>

        <div className="task-list">
          {tasks.length === 0 ? (
            <p className="no-tasks">No tasks configured</p>
          ) : (
            tasks.map((task) => {
              const color =
                TASK_COLORS[task.type?.toUpperCase()] || "#00ff88";

              return (
                <button
                  key={task.type}
                  className={`task-btn ${
                    task.completed ? "task-done" : ""
                  }`}
                  style={{ "--task-color": color }}
                  onClick={() => handleTaskClick(task)}
                  disabled={task.completed || uploading}
                >
                  {task.completed ? "✓ " : ""}
                  {task.type?.toUpperCase()}
                </button>
              );
            })
          )}
        </div>

        {uploadMsg && <p className="upload-msg">{uploadMsg}</p>}
        {uploading && (
          <p className="upload-msg">Uploading proof...</p>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/*"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
    </div>
  );
}