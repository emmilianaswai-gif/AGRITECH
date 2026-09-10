import type { Role } from "../api/client";

export type RoleKey = Role;

export const ROLE_LABELS: Record<Role, string> = {
  FAMER: "Farmer",
  CUSTOMER: "Customer",
  SUPPLIER: "Supplier",
  ADMIN: "Administrator",
  SUPER_ADMIN: "Super Admin",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  FAMER: "Sell your harvest directly, trade stock, and talk to customers without middlemen.",
  CUSTOMER: "Buy direct, trade stock, sell, collect debts, and use your wallet — full access.",
  SUPPLIER: "Supply agro inputs, list your store, and connect with farmers.",
  ADMIN: "Full control of the whole platform.",
  SUPER_ADMIN: "Platform owner - creates login categories and manages every role.",
};

export const ACCESS_RATES: Record<Role, string> = {
  FAMER: "Full access",
  CUSTOMER: "Full access",
  SUPPLIER: "Partner access",
  ADMIN: "Full access",
  SUPER_ADMIN: "Full access",
};

export const ROLE_ACCESS: Record<Role, string[]> = {
  FAMER: ["dashboard", "learning", "advice", "stores", "buy", "orders", "stock", "customer", "wallet", "messages", "exchange", "support", "access"],
  CUSTOMER: ["dashboard", "learning", "advice", "stores", "buy", "orders", "stock", "customer", "wallet", "messages", "exchange", "support", "access"],
  SUPPLIER: ["dashboard", "learning", "advice", "stores", "buy", "messages", "exchange", "support"],
  ADMIN: ["dashboard", "learning", "advice", "stores", "buy", "orders", "stock", "customer", "wallet", "messages", "exchange", "support", "access"],
  SUPER_ADMIN: ["dashboard", "learning", "advice", "stores", "buy", "orders", "stock", "customer", "wallet", "messages", "exchange", "support", "access"],
};

export const DEFAULT_ROLE: Role = "FAMER";

export function roleLabel(role?: string | null): string {
  return (role && ROLE_LABELS[role as Role]) ?? role ?? ROLE_LABELS[DEFAULT_ROLE];
}

export function accessRate(role?: string | null): string {
  if (!role) return ACCESS_RATES[DEFAULT_ROLE];
  return ACCESS_RATES[role as Role] ?? "Custom access";
}

export function canAccess(role: Role | undefined | null, serviceId: string | null): boolean {
  if (serviceId === null) return true;
  if (!role) return true;
  return (ROLE_ACCESS[role] ?? ROLE_ACCESS[DEFAULT_ROLE]).includes(serviceId);
}