export type Role = "FAMER" | "CUSTOMER" | "ADMIN" | "SUPPLIER" | "SUPER_ADMIN";

export interface UserRequest {
  fullName: string;
  email: string;
  password: string;
  phoneNumber: string;
  address: string;
  location: string;
  role?: Role;
}

export interface UserResponse {
  id: string | null;
  fullName: string;
  email: string;
  password: string | null;
  phoneNumber: string;
  address: string;
  location?: string;
  role?: Role;
  mustChangePassword?: boolean;
}

export interface ProfileUpdateRequest {
  fullName: string;
  email: string;
  phoneNumber: string;
  address: string;
  location: string;
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

const STORAGE_KEY = "agriconnect_user";

function currentUserId(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { id?: string | null };
    return parsed?.id || null;
  } catch {
    return null;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const isFormData = options?.body instanceof FormData;
  const headers = new Headers(
    isFormData
      ? (options?.headers as HeadersInit) ?? {}
      : {
          "Content-Type": "application/json",
          ...(options?.headers ?? {}),
        },
  );
  const userId = currentUserId();
  if (userId) {
    headers.set("X-User-Id", userId);
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    headers,
    ...options,
  });

  if (!res.ok) {
    const message = await res.text().catch(() => res.statusText);
    throw new Error(`Request failed (${res.status}): ${message}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
}

export interface ChatResponse {
  model: string;
  reply: string;
}

export interface AiModelsResponse {
  defaultModel: string;
  models: string[];
}

export const adviceApi = {
  chat: (data: ChatRequest): Promise<ChatResponse> =>
    request<ChatResponse>("/advice/chat", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getModels: (): Promise<AiModelsResponse> =>
    request<AiModelsResponse>("/advice/models"),
};

export const usersApi = {
  register: (data: UserRequest): Promise<UserResponse> =>
    request<UserResponse>("/users/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateRole: (id: string, role: string): Promise<UserResponse> =>
    request<UserResponse>(`/users/${encodeURIComponent(id)}/role`, {
      method: "PUT",
      body: JSON.stringify({ role }),
    }),

  login: (identifier: string, password: string, role?: string): Promise<UserResponse> =>
    request<UserResponse>("/users/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password, role }),
    }),

  logout: (): Promise<void> =>
    request<void>("/users/logout", { method: "POST" }),

  getAll: (): Promise<UserResponse[]> =>
    request<UserResponse[]>("/users/all"),

  enroll: (data: UserRequest, actorRole: string): Promise<UserResponse> =>
    request<UserResponse>(`/users/enroll?role=${encodeURIComponent(actorRole)}`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  changePassword: (
    identifier: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<UserResponse> =>
    request<UserResponse>("/users/change-password", {
      method: "POST",
      body: JSON.stringify({ identifier, oldPassword, newPassword }),
    }),

  getById: (id: string): Promise<UserResponse> =>
    request<UserResponse>(`/users/${id}`),

  getByPhone: (phoneNumber: string): Promise<UserResponse> =>
    request<UserResponse>(`/users/phone/${encodeURIComponent(phoneNumber)}`),

  updateProfile: (id: string, data: ProfileUpdateRequest): Promise<UserResponse> =>
    request<UserResponse>(`/users/${encodeURIComponent(id)}/profile`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

export interface AuthMessage {
  message: string;
}

export const authApi = {
  forgotPassword: (identifier: string): Promise<AuthMessage> =>
    request<AuthMessage>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ identifier }),
    }),

  resetPassword: (identifier: string, code: string, newPassword: string): Promise<AuthMessage> =>
    request<AuthMessage>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ identifier, code, newPassword }),
    }),
};

export interface ChatMessageRequest {
  senderId: string;
  receiverId: string;
  content: string;
}

export interface ChatMessageResponse {
  id: string | null;
  senderId: string;
  receiverId: string;
  senderName: string | null;
  receiverName: string | null;
  content: string;
  createdAt: string | null;
}

export interface Conversation {
  partnerId: string;
  partnerName: string;
  partnerRole: string;
  lastMessage: string;
  lastTime: string | null;
}

export const chatApi = {
  send: (data: ChatMessageRequest): Promise<ChatMessageResponse> =>
    request<ChatMessageResponse>("/chat/send", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getConversation: (userId: string, partner: string): Promise<ChatMessageResponse[]> =>
    request<ChatMessageResponse[]>(`/chat/conversation?userId=${encodeURIComponent(userId)}&partner=${encodeURIComponent(partner)}`),

  getConversations: (userId: string): Promise<Conversation[]> =>
    request<Conversation[]>(`/chat/${encodeURIComponent(userId)}/conversations`),
};

export interface RoleAccessConfig {
  role: string;
  services: string[];
}

export interface SupportContact {
  id: number;
  name: string;
  contact: string;
  phone: string;
  email: string;
  category: string;
  description: string;
  role?: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SupportContactRequest {
  name: string;
  contact: string;
  phone: string;
  email: string;
  category: string;
  description: string;
  role: string;
  userId: string;
}

export const supportApi = {
  getAll: (): Promise<SupportContact[]> => request<SupportContact[]>("/support"),

  create: (data: SupportContactRequest): Promise<SupportContact> =>
    request<SupportContact>("/support", { method: "POST", body: JSON.stringify(data) }),

  update: (id: number, data: SupportContactRequest): Promise<SupportContact> =>
    request<SupportContact>(`/support/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  remove: (id: number, role: string, userId: string): Promise<void> =>
    request<void>(`/support/${id}?role=${encodeURIComponent(role)}&userId=${encodeURIComponent(userId)}`, {
      method: "DELETE",
    }),
};

export interface SmsRecord {
  id: number | null;
  fromName: string | null;
  toName: string | null;
  toPhone: string;
  body: string;
  status: string | null;
  provider: string | null;
  createdAt: string | null;
}

export interface SmsRequestData {
  fromName?: string;
  toName?: string;
  toPhone: string;
  body: string;
}

export const smsApi = {
  send: (data: SmsRequestData): Promise<SmsRecord> =>
    request<SmsRecord>("/sms/send", { method: "POST", body: JSON.stringify(data) }),
};

export const accessApi = {
  getAll: (): Promise<RoleAccessConfig[]> =>
    request<RoleAccessConfig[]>("/access"),

  addRole: (role: string): Promise<RoleAccessConfig> =>
    request<RoleAccessConfig>("/access/roles", {
      method: "POST",
      body: JSON.stringify({ role }),
    }),

  save: (role: string, services: string[]): Promise<RoleAccessConfig> =>
    request<RoleAccessConfig>(`/access/${encodeURIComponent(role)}`, {
      method: "POST",
      body: JSON.stringify({ services }),
    }),

  deleteRole: (role: string): Promise<void> =>
    request<void>(`/access/${encodeURIComponent(role)}`, { method: "DELETE" }),
};

export type LearningResourceType = "COURSE" | "VIDEO" | "CALENDAR" | "CERTIFICATION";

export interface LearningResource {
  id: number | null;
  type: LearningResourceType | string;
  title: string;
  description: string | null;
  category: string | null;
  meta: string | null;
  progress: number | null;
  status: string | null;
  resourceUrl: string | null;
  createdAt: string | null;
}

export type LearningResourceRequest = Omit<LearningResource, "id" | "createdAt">;

export const learningApi = {
  getAll: (type?: LearningResourceType): Promise<LearningResource[]> =>
    request<LearningResource[]>(`/learning${type ? `?type=${type}` : ""}`),

  getById: (id: number): Promise<LearningResource> =>
    request<LearningResource>(`/learning/${id}`),

  create: (data: LearningResourceRequest, role: string): Promise<LearningResource> =>
    request<LearningResource>(`/learning?role=${encodeURIComponent(role)}`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  upload: (data: FormData, role: string): Promise<LearningResource> =>
    request<LearningResource>(`/learning/upload?role=${encodeURIComponent(role)}`, {
      method: "POST",
      body: data,
    }),

  delete: (id: number, role: string): Promise<void> =>
    request<void>(`/learning/${id}?role=${encodeURIComponent(role)}`, { method: "DELETE" }),
};

export interface SaleItem {
  id: number | null;
  title: string;
  category: string | null;
  description: string | null;
  quantity: number | null;
  unit: string | null;
  unitPrice: number | null;
  marketPrice: number | null;
  feePercent: number | null;
  status: string | null;
  createdAt: string | null;
}

export type SaleItemRequest = Omit<SaleItem, "id" | "createdAt">;

export const salesApi = {
  getAll: (): Promise<SaleItem[]> => request<SaleItem[]>("/sales"),

  getById: (id: number): Promise<SaleItem> => request<SaleItem>(`/sales/${id}`),

  create: (data: SaleItemRequest): Promise<SaleItem> =>
    request<SaleItem>("/sales", { method: "POST", body: JSON.stringify(data) }),

  delete: (id: number): Promise<void> =>
    request<void>(`/sales/${id}`, { method: "DELETE" }),
};

export interface BuyItem {
  id: number | null;
  title: string;
  category: string | null;
  description: string | null;
  quantity: number | null;
  unit: string | null;
  unitPrice: number | null;
  supplier: string | null;
  status: string | null;
  createdAt: string | null;
}

export type BuyItemRequest = Omit<BuyItem, "id" | "createdAt">;

export const buyApi = {
  getAll: (): Promise<BuyItem[]> => request<BuyItem[]>("/buy"),

  getById: (id: number): Promise<BuyItem> => request<BuyItem>(`/buy/${id}`),

  create: (data: BuyItemRequest): Promise<BuyItem> =>
    request<BuyItem>("/buy", { method: "POST", body: JSON.stringify(data) }),

  delete: (id: number): Promise<void> =>
    request<void>(`/buy/${id}`, { method: "DELETE" }),
};

export interface Store {
  id: number | null;
  name: string;
  category: string | null;
  location: string | null;
  description: string | null;
  phone: string | null;
  email: string | null;
  rating: number | null;
  createdAt: string | null;
}

export type StoreRequest = Omit<Store, "id" | "createdAt">;

export const storeApi = {
  getAll: (): Promise<Store[]> => request<Store[]>("/stores"),

  getById: (id: number): Promise<Store> => request<Store>(`/stores/${id}`),

  create: (data: StoreRequest): Promise<Store> =>
    request<Store>("/stores", { method: "POST", body: JSON.stringify(data) }),

  delete: (id: number): Promise<void> =>
    request<void>(`/stores/${id}`, { method: "DELETE" }),
};

export interface InventoryItem {
  id: number | null;
  title: string;
  category: string | null;
  supplier: string | null;
  ownProduce: boolean;
  costPrice: number | null;
  sellingPrice: number | null;
  quantity: number | null;
  unit: string | null;
  createdAt: string | null;
}

export type InventoryItemRequest = Omit<InventoryItem, "id" | "createdAt">;

export interface CustomerOrder {
  id: number | null;
  inventoryItemId: number;
  itemTitle: string;
  customer: string;
  customerUserId: string | null;
  sellerUserId: string | null;
  quantity: number | null;
  unit: string | null;
  unitPrice: number | null;
  costPrice: number | null;
  total: number | null;
  profit: number | null;
  status: string | null;
  paymentMethod: string | null;
  customerPhone: string | null;
  customerLocation: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string | null;
}

export interface CustomerOrderRequest {
  inventoryItemId: number;
  customer: string;
  quantity: number;
  status?: string;
  customerUserId?: string;
  sellerUserId?: string;
  paymentMethod?: string;
  phone?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
}

export interface InventoryTotals {
  inventoryCount: number;
  inventoryValue: number;
  orderCount: number;
  totalSales: number;
  totalProfit: number;
}

export interface WalletTransaction {
  id: number | null;
  direction: string;
  category: string;
  description: string;
  amount: number | null;
  orderId: number | null;
  createdAt: string | null;
}

export interface WalletSummary {
  balance: number;
  moneyIn: number;
  moneyOut: number;
  transactionCount: number;
}

export interface PaymentAttempt {
  id: number | null;
  reference: string;
  type: string;
  provider: string;
  phone: string | null;
  accountNumber: string | null;
  accountName: string | null;
  amount: number | null;
  status: string;
  note: string | null;
  createdAt: string | null;
  completedAt: string | null;
}

export const walletApi = {
  transactions: (): Promise<WalletTransaction[]> =>
    request<WalletTransaction[]>("/wallet/transactions"),

  summary: (): Promise<WalletSummary> =>
    request<WalletSummary>("/wallet/summary"),

  withdraw: (amount: number, method: string): Promise<WalletTransaction> =>
    request<WalletTransaction>("/wallet/withdraw", {
      method: "POST",
      body: JSON.stringify({ amount, method }),
    }),

  deposit: (
    amount: number,
    provider: string,
    phone: string,
    accountNumber?: string,
    accountName?: string,
  ): Promise<PaymentAttempt> =>
    request<PaymentAttempt>("/wallet/deposit", {
      method: "POST",
      body: JSON.stringify({ amount, provider, phone: phone || null, accountNumber: accountNumber || null, accountName: accountName || null }),
    }),

  payout: (
    amount: number,
    provider: string,
    phone: string,
    accountNumber?: string,
    accountName?: string,
  ): Promise<PaymentAttempt> =>
    request<PaymentAttempt>("/wallet/payout", {
      method: "POST",
      body: JSON.stringify({ amount, provider, phone: phone || null, accountNumber: accountNumber || null, accountName: accountName || null }),
    }),

  payments: (): Promise<PaymentAttempt[]> =>
    request<PaymentAttempt[]>("/wallet/payments"),

  confirmPayment: (reference: string): Promise<PaymentAttempt> =>
    request<PaymentAttempt>(`/wallet/payments/${encodeURIComponent(reference)}/confirm`, {
      method: "POST",
      body: JSON.stringify({}),
    }),

  cancelPayment: (reference: string): Promise<PaymentAttempt> =>
    request<PaymentAttempt>(`/wallet/payments/${encodeURIComponent(reference)}/cancel`, {
      method: "POST",
      body: JSON.stringify({}),
    }),
};

export interface TradingStats {
  todaySales: number;
  todayProfit: number;
  monthSales: number;
  monthProfit: number;
  sixMonthSales: number;
  sixMonthProfit: number;
  yearSales: number;
  yearProfit: number;
  allTimeSales: number;
  allTimeProfit: number;
  cashCollected: number;
  checkCollected: number;
  outstandingDebt: number;
  pendingTotal: number;
  outstandingDebtCount: number;
}

export const adminApi = {
  inventory: {
    getAll: (): Promise<InventoryItem[]> =>
      request<InventoryItem[]>("/admin/inventory"),
    create: (data: InventoryItemRequest): Promise<InventoryItem> =>
      request<InventoryItem>("/admin/inventory", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    delete: (id: number): Promise<void> =>
      request<void>(`/admin/inventory/${id}`, { method: "DELETE" }),
  },
  orders: {
    getAll: (): Promise<CustomerOrder[]> =>
      request<CustomerOrder[]>("/admin/orders"),
    create: (data: CustomerOrderRequest): Promise<CustomerOrder> =>
      request<CustomerOrder>("/admin/orders", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    delete: (id: number): Promise<void> =>
      request<void>(`/admin/orders/${id}`, { method: "DELETE" }),
    summary: (): Promise<InventoryTotals> =>
      request<InventoryTotals>("/admin/orders/summary"),
    tradingStats: (): Promise<TradingStats> =>
      request<TradingStats>("/admin/orders/trading-stats"),
    collect: (id: number, paymentMethod: string): Promise<CustomerOrder> =>
      request<CustomerOrder>(`/admin/orders/${id}/collect`, {
        method: "POST",
        body: JSON.stringify({ paymentMethod }),
      }),
    updateStatus: (id: number, status: string): Promise<CustomerOrder> =>
      request<CustomerOrder>(`/admin/orders/${id}/status`, {
        method: "POST",
        body: JSON.stringify({ status }),
      }),
  },
};