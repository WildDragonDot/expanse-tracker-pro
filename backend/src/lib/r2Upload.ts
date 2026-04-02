import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true, // Required for R2
})

export interface UploadedFile {
  url: string
  key: string
  name: string
  type: string
  size: number
}

export async function uploadToR2(
  file: Buffer,
  fileName: string,
  contentType: string,
  folder: string = 'shopping-bills'
): Promise<UploadedFile> {
  // Validate environment variables
  if (!process.env.R2_BUCKET || !process.env.R2_ENDPOINT || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
    throw new Error('R2 configuration is missing. Please check environment variables.')
  }

  const timestamp = Date.now()
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
  const key = `${folder}/${timestamp}-${sanitizedFileName}`

  try {
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      Body: file,
      ContentType: contentType,
    })

    await r2Client.send(command)

    const url = `${process.env.R2_CUSTOM_DOMAIN}/${key}`

    return {
      url,
      key,
      name: fileName,
      type: contentType,
      size: file.length,
    }
  } catch (error: any) {
    console.error('R2 Upload Error:', error)
    throw new Error(`Failed to upload to R2: ${error.message}`)
  }
}

export async function deleteFromR2(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: process.env.R2_BUCKET!,
    Key: key,
  })

  await r2Client.send(command)
}

export function getFileTypeIcon(type: string): string {
  if (type.startsWith('image/')) return '🖼️'
  if (type === 'application/pdf') return '📄'
  if (type.includes('document') || type.includes('word')) return '📝'
  if (type.includes('spreadsheet') || type.includes('excel')) return '📊'
  return '📎'
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}
