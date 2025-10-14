import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { Professional, Client } from '../types';
import { initializeFirebase } from '../firebaseConfig';
import { 
    Auth,
    User,
    onAuthStateChanged, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    signOut,
    UserCredential
} from 'firebase/auth';

interface AuthContextType {
  currentUser: User | null;
  currentClient: Client | null;
  loggedInProfessional: Professional | null;
  loading: boolean;
  clientLogin: (email: string, password?: string) => Promise<UserCredential>;
  setLoggedInProfessional: (professional: Professional | null) => void;
  clientSignup: (email: string, password: string) => Promise<UserCredential>;
  logout: () => Promise<void>;
  isFirebaseAvailable: boolean;
  reinitializeFirebase: () => Promise<boolean>;
  setCurrentClient: (client: Client | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loggedInProfessional, setLoggedInProfessional] = useState<Professional | null>(null);
  const [currentClient, setCurrentClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [authService, setAuthService] = useState<Auth | null>(null);
  const [isFirebaseAvailable, setIsFirebaseAvailable] = useState(false);
  
  const tryInitializeFirebase = useCallback(async () => {
      const result = initializeFirebase();
      // FIX: Restructured conditional to properly narrow the discriminated union type.
      if (!result.isInitialized) {
          console.warn(result.error);
          setAuthService(null);
          setIsFirebaseAvailable(false);
          setCurrentUser(null);
          setCurrentClient(null);
          setLoggedInProfessional(null);
          return false;
      }

      setAuthService(result.services.auth);
      setIsFirebaseAvailable(true);
      return true;
  }, []);

  useEffect(() => {
      tryInitializeFirebase().finally(() => setLoading(false));
  }, [tryInitializeFirebase]);

  useEffect(() => {
    let unsubscribe = () => {};
    if (authService) {
        setLoading(true);
        unsubscribe = onAuthStateChanged(authService, user => {
            setCurrentUser(user);
            if (!user) {
                // Clear roles when user signs out from firebase
                setCurrentClient(null);
                setLoggedInProfessional(null);
            }
            setLoading(false);
        });
    } else {
        setLoading(false);
    }
    return unsubscribe;
  }, [authService]);

  const clientLogin = async (email: string, password?: string) => {
    if (!authService || !password) throw new Error("Firebase não está inicializado ou senha não fornecida.");
    return signInWithEmailAndPassword(authService, email, password);
  };
  
  const clientSignup = async (email: string, password: string) => {
    if (!authService) throw new Error("Firebase não está inicializado.");
    return createUserWithEmailAndPassword(authService, email, password);
  };

  const logout = async () => {
    if (authService && authService.currentUser) {
        await signOut(authService);
    }
    // These will also be cleared by onAuthStateChanged, but setting them here is faster.
    setCurrentUser(null);
    setLoggedInProfessional(null);
    setCurrentClient(null);
  };
  
  const reinitializeFirebase = useCallback(async () => {
      setLoading(true);
      const success = await tryInitializeFirebase();
      setLoading(false);
      return success;
  }, [tryInitializeFirebase]);

  const value = {
      currentUser,
      currentClient,
      loggedInProfessional,
      loading,
      clientLogin,
      setLoggedInProfessional,
      clientSignup,
      logout,
      isFirebaseAvailable,
      reinitializeFirebase,
      setCurrentClient,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};