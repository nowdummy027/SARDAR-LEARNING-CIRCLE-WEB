import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, onSnapshot } from 'firebase/firestore';

interface UserData {
  role: string;
  enrolledCourses?: string[];
  name?: string;
  phone?: string;
  photoURL?: string;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeUserDoc: (() => void) | null = null;
    
    const unsubscribeAuth = onAuthStateChanged(auth, async (userObj) => {
      setUser(userObj);
      if (userObj) {
        setLoading(true);
        const docRef = doc(db, 'users', userObj.uid);
        
        unsubscribeUserDoc = onSnapshot(docRef, (docSnap) => {
          let data = docSnap.exists() ? docSnap.data() as UserData : null;
          
          if (userObj.email === 'sardarswapan219@gmail.com') {
            data = data || {} as UserData;
            data.role = 'admin';
          }
          
          setUserData(data);
          setLoading(false);
        }, (error) => {
          console.error("Error fetching user data:", error);
          setLoading(false);
        });
      } else {
        if (unsubscribeUserDoc) unsubscribeUserDoc();
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      if (unsubscribeUserDoc) unsubscribeUserDoc();
      unsubscribeAuth();
    };
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
