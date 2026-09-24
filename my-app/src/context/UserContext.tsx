import { createContext, useContext, useState, type ReactNode } from "react";
import type { Role, Store, UserResponse } from "../api/client";
import { usersApi } from "../api/client";

interface UserContextValue {
  user: UserResponse | null;
  activeStore: Store | null;
  login: (user: UserResponse, store?: Store | null) => void;
  setActiveStore: (store: Store | null) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextValue>({
  user: null,
  activeStore: null,
  login: () => {},
  setActiveStore: () => {},
  logout: () => {},
});

const STORAGE_KEY = "agriconnect_user";
const STORE_KEY = "agriconnect_active_store";

function loadUser(): UserResponse | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UserResponse) : null;
  } catch {
    return null;
  }
}

function loadStore(): Store | null {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as Store) : null;
  } catch {
    return null;
  }
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(loadUser);
  const [activeStore, setActiveStoreState] = useState<Store | null>(loadStore);

  const setActiveStore = (store: Store | null) => {
    setActiveStoreState(store);
    try {
      if (store) {
        localStorage.setItem(STORE_KEY, JSON.stringify(store));
      } else {
        localStorage.removeItem(STORE_KEY);
      }
    } catch {
      /* no-op */
    }
  };

  const login = (u: UserResponse, store?: Store | null) => {
    setUser(u);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    setActiveStore(store ?? null);
  };

  const logout = () => {
    try {
      void usersApi.logout().catch(() => {});
    } catch {
      /* no-op */
    }
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    setActiveStore(null);
  };

  return (
    <UserContext.Provider value={{ user, activeStore, login, setActiveStore, logout }}>
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