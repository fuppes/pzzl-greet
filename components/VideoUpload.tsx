'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getUserFriendlyMessage, logError } from '@/lib/error-handler'

interface VideoUploadProps {
  roomId: string
  roomSlug: string
  currentVideoUrl?: string | null
  onUploadComplete: (videoUrl: string) => void
}

export default function VideoUpload({
  roomId,
  roomSlug,
  currentVideoUrl,
  onUploadComplete
}: VideoUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState('')

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('video/')) {
      setError('Bitte nur Video-Dateien hochladen (mp4, webm, etc.)')
      return
    }

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024 // 100MB
    if (file.size > maxSize) {
      setError('Video ist zu groß. Maximum: 100MB')
      return
    }

    setError('')
    setIsUploading(true)
    setUploadProgress(0)

    const supabase = createClient()

    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${roomSlug}-${Date.now()}.${fileExt}`
      const filePath = `videos/${fileName}`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('room-videos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('room-videos')
        .getPublicUrl(filePath)

      // Update room with video URL
      // @ts-ignore
      const { error: updateError } = await supabase
        .from('rooms')
        .update({ video_url: publicUrl })
        .eq('id', roomId)

      if (updateError) throw updateError

      // Delete old video if exists
      if (currentVideoUrl) {
        const oldPath = currentVideoUrl.split('/').slice(-2).join('/')
        await supabase.storage.from('room-videos').remove([oldPath])
      }

      setUploadProgress(100)
      onUploadComplete(publicUrl)
    } catch (err: any) {
      logError(err, 'VideoUpload: handleUpload')
      setError(getUserFriendlyMessage(err))
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!currentVideoUrl) return
    if (!confirm('Video wirklich löschen?')) return

    setIsUploading(true)
    const supabase = createClient()

    try {
      // Delete from storage
      const path = currentVideoUrl.split('/').slice(-2).join('/')
      await supabase.storage.from('room-videos').remove([path])

      // Remove from database
      // @ts-ignore
      const { error } = await supabase
        .from('rooms')
        .update({ video_url: null })
        .eq('id', roomId)

      if (error) throw error

      onUploadComplete('')
    } catch (err: any) {
      setError('Löschen fehlgeschlagen: ' + err.message)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Video hochladen
        </label>

        {currentVideoUrl ? (
          <div className="space-y-3">
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-300 font-medium">✓ Video hochgeladen</p>
                  <a
                    href={currentVideoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 break-all"
                  >
                    {currentVideoUrl}
                  </a>
                </div>
                <button
                  onClick={handleDelete}
                  disabled={isUploading}
                  className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 rounded text-sm transition-all disabled:opacity-50"
                >
                  Löschen
                </button>
              </div>
            </div>

            <div>
              <label className="cursor-pointer inline-block px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300 rounded-lg transition-all text-sm">
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  disabled={isUploading}
                  className="hidden"
                />
                Video ersetzen
              </label>
            </div>
          </div>
        ) : (
          <label className="cursor-pointer block">
            <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-white/40 transition-all">
              <input
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                disabled={isUploading}
                className="hidden"
              />
              <div className="text-4xl mb-3">🎥</div>
              <p className="text-white font-medium mb-1">
                {isUploading ? 'Lädt hoch...' : 'Video hochladen'}
              </p>
              <p className="text-sm text-gray-400">
                Klicke oder ziehe eine Video-Datei hierher
              </p>
              <p className="text-xs text-gray-500 mt-2">
                MP4, WebM, MOV • Max 100MB
              </p>
            </div>
          </label>
        )}
      </div>

      {isUploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-400">
            <span>Upload läuft...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      <p className="text-xs text-gray-400">
        💡 Das Video wird automatisch auf der Grüße-Seite für diesen Raum angezeigt
      </p>
    </div>
  )
}
