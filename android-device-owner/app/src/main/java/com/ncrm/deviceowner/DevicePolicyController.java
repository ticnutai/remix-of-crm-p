package com.ncrm.deviceowner;

import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.content.Context;
import android.os.Build;
import android.os.UserManager;

final class DevicePolicyController {
    private DevicePolicyController() {
    }

    static ComponentName adminComponent(Context context) {
        return new ComponentName(context, DeviceOwnerReceiver.class);
    }

    static DevicePolicyManager dpm(Context context) {
        return (DevicePolicyManager) context.getSystemService(Context.DEVICE_POLICY_SERVICE);
    }

    static boolean isDeviceOwner(Context context) {
        DevicePolicyManager manager = dpm(context);
        return manager != null && manager.isDeviceOwnerApp(context.getPackageName());
    }

    static boolean isAdminActive(Context context) {
        DevicePolicyManager manager = dpm(context);
        return manager != null && manager.isAdminActive(adminComponent(context));
    }

    static void applyBaselinePolicies(Context context) {
        DevicePolicyManager manager = dpm(context);
        if (manager == null || !isDeviceOwner(context)) {
            return;
        }

        ComponentName admin = adminComponent(context);
        setRestriction(context, manager, admin, UserManager.DISALLOW_FACTORY_RESET, BlockerStore.KEY_BLOCK_FACTORY_RESET);
        setRestriction(context, manager, admin, UserManager.DISALLOW_SAFE_BOOT, BlockerStore.KEY_BLOCK_SAFE_BOOT);
        setRestriction(context, manager, admin, UserManager.DISALLOW_ADD_USER, BlockerStore.KEY_BLOCK_ADD_USERS);
        setRestriction(context, manager, admin, UserManager.DISALLOW_REMOVE_USER, BlockerStore.KEY_BLOCK_ADD_USERS);
        setRestriction(context, manager, admin, UserManager.DISALLOW_INSTALL_UNKNOWN_SOURCES, BlockerStore.KEY_BLOCK_UNKNOWN_SOURCES);
        setRestriction(context, manager, admin, UserManager.DISALLOW_CONFIG_DATE_TIME, BlockerStore.KEY_BLOCK_DATE_TIME);
        setRestriction(context, manager, admin, UserManager.DISALLOW_CONFIG_WIFI, BlockerStore.KEY_BLOCK_WIFI_CONFIG);
        setRestriction(context, manager, admin, UserManager.DISALLOW_APPS_CONTROL, BlockerStore.KEY_BLOCK_APPS_CONTROL);
        addRestriction(manager, admin, UserManager.DISALLOW_MOUNT_PHYSICAL_MEDIA);

        manager.setCameraDisabled(admin, BlockerStore.getBoolean(context, BlockerStore.KEY_BLOCK_CAMERA, true));
        manager.setLockTaskPackages(admin, BlockerStore.packageAllowlist(context));

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            manager.setStatusBarDisabled(admin, BlockerStore.getBoolean(context, BlockerStore.KEY_BLOCK_STATUS_BAR, true));
        }
    }

    static void clearBaselinePolicies(Context context) {
        DevicePolicyManager manager = dpm(context);
        if (manager == null || !isDeviceOwner(context)) {
            return;
        }

        ComponentName admin = adminComponent(context);
        clearRestriction(manager, admin, UserManager.DISALLOW_FACTORY_RESET);
        clearRestriction(manager, admin, UserManager.DISALLOW_SAFE_BOOT);
        clearRestriction(manager, admin, UserManager.DISALLOW_ADD_USER);
        clearRestriction(manager, admin, UserManager.DISALLOW_REMOVE_USER);
        clearRestriction(manager, admin, UserManager.DISALLOW_INSTALL_UNKNOWN_SOURCES);
        clearRestriction(manager, admin, UserManager.DISALLOW_CONFIG_DATE_TIME);
        clearRestriction(manager, admin, UserManager.DISALLOW_CONFIG_WIFI);
        clearRestriction(manager, admin, UserManager.DISALLOW_APPS_CONTROL);
        clearRestriction(manager, admin, UserManager.DISALLOW_MOUNT_PHYSICAL_MEDIA);

        manager.setCameraDisabled(admin, false);
        manager.setLockTaskPackages(admin, new String[]{});

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            manager.setStatusBarDisabled(admin, false);
        }
    }

    private static void addRestriction(DevicePolicyManager manager, ComponentName admin, String restriction) {
        manager.addUserRestriction(admin, restriction);
    }

    private static void setRestriction(
            Context context,
            DevicePolicyManager manager,
            ComponentName admin,
            String restriction,
            String preferenceKey
    ) {
        if (BlockerStore.getBoolean(context, preferenceKey, true)) {
            manager.addUserRestriction(admin, restriction);
        } else {
            manager.clearUserRestriction(admin, restriction);
        }
    }

    private static void clearRestriction(DevicePolicyManager manager, ComponentName admin, String restriction) {
        manager.clearUserRestriction(admin, restriction);
    }
}
