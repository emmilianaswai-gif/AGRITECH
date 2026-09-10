import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { accessApi, type Role, type RoleAccessConfig } from "../api/client";
import { ROLE_ACCESS } from "../data/access";

export const CORE_ROLES: Role[] = ["FAMER", "CUSTOMER", "SUPPLIER", "ADMIN"];

function defaultConfig(): RoleAccessConfig[] {
  return (Object.keys(ROLE_ACCESS) as Role[]).map((role) => ({
    role,
    services: [...ROLE_ACCESS[role]],
  }));
}

interface AccessContextValue {
  config: RoleAccessConfig[];
  roles: string[];
  loading: boolean;
  refresh: () => Promise<void>;
  canAccess: (role: string | undefined | null, serviceId: string | null) => boolean;
  servicesOf: (role: string | undefined | null) => string[];
  save: (role: string, services: string[]) => Promise<void>;
  addRole: (role: string) => Promise<void>;
  removeRole: (role: string) => Promise<void>;
}

const AccessContext = createContext<AccessContextValue>({
  config: defaultConfig(),
  roles: [...CORE_ROLES],
  loading: true,
  refresh: async () => {},
  canAccess: () => false,
  servicesOf: () => [],
  save: async () => {},
  addRole: async () => {},
  removeRole: async () => {},
});

export function AccessProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<RoleAccessConfig[]>(defaultConfig);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await accessApi.getAll();
      setConfig(data);
    } catch {
      // keep the static defaults if the backend is unreachable
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const canAccess = useCallback(
    (role: string | undefined | null, serviceId: string | null): boolean => {
      if (serviceId === null) return true;
      if (!role) return false;
      if (role === "SUPER_ADMIN") return true;
      const found = config.find((c) => c.role === role);
      if (!found) return false;
      return found.services.includes(serviceId);
    },
    [config],
  );

  const servicesOf = useCallback(
    (role: string | undefined | null): string[] => {
      if (!role) return [];
      if (role === "SUPER_ADMIN") return config.flatMap((c) => c.services);
      return config.find((c) => c.role === role)?.services ?? [];
    },
    [config],
  );

  const save = useCallback(async (role: string, services: string[]) => {
    await accessApi.save(role, services);
    await refresh();
  }, [refresh]);

  const addRole = useCallback(async (role: string) => {
    await accessApi.addRole(role);
    await refresh();
  }, [refresh]);

  const removeRole = useCallback(async (role: string) => {
    await accessApi.deleteRole(role);
    await refresh();
  }, [refresh]);

  const roles = useCallback(() => {
    const set = new Set<string>(CORE_ROLES);
    config.forEach((c) => set.add(c.role));
    return [...set];
  }, [config])();

  return (
    <AccessContext.Provider
      value={{ config, roles, loading, refresh, canAccess, servicesOf, save, addRole, removeRole }}
    >
      {children}
    </AccessContext.Provider>
  );
}

export function useAccess() {
  return useContext(AccessContext);
}