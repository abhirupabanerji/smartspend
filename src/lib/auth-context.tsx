import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  register: (email: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const USERS_KEY = "fintrack_users";
const SESSION_KEY = "fintrack_session";

function getUsers(): Record<string, {email: string; password: string }> {
  const raw = localStorage.getItem(USERS_KEY);
  return raw ? JSON.parse(raw) : {};
}

function saveUsers(users: Record<string, {email: string; password: string }>) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = useCallback((email: string, password: string) => {
    const users = getUsers();
    const found = Object.entries(users).find(
      ([, u]) => u.email === email && u.password === password
    );
    if (found) {
      const u: User = { id: found[0], email: found[1].email, };
      setUser(u);
      localStorage.setItem(SESSION_KEY, JSON.stringify(u));
      return true;
    }
    return false;
  }, []);

  const register = useCallback(( email: string, password: string) => {
    const users = getUsers();
    const exists = Object.values(users).some((u) => u.email === email);
    if (exists) return false;
    const id = crypto.randomUUID();
    users[id] = {email, password };
    saveUsers(users);
    const u: User = { id, email };
    setUser(u);
    localStorage.setItem(SESSION_KEY, JSON.stringify(u));
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}