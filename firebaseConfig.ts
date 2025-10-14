// firebaseConfig.ts
import { initializeApp, FirebaseApp, deleteApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

export const FIREBASE_CONFIG_KEY = 'firebaseConfig';

interface FirebaseServices {
    app: FirebaseApp;
    auth: Auth;
    db: Firestore;
    storage: FirebaseStorage;
}

// Keep track of the current app instance to delete it before re-initializing
let currentFirebaseApp: FirebaseApp | null = null;

export function initializeFirebase(): { isInitialized: true; services: FirebaseServices } | { isInitialized: false; error: string } {
    if (currentFirebaseApp) {
        try {
            deleteApp(currentFirebaseApp);
        } catch (error) {
            console.error("Error deleting old firebase app:", error)
        }
        currentFirebaseApp = null;
    }

    const storedConfigStr = localStorage.getItem(FIREBASE_CONFIG_KEY);
    if (!storedConfigStr) {
        return { isInitialized: false, error: "Configuração do Firebase não encontrada no localStorage." };
    }

    try {
        const config = JSON.parse(storedConfigStr);
        
        const isConfigValid = config &&
            config.apiKey && !config.apiKey.includes("YOUR_") &&
            config.authDomain && !config.authDomain.includes("YOUR_") &&
            config.projectId && !config.projectId.includes("YOUR_");

        if (!isConfigValid) {
            return { isInitialized: false, error: "A configuração do Firebase está incompleta ou contém valores de exemplo." };
        }

        const app = initializeApp(config);
        currentFirebaseApp = app; // Store the new instance

        const auth = getAuth(app);
        const db = getFirestore(app);
        const storage = getStorage(app);
        
        console.log("Firebase initialized successfully.");
        return { 
            isInitialized: true, 
            services: { app, auth, db, storage }
        };

    } catch (e) {
        console.error("Firebase initialization error:", e);
        return { isInitialized: false, error: (e as Error).message };
    }
}