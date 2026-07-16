package com.ncrm.deviceowner;

import android.content.Context;
import android.content.SharedPreferences;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

final class BlockerStore {
    static final String PREFS = "site_blocker_settings";

    static final String KEY_BLOCKED_SITES = "blocked_sites";
    static final String KEY_ALLOWED_SITES = "allowed_sites";
    static final String KEY_BLOCKED_APPS = "blocked_apps";
    static final String KEY_KIOSK_PACKAGE = "kiosk_package";
    static final String KEY_ADMIN_PIN = "admin_pin";
    static final String KEY_REPORTS = "reports";

    static final String KEY_BLOCK_CAMERA = "block_camera";
    static final String KEY_BLOCK_STATUS_BAR = "block_status_bar";
    static final String KEY_BLOCK_FACTORY_RESET = "block_factory_reset";
    static final String KEY_BLOCK_SAFE_BOOT = "block_safe_boot";
    static final String KEY_BLOCK_ADD_USERS = "block_add_users";
    static final String KEY_BLOCK_UNKNOWN_SOURCES = "block_unknown_sources";
    static final String KEY_BLOCK_WIFI_CONFIG = "block_wifi_config";
    static final String KEY_BLOCK_DATE_TIME = "block_date_time";
    static final String KEY_BLOCK_APPS_CONTROL = "block_apps_control";

    private BlockerStore() {
    }

    static SharedPreferences prefs(Context context) {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    static String get(Context context, String key, String fallback) {
        return prefs(context).getString(key, fallback);
    }

    static boolean getBoolean(Context context, String key, boolean fallback) {
        return prefs(context).getBoolean(key, fallback);
    }

    static void put(Context context, String key, String value) {
        prefs(context).edit().putString(key, value).apply();
    }

    static void putBoolean(Context context, String key, boolean value) {
        prefs(context).edit().putBoolean(key, value).apply();
    }

    static String[] packageAllowlist(Context context) {
        String kioskPackage = get(context, KEY_KIOSK_PACKAGE, context.getPackageName()).trim();
        if (kioskPackage.isEmpty()) {
            kioskPackage = context.getPackageName();
        }
        if (kioskPackage.equals(context.getPackageName())) {
            return new String[]{context.getPackageName()};
        }
        return new String[]{context.getPackageName(), kioskPackage};
    }

    static void ensureDefaults(Context context) {
        SharedPreferences prefs = prefs(context);
        if (prefs.contains(KEY_ADMIN_PIN)) {
            return;
        }

        prefs.edit()
                .putString(KEY_ADMIN_PIN, "1234")
                .putString(KEY_BLOCKED_SITES, "youtube.com\nfacebook.com\ntiktok.com\ninstagram.com")
                .putString(KEY_ALLOWED_SITES, "")
                .putString(KEY_BLOCKED_APPS, "com.android.chrome\norg.mozilla.firefox\ncom.opera.browser")
                .putString(KEY_KIOSK_PACKAGE, context.getPackageName())
                .putBoolean(KEY_BLOCK_CAMERA, true)
                .putBoolean(KEY_BLOCK_STATUS_BAR, true)
                .putBoolean(KEY_BLOCK_FACTORY_RESET, true)
                .putBoolean(KEY_BLOCK_SAFE_BOOT, true)
                .putBoolean(KEY_BLOCK_ADD_USERS, true)
                .putBoolean(KEY_BLOCK_UNKNOWN_SOURCES, true)
                .putBoolean(KEY_BLOCK_WIFI_CONFIG, false)
                .putBoolean(KEY_BLOCK_DATE_TIME, true)
                .putBoolean(KEY_BLOCK_APPS_CONTROL, true)
                .putString(KEY_REPORTS, "")
                .apply();
    }

    static void log(Context context, String message) {
        String stamp = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.US).format(new Date());
        String current = get(context, KEY_REPORTS, "");
        String next = stamp + " - " + message + "\n" + current;
        if (next.length() > 8000) {
            next = next.substring(0, 8000);
        }
        put(context, KEY_REPORTS, next);
    }
}
