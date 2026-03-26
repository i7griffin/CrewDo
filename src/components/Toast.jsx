import { useEffect } from 'react'

function Toast({ message, type = 'error', onClose, duration = 3000 }) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  const bgColor = type === 'error' ? 'bg-red-500' : 'bg-emerald-500'

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
      <div className={`${bgColor} rounded-lg px-6 py-4 text-white shadow-lg`}>
        <div className="flex items-center gap-3">
          <span>{message}</span>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}

export default Toast
