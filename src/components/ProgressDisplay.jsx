function ProgressDisplay({ progress, streak, tasks, onTaskComplete, completedTaskIds = [] }) {
  return (
    <section className="glass-panel rounded-2xl p-6">
      <h3 className="mb-6 text-center text-3xl font-bold text-gray-100">DAILY PROGRESS</h3>

      <div className="mx-auto mb-6 flex h-48 w-48 items-center justify-center rounded-full border-4 border-emerald-300/40 bg-emerald-400/10 shadow-[0_0_24px_rgba(74,222,128,0.45)]">
        <div className="text-center">
          <p className="text-sm uppercase text-emerald-100">Core Energy</p>
          <p className="text-5xl font-black text-emerald-300">{progress}%</p>
        </div>
      </div>

      <div className="mb-5 rounded-xl bg-black/25 p-3 text-center text-amber-200">
        Group streak: <span className="font-bold">🔥 {streak} days</span>
      </div>

      <div className="space-y-3">
        {tasks.map((task) => {
          const isCompleted = completedTaskIds.includes(task.id)
          return (
            <button
              key={task.id}
              type="button"
              onClick={() => onTaskComplete(task)}
              disabled={isCompleted}
              className={`w-full rounded-lg border p-3 text-left ${
                isCompleted
                  ? 'cursor-not-allowed border-gray-500/40 bg-gray-600/20 text-gray-400'
                  : 'border-emerald-300/40 bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/25'
              }`}
            >
              <span className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  {isCompleted && <span className="text-lg">✓</span>}
                  {task.title}
                </span>
                <span className={isCompleted ? 'text-gray-400' : 'text-emerald-300'}>
                  {isCompleted ? 'Completed' : `+${task.value}%`}
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

export default ProgressDisplay
