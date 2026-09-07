/**
 * Firebase Storage Service for Receipt and Bill Attachments
 */
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { storage } from '../firebase/firebase.config'

export class FirebaseStorageService {
  /**
   * Upload image blob or URI to Firebase Storage under users/{userId}/receipts/
   */
  public static async uploadReceipt(
    userId: string,
    fileUri: string,
    fileName?: string
  ): Promise<string> {
    const name = fileName || `receipt_${Date.now()}.jpg`
    const storageRef = ref(storage, `users/${userId}/receipts/${name}`)

    // Fetch the local file as Blob
    const response = await fetch(fileUri)
    const blob = await response.blob()

    // Upload to Firebase Storage
    const snapshot = await uploadBytesResumable(storageRef, blob)
    const downloadUrl = await getDownloadURL(snapshot.ref)

    return downloadUrl
  }
}
