import { onAuthStateChanged, signInAnonymously, User, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const hasAttemptedLoginRef = useRef(false);

  useEffect(() => {
    // ? Firebase Auth ?? ?? (? ??)
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("?? Auth ?? ??:", firebaseUser ? "????" : "?????");
      
      setUser(firebaseUser);
      setLoading(false);
      
      // ? ???? ???? localStorage? ??
      if (firebaseUser) {
        localStorage.setItem("yagovibe_user", JSON.stringify(firebaseUser));
      } else {
        localStorage.removeItem("yagovibe_user");
        
        // ? ?? ??? ?? (? ??, ref ??)
        if (!hasAttemptedLoginRef.current) {
          hasAttemptedLoginRef.current = true;
          console.log("?? ?? ??? ??...");
          try {
            const result = await signInAnonymously(auth);
            console.log("? ?? ??? ??:", result.user.uid);
          } catch (error) {
            console.error("? ?? ??? ??:", error);
          }
        }
      }
    });

    return () => unsubscribe();
  }, []); // ? ??? ?? ?? (? ?? ??)

  // ? ???? ? ?? ? Firebase ?? ??
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.removeItem("yagovibe_user");
      setUser(null);
      hasAttemptedLoginRef.current = false; // ???? ? ?? ??? ??? ??
    }
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center text-gray-500 text-lg">
        ?? ??? ?? ?? ?...
      </div>
    );

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);