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
- The system automatically detects TShark at `C:\Program Files\Wireshark\tshark.exe`.
- If installed in a non-standard location, set the `TSHARK_PATH` variable in `backend/.env` or adjust via the Settings page.

### 4. Admin Privileges
- Raw interface sniffing on Windows requires administrative privileges unless Npcap was installed with the option "Restrict Npcap driver's access to Administrators only" disabled.
- If permission denied errors occur, launch your terminal as Administrator.

### 5. Fallback Modes
- If physical capture is unavailable on your current system:
  - Use **SIMULATED_TEST** mode in the top bar to synthesize enterprise traffic and attack vectors.
  - Use **CONTROLLED_LAB** mode to execute deterministic test scenarios.
  - Use **OFFLINE_REPLAY** mode to upload and analyze `.pcap` or `.pcapng` trace files.
