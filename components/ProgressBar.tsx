'use client'

interface ProgressBarProps {
  currentStep: number
  totalSteps: number
  label?: string
}

export default function ProgressBar({ currentStep, totalSteps, label }: ProgressBarProps) {
  const progress = (currentStep / totalSteps) * 100

  return (
    <div className="w-full space-y-2">
      {label && (
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-400">{label}</span>
          <span className="text-white font-semibold">
            {currentStep} / {totalSteps}
          </span>
        </div>
      )}

      <div className="relative w-full h-3 bg-white/10 rounded-full overflow-hidden">
        {/* Background track */}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-700 to-gray-600"></div>

        {/* Progress fill */}
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        >
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
        </div>

        {/* Step indicators */}
        <div className="absolute inset-0 flex items-center justify-between px-1">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full border-2 transition-all duration-300 ${
                i < currentStep
                  ? 'bg-white border-white scale-125'
                  : i === currentStep
                  ? 'bg-white/50 border-white scale-110 animate-pulse'
                  : 'bg-transparent border-white/30'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Progress percentage */}
      <div className="text-center">
        <span className="text-xs text-gray-500">
          {Math.round(progress)}% abgeschlossen
        </span>
      </div>
    </div>
  )
}
