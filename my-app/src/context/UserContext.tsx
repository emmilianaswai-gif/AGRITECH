import { createContext, useContext, useState, type ReactNode } from "react";
import type { Role, UserResponse } from "../api/client";
import { usersApi } from "../api/client";

interface UserContextValue {
  user: UserResponse | null;
  login: (user: UserResponse) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextValue>({
  user: null,
  login: () => {},
  logout: () => {},
});

const STORAGE_KEY = "agriconnect_user";

function loadUser(): UserResponse | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UserResponse) : null;
  } catch {
    return null;
  }
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(loadUser);

  const login = (u: UserResponse) => {
    setUser(u);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
  };

  const logout = () => {
    try {
      void usersApi.logout().catch(() => {});
    } catch {
      /* no-op */
    }
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <UserContext.Provider value={{ user, login, logout }}>
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