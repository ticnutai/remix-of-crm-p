package com.ncrm.deviceowner;

import android.app.Activity;
import android.app.AlertDialog;
import android.app.admin.DevicePolicyManager;
import android.content.Intent;
import android.graphics.Typeface;
import android.net.Uri;
import android.os.Bundle;
import android.provider.Settings;
import android.text.InputType;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

public class MainActivity extends Activity {
    private static final int TAB_SITES = 0;
    private static final int TAB_APPS = 1;
    private static final int TAB_SYSTEM = 2;
    private static final int TAB_KIOSK = 3;
    private static final int TAB_REPORTS = 4;
    private static final int TAB_SETTINGS = 5;

    private LinearLayout content;
    private TextView statusText;
    private int activeTab = TAB_SITES;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        BlockerStore.ensureDefaults(this);
        setContentView(buildShell());
        renderActiveTab();
        refreshStatus();
    }

    @Override
    protected void onResume() {
        super.onResume();
        refreshStatus();
    }

    private View buildShell() {
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(24, 24, 24, 24);

        TextView title = new TextView(this);
        title.setText("Android Site Blocker");
        title.setTextSize(24);
        title.setTypeface(Typeface.DEFAULT_BOLD);
        title.setGravity(Gravity.CENTER);
        root.addView(title, matchWidth());

        statusText = new TextView(this);
        statusText.setTextSize(13);
        statusText.setGravity(Gravity.CENTER);
        statusText.setPadding(0, 10, 0, 12);
        root.addView(statusText, matchWidth());

        root.addView(buildTabs(), matchWidth());

        ScrollView scrollView = new ScrollView(this);
        content = new LinearLayout(this);
        content.setOrientation(LinearLayout.VERTICAL);
        scrollView.addView(content);
        root.addView(scrollView, new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                0,
                1
        ));

        return root;
    }

    private LinearLayout buildTabs() {
        LinearLayout tabs = new LinearLayout(this);
        tabs.setOrientation(LinearLayout.VERTICAL);
        tabs.addView(tabRow(new int[]{TAB_SITES, TAB_APPS, TAB_SYSTEM}, new String[]{"Sites", "Apps", "System"}));
        tabs.addView(tabRow(new int[]{TAB_KIOSK, TAB_REPORTS, TAB_SETTINGS}, new String[]{"Kiosk", "Reports", "Settings"}));
        return tabs;
    }

    private LinearLayout tabRow(int[] tabIds, String[] labels) {
        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.HORIZONTAL);
        for (int i = 0; i < tabIds.length; i++) {
            int tabId = tabIds[i];
            Button button = new Button(this);
            button.setText(labels[i]);
            button.setAllCaps(false);
            button.setOnClickListener(v -> {
                activeTab = tabId;
                renderActiveTab();
            });
            row.addView(button, new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1));
        }
        return row;
    }

    private void renderActiveTab() {
        content.removeAllViews();
        switch (activeTab) {
            case TAB_APPS:
                renderApps();
                break;
            case TAB_SYSTEM:
                renderSystem();
                break;
            case TAB_KIOSK:
                renderKiosk();
                break;
            case TAB_REPORTS:
                renderReports();
                break;
            case TAB_SETTINGS:
                renderSettings();
                break;
            case TAB_SITES:
            default:
                renderSites();
                break;
        }
    }

    private void renderSites() {
        addSectionHeader("Blocked websites", "Edit domain lists and filtering mode.", () -> showSitesSettings());
        addReadonlyList("Blocked list", BlockerStore.get(this, BlockerStore.KEY_BLOCKED_SITES, ""));
        addReadonlyList("Allowed list", BlockerStore.get(this, BlockerStore.KEY_ALLOWED_SITES, ""));
        content.addView(button("Edit blocked websites", v -> editMultiline("Blocked websites", BlockerStore.KEY_BLOCKED_SITES)), matchWidth());
        content.addView(button("Edit allowed websites", v -> editMultiline("Allowed websites", BlockerStore.KEY_ALLOWED_SITES)), matchWidth());
        content.addView(info("Domain blocking is prepared here. Real network blocking should be connected through a local VPN service or a managed browser."));
    }

    private void renderApps() {
        addSectionHeader("Apps", "Browsers and apps that should not be available.", () -> showAppsSettings());
        addReadonlyList("Blocked packages", BlockerStore.get(this, BlockerStore.KEY_BLOCKED_APPS, ""));
        content.addView(button("Edit blocked app packages", v -> editMultiline("Blocked app packages", BlockerStore.KEY_BLOCKED_APPS)), matchWidth());
        content.addView(info("Device Owner can restrict installs and app control. Per-app hiding/suspension can be added next for managed devices."));
    }

    private void renderSystem() {
        addSectionHeader("System restrictions", "Official Android Device Owner restrictions.", () -> showSystemSettings());
        addSwitch(BlockerStore.KEY_BLOCK_CAMERA, "Disable camera");
        addSwitch(BlockerStore.KEY_BLOCK_STATUS_BAR, "Disable status bar");
        addSwitch(BlockerStore.KEY_BLOCK_FACTORY_RESET, "Block factory reset");
        addSwitch(BlockerStore.KEY_BLOCK_SAFE_BOOT, "Block safe boot");
        addSwitch(BlockerStore.KEY_BLOCK_ADD_USERS, "Block adding users");
        addSwitch(BlockerStore.KEY_BLOCK_UNKNOWN_SOURCES, "Block unknown sources");
        addSwitch(BlockerStore.KEY_BLOCK_WIFI_CONFIG, "Block Wi-Fi changes");
        addSwitch(BlockerStore.KEY_BLOCK_DATE_TIME, "Block date/time changes");
        addSwitch(BlockerStore.KEY_BLOCK_APPS_CONTROL, "Block app control");
        content.addView(button("Apply system policies", v -> applyPolicies()), matchWidth());
        content.addView(button("Clear baseline policies", v -> clearPolicies()), matchWidth());
    }

    private void renderKiosk() {
        addSectionHeader("Kiosk mode", "Lock the device to an allowed package.", () -> showKioskSettings());
        addReadonlyList("Allowed kiosk package", BlockerStore.get(this, BlockerStore.KEY_KIOSK_PACKAGE, getPackageName()));
        content.addView(button("Edit kiosk package", v -> editSingleLine("Kiosk package", BlockerStore.KEY_KIOSK_PACKAGE)), matchWidth());
        content.addView(button("Start lock task mode", v -> startManagedLockTask()), matchWidth());
        content.addView(button("Open app settings", v -> openAppSettings()), matchWidth());
    }

    private void renderReports() {
        addSectionHeader("Reports", "Local event log for policy actions.", () -> showReportsSettings());
        String reports = BlockerStore.get(this, BlockerStore.KEY_REPORTS, "");
        addReadonlyList("Events", reports.isEmpty() ? "No events yet." : reports);
        content.addView(button("Clear reports", v -> {
            BlockerStore.put(this, BlockerStore.KEY_REPORTS, "");
            renderActiveTab();
        }), matchWidth());
    }

    private void renderSettings() {
        addSectionHeader("All settings", "Central place for every blocker setting.", null);
        content.addView(button("Website blocking settings", v -> showSitesSettings()), matchWidth());
        content.addView(button("App blocking settings", v -> showAppsSettings()), matchWidth());
        content.addView(button("System restriction settings", v -> showSystemSettings()), matchWidth());
        content.addView(button("Kiosk settings", v -> showKioskSettings()), matchWidth());
        content.addView(button("Provisioning status", v -> showProvisioningHelp()), matchWidth());
        content.addView(button("Request device admin", v -> requestAdmin()), matchWidth());
        content.addView(button("Open Android app settings", v -> openAppSettings()), matchWidth());
    }

    private void addSectionHeader(String title, String subtitle, Runnable settingsAction) {
        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.HORIZONTAL);
        row.setGravity(Gravity.CENTER_VERTICAL);

        LinearLayout textWrap = new LinearLayout(this);
        textWrap.setOrientation(LinearLayout.VERTICAL);
        TextView titleView = new TextView(this);
        titleView.setText(title);
        titleView.setTextSize(20);
        titleView.setTypeface(Typeface.DEFAULT_BOLD);
        TextView subtitleView = new TextView(this);
        subtitleView.setText(subtitle);
        subtitleView.setTextSize(13);
        textWrap.addView(titleView);
        textWrap.addView(subtitleView);
        row.addView(textWrap, new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1));

        if (settingsAction != null) {
            Button settings = new Button(this);
            settings.setText("Settings");
            settings.setAllCaps(false);
            settings.setOnClickListener(v -> settingsAction.run());
            row.addView(settings);
        }

        content.addView(row, matchWidth());
    }

    private void addReadonlyList(String title, String value) {
        TextView label = new TextView(this);
        label.setText(title);
        label.setTypeface(Typeface.DEFAULT_BOLD);
        label.setPadding(0, 18, 0, 4);
        content.addView(label, matchWidth());

        TextView body = new TextView(this);
        body.setText(value == null || value.trim().isEmpty() ? "Empty" : value.trim());
        body.setTextSize(14);
        body.setPadding(18, 18, 18, 18);
        body.setBackgroundColor(0xFFEFF3F8);
        content.addView(body, matchWidth());
    }

    private TextView info(String text) {
        TextView view = new TextView(this);
        view.setText(text);
        view.setTextSize(13);
        view.setPadding(0, 18, 0, 18);
        return view;
    }

    private void addSwitch(String key, String label) {
        CheckBox box = new CheckBox(this);
        box.setText(label);
        box.setTextSize(16);
        box.setChecked(BlockerStore.getBoolean(this, key, true));
        box.setOnCheckedChangeListener((buttonView, isChecked) -> BlockerStore.putBoolean(this, key, isChecked));
        content.addView(box, matchWidth());
    }

    private Button button(String label, View.OnClickListener listener) {
        Button button = new Button(this);
        button.setText(label);
        button.setAllCaps(false);
        button.setOnClickListener(listener);
        return button;
    }

    private LinearLayout.LayoutParams matchWidth() {
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
        );
        params.setMargins(0, 8, 0, 8);
        return params;
    }

    private void editMultiline(String title, String key) {
        EditText input = new EditText(this);
        input.setMinLines(8);
        input.setGravity(Gravity.TOP);
        input.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_FLAG_MULTI_LINE);
        input.setText(BlockerStore.get(this, key, ""));
        showTextEditor(title, key, input);
    }

    private void editSingleLine(String title, String key) {
        EditText input = new EditText(this);
        input.setSingleLine(true);
        input.setText(BlockerStore.get(this, key, ""));
        showTextEditor(title, key, input);
    }

    private void showTextEditor(String title, String key, EditText input) {
        new AlertDialog.Builder(this)
                .setTitle(title)
                .setView(input)
                .setNegativeButton("Cancel", null)
                .setPositiveButton("Save", (dialog, which) -> {
                    BlockerStore.put(this, key, input.getText().toString().trim());
                    BlockerStore.log(this, "Updated " + title);
                    renderActiveTab();
                })
                .show();
    }

    private void showSitesSettings() {
        new AlertDialog.Builder(this)
                .setTitle("Website settings")
                .setMessage("Use one domain per line. The blocker should later connect this list to a local VPN or managed browser enforcement layer.")
                .setPositiveButton("OK", null)
                .show();
    }

    private void showAppsSettings() {
        new AlertDialog.Builder(this)
                .setTitle("App settings")
                .setMessage("Use Android package names, one per line. Example: com.android.chrome")
                .setPositiveButton("OK", null)
                .show();
    }

    private void showSystemSettings() {
        new AlertDialog.Builder(this)
                .setTitle("System settings")
                .setMessage("These switches are applied only after the app becomes Device Owner.")
                .setPositiveButton("OK", null)
                .show();
    }

    private void showKioskSettings() {
        new AlertDialog.Builder(this)
                .setTitle("Kiosk settings")
                .setMessage("The kiosk package is added to the lock task allowlist together with this controller app.")
                .setPositiveButton("OK", null)
                .show();
    }

    private void showReportsSettings() {
        new AlertDialog.Builder(this)
                .setTitle("Reports settings")
                .setMessage("This build stores a local policy event log. Network-block attempt logging should be added with the VPN enforcement layer.")
                .setPositiveButton("OK", null)
                .show();
    }

    private void showProvisioningHelp() {
        new AlertDialog.Builder(this)
                .setTitle("Provisioning")
                .setMessage("Device Owner requires a clean device with no accounts. Command: adb shell dpm set-device-owner com.ncrm.deviceowner/.DeviceOwnerReceiver")
                .setPositiveButton("OK", null)
                .show();
    }

    private void refreshStatus() {
        boolean isAdminActive = DevicePolicyController.isAdminActive(this);
        boolean isDeviceOwner = DevicePolicyController.isDeviceOwner(this);
        statusText.setText("Admin active: " + yesNo(isAdminActive) + " | Device owner: " + yesNo(isDeviceOwner));
    }

    private String yesNo(boolean value) {
        return value ? "yes" : "no";
    }

    private void requestAdmin() {
        Intent intent = new Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN);
        intent.putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, DevicePolicyController.adminComponent(this));
        intent.putExtra(DevicePolicyManager.EXTRA_ADD_EXPLANATION, "Required to manage this Android device.");
        startActivity(intent);
    }

    private void applyPolicies() {
        if (!DevicePolicyController.isDeviceOwner(this)) {
            toast("Device Owner mode is required.");
            return;
        }
        DevicePolicyController.applyBaselinePolicies(this);
        BlockerStore.log(this, "Applied system policies");
        refreshStatus();
        toast("Policies applied");
    }

    private void clearPolicies() {
        if (!DevicePolicyController.isDeviceOwner(this)) {
            toast("Device Owner mode is required.");
            return;
        }
        DevicePolicyController.clearBaselinePolicies(this);
        BlockerStore.log(this, "Cleared system policies");
        refreshStatus();
        toast("Policies cleared");
    }

    private void startManagedLockTask() {
        if (!DevicePolicyController.isDeviceOwner(this)) {
            toast("Device Owner mode is required.");
            return;
        }
        DevicePolicyController.applyBaselinePolicies(this);
        BlockerStore.log(this, "Started lock task mode");
        startLockTask();
    }

    private void openAppSettings() {
        Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
        intent.setData(Uri.parse("package:" + getPackageName()));
        startActivity(intent);
    }

    private void toast(String message) {
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show();
    }
}
