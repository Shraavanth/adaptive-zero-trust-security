# Security & Isolation Controls

## Zero Trust Security Controls

### 1. Passive Sniffing vs Active Enforcement
- **Passive Sniffing**: Live packet capture only reads traffic visible to the selected interface.
- **Safety by Default**: Simulated isolation (`SIMULATED`) is enforced by default. Physical firewall rule modifications or network null-routing are never performed unless explicitly authorized in `AUTHORIZED_LAB` mode.

### 2. Privacy & Data Masking
- The application enables default IP and MAC masking in shared SOC environments.
- Operators can toggle masking on or off via the Live Packet Monitor interface.

### 3. Subprocess Safety
- TShark and PowerShell commands utilize parameterized argument arrays without shell interpolation.
- Arbitrary command execution from user input is strictly prohibited.

### 4. Untrusted Input Handling
- Captured packets and uploaded PCAP files are treated as untrusted network inputs.
- All field extraction routines enforce bounds-checking, type conversions, and sanitized fallbacks (`N/A`).
