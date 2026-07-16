# Android Site Blocker Device Owner App

This is a small Android Device Policy Controller (DPC) for a managed site
blocker app.

## What it does

- Registers `com.ncrm.deviceowner/.DeviceOwnerReceiver` as the admin component.
- Detects Device Owner status.
- Organizes blocker settings by topic: Sites, Apps, System, Kiosk, Reports, and Settings.
- Stores blocked/allowed site lists locally.
- Stores blocked app package lists locally.
- Applies configurable Android restrictions through `DevicePolicyManager`.
- Allowlists the controller and selected kiosk package for lock task mode.

Domain-level enforcement still needs one extra layer: either a local VPN service
that filters DNS/traffic, or a managed browser that reads the blocked-site list.
The current build prepares the management UI and Device Owner policy foundation.

## Build

From this folder:

```powershell
.\scripts\build-debug.ps1
```

If PowerShell is unavailable, use:

```bat
scripts\build-debug.bat
```

The debug APK is written to:

```text
app\build\outputs\apk\debug\app-debug.apk
```

## Provision a test device

Device Owner provisioning normally requires a reset device with no accounts.
Connect the device with USB debugging enabled, then run:

```powershell
.\scripts\install-and-provision.ps1
```

If PowerShell is unavailable, use:

```bat
scripts\install-and-provision.bat
```

The underlying ADB command is:

```bash
adb shell dpm set-device-owner com.ncrm.deviceowner/.DeviceOwnerReceiver
```

If provisioning fails because accounts already exist on the device, factory
reset the test device and run the script before adding any accounts.

## Settings structure

- Sites: blocked domains, allowed domains, and website filtering notes.
- Apps: blocked browser/app package list.
- System: official Android restrictions controlled by switches.
- Kiosk: lock task allowlist package.
- Reports: local policy event log.
- Settings: central index that opens every settings group.

## Baseline policies

The app can apply these restrictions:

- `DISALLOW_FACTORY_RESET`
- `DISALLOW_SAFE_BOOT`
- `DISALLOW_ADD_USER`
- `DISALLOW_REMOVE_USER`
- `DISALLOW_INSTALL_UNKNOWN_SOURCES`
- `DISALLOW_CONFIG_DATE_TIME`
- `DISALLOW_CONFIG_WIFI`
- `DISALLOW_APPS_CONTROL`
- `DISALLOW_MOUNT_PHYSICAL_MEDIA`

It also disables the camera, disables the status bar, and allowlists the app for
lock task mode. Use the app's "Clear baseline policies" button before changing
or removing management during testing.
