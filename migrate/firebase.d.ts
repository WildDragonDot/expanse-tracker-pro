// Global ambient type declarations for Firebase, Node, and React Native in migrate/

declare module 'fs' {
  export function readFileSync(path: string, encoding?: string): string;
  export function writeFileSync(path: string, data: string, encoding?: string): void;
  export function existsSync(path: string): boolean;
  export function mkdirSync(path: string, options?: any): void;
}

declare module 'path' {
  export function join(...paths: string[]): string;
  export function resolve(...paths: string[]): string;
  export function dirname(path: string): string;
}

declare const __dirname: string;
declare const require: any;
declare const module: any;

declare module 'firebase/app' {
  export function initializeApp(config: any): any;
  export function getApps(): any[];
  export function getApp(): any;
  export interface FirebaseApp {}
}

declare module 'firebase/auth' {
  export function getAuth(app?: any): any;
  export function initializeAuth(app: any, config?: any): any;
  export function getReactNativePersistence(storage: any): any;
  export function signInWithEmailAndPassword(auth: any, email: string, pass: string): Promise<any>;
  export function createUserWithEmailAndPassword(auth: any, email: string, pass: string): Promise<any>;
  export function signOut(auth: any): Promise<void>;
  export function onAuthStateChanged(auth: any, callback: (user: any) => void): () => void;
  export function signInWithCredential(auth: any, credential: any): Promise<any>;
  export function sendPasswordResetEmail(auth: any, email: string): Promise<void>;
  export class GoogleAuthProvider {
    static credential(idToken: string): any;
  }
  export interface User {
    uid: string;
    email?: string | null;
    displayName?: string | null;
    photoURL?: string | null;
  }
}

declare module 'firebase/firestore' {
  export interface DocumentSnapshotMock {
    id: string;
    data(): any;
    exists(): boolean;
  }
  export interface QuerySnapshotMock {
    docs: DocumentSnapshotMock[];
    empty: boolean;
    size: number;
  }
  export function getFirestore(app?: any): any;
  export function collection(db: any, ...pathSegments: string[]): any;
  export function doc(db: any, ...pathSegments: string[]): any;
  export function getDoc(docRef: any): Promise<any>;
  export function getDocs(query: any): Promise<any>;
  export function setDoc(docRef: any, data: any, options?: any): Promise<any>;
  export function addDoc(colRef: any, data: any): Promise<any>;
  export function updateDoc(docRef: any, data: any): Promise<any>;
  export function deleteDoc(docRef: any): Promise<any>;
  export function query(colRef: any, ...queryConstraints: any[]): any;
  export function where(fieldPath: string, opStr: string, value: any): any;
  export function orderBy(fieldPath: string, directionStr?: 'asc' | 'desc'): any;
  export function limit(limitNumber: number): any;
  export function onSnapshot(query: any, onNext: (snapshot: any) => void, onError?: (error: any) => void): () => void;
  export function serverTimestamp(): any;
  export function enableIndexedDbPersistence(db: any): Promise<void>;
}

declare module 'firebase/storage' {
  export function getStorage(app?: any): any;
  export function ref(storage: any, path: string): any;
  export function uploadBytesResumable(storageRef: any, data: any): Promise<any>;
  export function getDownloadURL(ref: any): Promise<string>;
}

declare module '@react-native-async-storage/async-storage' {
  const AsyncStorage: {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
  };
  export default AsyncStorage;
}

declare module '@prisma/client' {
  export class PrismaClient {
    user: any;
    $disconnect(): Promise<void>;
  }
}

declare module 'firebase-admin/app' {
  export function initializeApp(config?: any): any;
  export function cert(serviceAccount: any): any;
}

declare module 'firebase-admin/firestore' {
  export function getFirestore(): any;
}
