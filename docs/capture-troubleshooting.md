# Capture Troubleshooting & Windows Npcap Guide

## Diagnostics Checklist

If live packet capture does not immediately display incoming packets, verify the following pipeline components:

### 1. Network Interface Selection
- Open the **Network Interfaces** page in the application.
- Verify that your active network adapter (e.g., `Wi-Fi` or `Ethernet`) is selected.
- Inactive virtual adapters (e.g. disconnected VPNs) will yield zero packets.

### 2. Windows Npcap Driver
- Windows requires the Npcap packet capture library to bind to physical network interfaces.
- Check if Npcap is detected on the **Diagnostics** page.
- If missing, download and install Npcap from `https://npcap.com/` (or check "Install Npcap" during Wireshark installation).
- Ensure "WinPcap API-compatible Mode" is selected during Npcap installation.

### 3. Wireshark / TShark Binary Path
- The system searches `PATH` and standard Windows Wireshark installation locations, including `C:\Program Files\Wireshark\tshark.exe`.
- `TSHARK_PATH` in `.env` and the Settings page are not currently supported for configuring the executable. Add TShark to `PATH` or install it in a searched location.

### 4. Admin Privileges
- Raw interface sniffing on Windows requires administrative privileges unless Npcap was installed with the option "Restrict Npcap driver's access to Administrators only" disabled.
- If permission denied errors occur, launch your terminal as Administrator.

### 5. Fallback Modes
- If live capture is unavailable or not appropriate:
  - Use **SIMULATED_TEST** mode to generate demo traffic.
  - Run an explicit **CONTROLLED_LAB** scenario to send synthetic packets through detection and policy; this does not contact lab endpoints.
  - Use **OFFLINE_REPLAY** mode to upload and analyze `.pcap`, `.pcapng`, or `.cap` files (up to 50 MB).
  - Npcap detection and interface eligibility are not proof of capture permission. The application reports capture failure if startup fails.

## Safety and Data

- Live capture reads traffic visible on the selected interface. Choose a controlled interface and an appropriate capture filter; avoid capturing unrelated user traffic.
- Response and self-healing actions are simulated local-state changes. Network enforcement is not implemented.
- Run `python run_tests.py` from `backend/` to keep automated test records out of the persistent application database.
