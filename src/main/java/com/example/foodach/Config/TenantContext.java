package com.example.foodach.Config;

public class TenantContext {

    private static final ThreadLocal<String> CURRENT_USER_ID = new ThreadLocal<>();
    private static final ThreadLocal<Long> CURRENT_STORE_ID = new ThreadLocal<>();

    public static void set(String userId) {
        CURRENT_USER_ID.set(userId);
    }

    public static String get() {
        return CURRENT_USER_ID.get();
    }

    public static void setStoreId(Long storeId) {
        if (storeId == null) {
            CURRENT_STORE_ID.remove();
        } else {
            CURRENT_STORE_ID.set(storeId);
        }
    }

    public static Long getStoreId() {
        return CURRENT_STORE_ID.get();
    }

    public static void clear() {
        CURRENT_USER_ID.remove();
        CURRENT_STORE_ID.remove();
    }
}