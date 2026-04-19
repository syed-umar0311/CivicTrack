import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);

          // Bootstrap Admin check: If user email matches owner or first user
          const isBootstrapAdmin = user.email === 'umarzain2005@gmail.com';

          if (docSnap.exists()) {
            let data = docSnap.data() as UserProfile;
            if (isBootstrapAdmin && data.role !== 'admin') {
              // Update to admin
              await setDoc(docRef, { ...data, role: 'admin' }, { merge: true });
              data.role = 'admin';
            }
            // Also ensure document exists in 'admins' collection
            if (data.role === 'admin') {
              await setDoc(doc(db, 'admins', user.uid), { uid: user.uid, email: user.email }, { merge: true });
            }
            setProfile(data);
          } else {
            // New user, create profile
            const role = isBootstrapAdmin ? 'admin' : 'resident';
            const newProfile: UserProfile = {
              uid: user.uid,
              name: user.displayName || 'Anonymous User',
              email: user.email || '',
              role,
              createdAt: serverTimestamp(),
            };
            await setDoc(docRef, newProfile);
            if (role === 'admin') {
              await setDoc(doc(db, 'admins', user.uid), { uid: user.uid, email: user.email }, { merge: true });
            }
            setProfile(newProfile);
          }
        } catch (error) {
          console.error("Error processing user profile:", error);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signOut = () => auth.signOut();

  const value = {
    user,
    profile,
    loading,
    isAdmin: profile?.role === 'admin',
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
