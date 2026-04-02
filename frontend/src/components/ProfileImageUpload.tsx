'use client'

import { apiFetch } from '@/lib/apiFetch'

import { useState, useRef } from 'react'
import { useNotification } from '@/contexts/NotificationContext'

interface ProfileImageUploadProps {
  currentImage?: string
  onUploadSuccess?: (imageUrl: string) => void
}

export default function ProfileImageUpload({ 
  currentImage, 
  onUploadSuccess 
}: ProfileImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentImage || null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { addNotification } = useNotification()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      addNotification({
        type: 'error',
        title: 'Invalid File',
        message: 'Please select an image file'
      })
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      addNotification({
        type: 'error',
        title: 'File Too Large',
        message: 'Image size must be less than 5MB'
      })
      return
    }

    // Show preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload
    uploadImage(file)
  }

  const uploadImage = async (file: File) => {
    setUploading(true)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        addNotification({
          type: 'error',
          title: 'Authentication Required',
          message: 'Please login first'
        })
        return
      }

      const formData = new FormData()
      formData.append('file', file)

      const response = await apiFetch('/api/user/profile/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Profile image updated successfully!'
      })
      setPreview(data.profileImage)
      onUploadSuccess?.(data.profileImage)
    } catch (error: any) {
      console.error('Upload error:', error)
      addNotification({
        type: 'error',
        title: 'Upload Failed',
        message: error.message || 'Failed to upload image'
      })
      setPreview(currentImage || null)
    } finally {
      setUploading(false)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Profile Image Preview */}
      <div 
        className="relative group cursor-pointer"
        onClick={handleClick}
      >
        <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          {preview ? (
            <img 
              src={preview} 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-4xl text-white">👤</span>
          )}
        </div>

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          {uploading ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          ) : (
            <span className="text-white text-sm">Change Photo</span>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      {/* Upload button */}
      <button
        onClick={handleClick}
        disabled={uploading}
        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {uploading ? 'Uploading...' : 'Change Profile Picture'}
      </button>

      {/* Info text */}
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
        Max size: 5MB • Formats: JPEG, PNG, GIF, WebP
      </p>
    </div>
  )
}
