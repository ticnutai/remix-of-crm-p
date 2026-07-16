package com.ncrm.deviceowner;

import android.app.admin.DeviceAdminReceiver;
import android.content.Context;
import android.content.Intent;
import android.widget.Toast;

public class DeviceOwnerReceiver extends DeviceAdminReceiver {
    @Override
    public void onEnabled(Context context, Intent intent) {
        Toast.makeText(context, R.string.admin_enabled, Toast.LENGTH_SHORT).show();
        DevicePolicyController.applyBaselinePolicies(context);
    }

    @Override
    public void onDisabled(Context context, Intent intent) {
        Toast.makeText(context, R.string.admin_disabled, Toast.LENGTH_SHORT).show();
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) {
            DevicePolicyController.applyBaselinePolicies(context);
        }
    }
}
