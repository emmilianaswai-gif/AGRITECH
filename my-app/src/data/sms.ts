export interface SmsContact {
  id: string;
  name: string;
  phone: string;
}

export interface SentSms {
  id: string;
  toPhone: string;
  toName: string;
  body: string;
  status: string;
  provider: string | null;
  createdAt: string;
}

const contactsKey = (userId?: string | null) => `agriconnect_sms_contacts:${userId ?? "guest"}`;
const senderKey = (userId?: string | null) => `agriconnect_sms_sender:${userId ?? "guest"}`;
const recentKey = (userId?: string | null) => `agriconnect_sms_recent:${userId ?? "guest"}`;

export function normalizePhone(phone: string | null | undefined): string {
  return (phone ?? "").replace(/\D/g, "");
}

export function loadContacts(userId?: string | null): SmsContact[] {
  try {
    const raw = localStorage.getItem(contactsKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SmsContact[]) : [];
  } catch {
    return [];
  }
}

export function persistContacts(userId: string | null | undefined, contacts: SmsContact[]): void {
  try {
    localStorage.setItem(contactsKey(userId), JSON.stringify(contacts));
  } catch {
    // ignore storage failures (private mode, quota, ...)
  }
}

export function makeContact(name: string, phone: string): SmsContact {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: name.trim(),
    phone: phone.trim(),
  };
}

export function loadSenderName(userId?: string | null): string {
  try {
    return localStorage.getItem(senderKey(userId)) ?? "";
  } catch {
    return "";
  }
}

export function persistSenderName(userId: string | null | undefined, name: string): void {
  try {
    localStorage.setItem(senderKey(userId), name);
  } catch {
    // ignore storage failures
  }
}

export function loadRecent(userId?: string | null): SentSms[] {
  try {
    const raw = localStorage.getItem(recentKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SentSms[]) : [];
  } catch {
    return [];
  }
}

export function persistRecent(userId: string | null | undefined, recent: SentSms[]): void {
  try {
    localStorage.setItem(recentKey(userId), JSON.stringify(recent.slice(0, 30)));
  } catch {
    // ignore storage failures
  }
}

export function smsHeader(storeName: string): string {
  const name = storeName.trim() || "Agro Store";
  return `AGRICONNECT - ${name}`;
}

export function composeSmsBody(storeName: string, message: string): string {
  return `${smsHeader(storeName)}: ${message.trim()}`;
}

export function smsSegments(text: string): number {
  const len = text.length;
  if (len === 0) return 0;
  return len <= 160 ? 1 : Math.ceil(len / 153);
}
