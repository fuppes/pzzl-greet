'use client'

interface AvatarPickerProps {
  selectedAvatar: string
  onSelect: (avatar: string) => void
}

const AVATARS = [
  '😀', '😎', '🤓', '🥳', '🤩', '😇',
  '🦊', '🐶', '🐱', '🐼', '🐨', '🐸',
  '🦄', '🐉', '🦖', '🦁', '🐯', '🐮',
  '🌟', '⭐', '✨', '💫', '🔥', '🌈',
  '🎮', '🎯', '🎲', '🎪', '🎨', '🎭',
  '👑', '💎', '🏆', '⚡', '🚀', '🎸'
]

export default function AvatarPicker({ selectedAvatar, onSelect }: AvatarPickerProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-300">
        Wähle deinen Avatar
      </label>
      <div className="grid grid-cols-6 md:grid-cols-9 gap-2">
        {AVATARS.map((avatar) => (
          <button
            key={avatar}
            type="button"
            onClick={() => onSelect(avatar)}
            className={`text-3xl p-3 rounded-lg transition-all transform hover:scale-110 flex items-center justify-center ${
              selectedAvatar === avatar
                ? 'bg-blue-500/30 ring-2 ring-blue-400 scale-110'
                : 'bg-white/5 hover:bg-white/10'
            }`}
            title={avatar}
          >
            {avatar}
          </button>
        ))}
      </div>
    </div>
  )
}
