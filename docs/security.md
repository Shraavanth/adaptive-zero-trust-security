# Security & Isolation Controls

## Zero Trust Security Controls

### 1. Passive Sniffing vs Active Enforcement
- **Passive Sniffing**: Live packet capture only reads traffic visible to the selected interface.
- **Safety by Default**: Response actions and recovery update local records in `SIMULATED` mode only. They do not modify firewall rules, null-route traffic, or verify host connectivity. `AUTHORIZED_LAB` enforcement is not implemented and is rejected; continuous lab capture is unavailable until lab endpoints are configured.
- **Status Accuracy**: Simulated response records use `SIMULATED` status and are not marked verified. Seeded honeypot entries are records only; the application does not start HTTP, SSH, DNS, or Telnet listeners.
- **Response Preview**: `/api/response/preview` reads current local records and does not persist or enforce an action. Any inverse operation is advisory, not a transactional rollback or a guarantee that external network state can be restored.
- **PCAP Uploads**: Uploads are limited to 50 MB, use server-generated temporary paths, and are removed after replay. Packet data is persisted through the offline replay pipeline.

### 2. Privacy & Data Masking
- The Live Packet Monitor enables IP and MAC masking by default. Operators can toggle it in that view.
- Masking is a presentation preference for the Live Packet Monitor only. Other pages, API responses, and packet exports can contain raw identifiers.
- The API currently has no authentication or authorization. It binds to localhost by default; do not expose it to untrusted networks. CORS origin restrictions are not an authorization control.

### 3. Subprocess Safety
- TShark and PowerShell commands utilize parameterized argument arrays without shell interpolation.
- Arbitrary command execution from user input is strictly prohibited.

### 4. Untrusted Input Handling
- Captured packets and uploaded PCAP files are treated as untrusted network inputs.
- Scenario target addresses are validated as IPv4 or IPv6. PCAP packet count is bounded during replay; packet parsing errors are reported and the session is marked failed.
- Replay failure details are recorded in server logs rather than returned to the client, to avoid disclosing local paths or parser internals.
