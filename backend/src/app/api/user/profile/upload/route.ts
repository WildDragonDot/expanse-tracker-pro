import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { uploadToR2, deleteFromR2 } from '@/lib/r2Upload'
import { getUserById, updateUser } from '@/lib/database'

export const POST = withAuth(async (request: NextRequest, { userId }) => {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file size (max 5MB for profile images)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 5MB limit' }, { status: 400 })
    }

    // Validate file type (only images)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only images are allowed' }, { status: 400 })
    }

    // Get current user to check for existing profile image
    const user = await getUserById(userId)
    
    // Delete old profile image if exists
    if (user?.profileImage) {
      try {
        const oldKey = user.profileImage.split('/').slice(-2).join('/')
        await deleteFromR2(oldKey)
      } catch (error) {
        console.error('Failed to delete old profile image:', error)
      }
    }

    // Upload new profile image
    const buffer = Buffer.from(await file.arrayBuffer())
    const uploadedFile = await uploadToR2(buffer, file.name, file.type, 'profile-images')

    // Update user profile with new image URL
    const updatedUser = await updateUser(userId, {
      profileImage: uploadedFile.url
    })

    return NextResponse.json({
      success: true,
      profileImage: uploadedFile.url,
      user: updatedUser
    }, { status: 200 })
  } catch (error: any) {
    console.error('Error uploading profile image:', error)
    return NextResponse.json({ error: 'Failed to upload profile image' }, { status: 500 })
  }
})
