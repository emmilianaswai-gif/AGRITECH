import { createContext, useContext, useState, type ReactNode } from "react";
import type { Role, UserResponse } from "../api/client";

interface UserContextValue {
  user: UserResponse | null;
  isGuest: boolean;
  login: (user: UserResponse) => void;
  enterAsGuest: () => void;
  logout: () => void;
}

const UserContext = createContext<UserContextValue>({
  user: null,
  isGuest: false,
  login: () => {},
  enterAsGuest: () => {},
  logout: () => {},
});

const STORAGE_KEY = "agriconnect_user";
const GUEST_KEY = "agriconnect_guest";

function loadUser(): UserResponse | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UserResponse) : null;
  } catch {
    return null;
  }
}

function loadGuest(): boolean {
  try {
    return localStorage.getItem(GUEST_KEY) === "1";
  } catch {
    return false;
  }
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(loadUser);
  const [isGuest, setIsGuest] = useState<boolean>(loadGuest);

  const login = (u: UserResponse) => {
    setUser(u);
    setIsGuest(false);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    localStorage.removeItem(GUEST_KEY);
  };

  const enterAsGuest = () => {
    setUser(null);
    setIsGuest(true);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem(GUEST_KEY, "1");
  };

  const logout = () => {
    setUser(null);
    setIsGuest(false);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(GUEST_KEY);
  };

  return (
    <UserContext.Provider value={{ user, isGuest, login, enterAsGuest, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}

export function roleOf(user: UserResponse | null): Role | undefined {
  return user?.role ?? undefined;
}