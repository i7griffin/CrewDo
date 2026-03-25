// Circular bubble representing a task category (Workout, Study, Leetcode, etc.)
// Clicking it logs the task as completed, adding +10% to core energy
const TaskBubble = ({ label, powerBoost = 10, onClick, completed = false }) => {
  return (
    <div
      className="task-bubble"
      onClick={onClick}
      style={
        completed
          ? { opacity: 0.5, cursor: 'default', boxShadow: 'none' }
          : {}
      }
      title={completed ? `${label} already completed` : `Complete ${label}`}
    >
      <span className="task-bubble__label">{label}</span>
      <span className="task-bubble__power">+{powerBoost}% POWER</span>
    </div>
  );
};

export default TaskBubble;