import os
import subprocess
import json
import shutil
import platform
import socket
from typing import List, Dict, Any, Optional
from app.schemas import NetworkInterfaceInfo
from app.core.config import settings

def find_tshark_executable() -> Optional[str]:
    """Finds TShark executable in PATH or standard installation directories."""
    # 1. Check PATH
    tshark_in_path = shutil.which("tshark")
    if tshark_in_path:
        return tshark_in_path

    # 2. Check standard Windows locations
    standard_paths = [
        settings.TSHARK_DEFAULT_PATH,
        r"C:\Program Files\Wireshark\tshark.exe",
        r"C:\Program Files (x86)\Wireshark\tshark.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\Programs\Wireshark\tshark.exe"),
    ]
    for p in standard_paths:
        if os.path.isfile(p):
            return p

    return None

def check_npcap_installed() -> bool:
    """Checks if Npcap driver is installed on Windows."""
    if platform.system() != "Windows":
        return True
    npcap_paths = [
        r"C:\Program Files\Npcap",
        r"C:\Windows\System32\Npcap",
        r"C:\Windows\SysWOW64\Npcap",
    ]
    for p in npcap_paths:
        if os.path.exists(p):
            return True
    return False

def get_tshark_interfaces() -> Dict[str, str]:
    """Returns a mapping of tshark interface index/id to description."""
    tshark_path = find_tshark_executable()
    if not tshark_path:
        return {}

    mapping = {}
    try:
        proc = subprocess.run(
            [tshark_path, "-D"],
            capture_output=True,
            text=True,
            timeout=5,
            creationflags=subprocess.CREATE_NO_WINDOW if platform.system() == "Windows" else 0
        )
        if proc.returncode == 0:
            for line in proc.stdout.strip().splitlines():
                # Line format: 1. \Device\NPF_{...} (Wi-Fi)
                parts = line.strip().split(". ", 1)
                if len(parts) == 2:
                    idx = parts[0].strip()
                    desc = parts[1].strip()
                    mapping[idx] = desc
    except Exception:
        pass
    return mapping

def discover_network_interfaces() -> List[NetworkInterfaceInfo]:
    """
    Discovers available network interfaces on the system with IP, MAC, status and capture capability.
    """
    interfaces: List[NetworkInterfaceInfo] = []
    tshark_map = get_tshark_interfaces()
    npcap_ok = check_npcap_installed()

    # Query PowerShell for accurate Windows network adapters if on Windows
    if platform.system() == "Windows":
        try:
            ps_cmd = (
                "Get-NetAdapter | Select-Object Name, InterfaceDescription, MacAddress, Status, InterfaceType, ifIndex | "
                "ConvertTo-Json -Compress"
            )
            result = subprocess.run(
                ["powershell", "-NoProfile", "-Command", ps_cmd],
                capture_output=True,
                text=True,
                timeout=8,
                creationflags=subprocess.CREATE_NO_WINDOW
            )
            if result.returncode == 0 and result.stdout.strip():
                try:
                    data = json.loads(result.stdout.strip())
                    adapters = [data] if isinstance(data, dict) else data
                    for adapter in adapters:
                        name = adapter.get("Name", "Unknown")
                        desc = adapter.get("InterfaceDescription", "")
                        mac = adapter.get("MacAddress", "N/A") or "N/A"
                        status_str = adapter.get("Status", "Up")
                        if_type = str(adapter.get("InterfaceType", "Ethernet"))
                        raw_if_index = adapter.get("ifIndex", "")
                        if_index = int(raw_if_index) if str(raw_if_index).isdigit() else None

                        # Find matching tshark index if available
                        tshark_target_id = str(if_index) if if_index is not None else ""
                        for t_id, t_desc in tshark_map.items():
                            if name.lower() in t_desc.lower() or desc.lower() in t_desc.lower():
                                tshark_target_id = t_id
                                break

                        # Get IP addresses for this adapter
                        ipv4_list = []
                        ipv6_list = []
                        if if_index is not None:
                            try:
                                ip_cmd = f"Get-NetIPAddress -InterfaceIndex {if_index} | Select-Object IPAddress, AddressFamily | ConvertTo-Json -Compress"
                                ip_res = subprocess.run(
                                    ["powershell", "-NoProfile", "-Command", ip_cmd],
                                    capture_output=True,
                                    text=True,
                                    timeout=5,
                                    creationflags=subprocess.CREATE_NO_WINDOW
                                )
                                if ip_res.returncode == 0 and ip_res.stdout.strip():
                                    ip_data = json.loads(ip_res.stdout.strip())
                                    ip_list = [ip_data] if isinstance(ip_data, dict) else ip_data
                                    for item in ip_list:
                                        ip_addr = item.get("IPAddress", "")
                                        fam = item.get("AddressFamily", "")
                                        if fam == "IPv4" or ":" not in ip_addr:
                                            if ip_addr and not ip_addr.startswith("169.254"):
                                                ipv4_list.append(ip_addr)
                                        else:
                                            if ip_addr and not ip_addr.startswith("fe80"):
                                                ipv6_list.append(ip_addr)
                            except Exception:
                                pass

                        is_up = (status_str.lower() == "up")
                        is_eligible = npcap_ok and is_up
                        perm = (
                            "Capture permission not verified (Npcap detected)"
                            if npcap_ok else "Requires Npcap Driver"
                        )

                        interfaces.append(NetworkInterfaceInfo(
                            id=tshark_target_id or name,
                            name=name,
                            description=desc,
                            ipv4_addresses=ipv4_list,
                            ipv6_addresses=ipv6_list,
                            mac_address=mac,
                            interface_type=if_type,
                            is_up=is_up,
                            is_loopback=("loopback" in name.lower() or "loopback" in desc.lower()),
                            is_eligible=is_eligible,
                            permission_status=perm
                        ))
                except Exception:
                    pass
        except Exception:
            pass

    # Fallback if PowerShell failed or on non-Windows
    if not interfaces:
        try:
            from scapy.all import get_if_list
            scapy_ifs = get_if_list()
            for idx, iface_name in enumerate(scapy_ifs):
                interfaces.append(NetworkInterfaceInfo(
                    id=str(idx + 1),
                    name=iface_name,
                    description=f"Interface {iface_name}",
                    ipv4_addresses=["127.0.0.1"] if "lo" in iface_name else [],
                    ipv6_addresses=["::1"] if "lo" in iface_name else [],
                    mac_address="00:00:00:00:00:00",
                    interface_type="Ethernet",
                    is_up=True,
                    is_loopback="lo" in iface_name.lower(),
                    is_eligible=True,
                    permission_status="Capture permission not verified"
                ))
        except Exception:
            # Default Loopback / Virtual interface for lab testing
            interfaces.append(NetworkInterfaceInfo(
                id="1",
                name="Software Loopback Interface 1",
                description="Simulated & Local Loopback Adapter",
                ipv4_addresses=["127.0.0.1"],
                ipv6_addresses=["::1"],
                mac_address="00:00:00:00:00:00",
                interface_type="Loopback",
                is_up=True,
                is_loopback=True,
                is_eligible=True,
                permission_status="Capture permission not verified"
            ))

    return interfaces
