import os
import subprocess
import threading
import time
import logging
from typing import Callable, Optional, Dict, Any
from app.capture.interface_manager import find_tshark_executable

logger = logging.getLogger("tshark_engine")

class TSharkCaptureEngine:
    def __init__(
        self,
        interface: str,
        packet_callback: Callable[[Dict[str, Any]], None],
        bpf_filter: str = ""
    ):
        self.interface = interface
        self.packet_callback = packet_callback
        self.bpf_filter = bpf_filter
        self.process: Optional[subprocess.Popen] = None
        self.is_running = False
        self.thread: Optional[threading.Thread] = None
        self.error_message: Optional[str] = None
        self.packets_captured = 0

    def start(self) -> bool:
        tshark_bin = find_tshark_executable()
        if not tshark_bin:
            self.error_message = "TShark executable was not found on the system."
            logger.error(self.error_message)
            return False

        # TShark fields extraction command
        cmd = [
            tshark_bin,
            "-i", str(self.interface),
            "-l",  # Flush standard output for each packet
            "-n",  # Do not resolve IP addresses to hostnames
            "-T", "fields",
            "-E", "separator=/t",
            "-E", "occurrence=f",
            "-e", "frame.time_epoch",
            "-e", "ip.src",
            "-e", "ip.dst",
            "-e", "ipv6.src",
            "-e", "ipv6.dst",
            "-e", "eth.src",
            "-e", "eth.dst",
            "-e", "_ws.col.Protocol",
            "-e", "tcp.srcport",
            "-e", "tcp.dstport",
            "-e", "udp.srcport",
            "-e", "udp.dstport",
            "-e", "frame.len",
            "-e", "tcp.flags",
            "-e", "dns.qry.name",
            "-e", "dns.a",
            "-e", "arp.opcode",
            "-e", "arp.src.hw_mac",
            "-e", "arp.src.proto_ipv4",
            "-e", "arp.dst.hw_mac",
            "-e", "arp.dst.proto_ipv4",
            "-e", "ip.ttl"
        ]

        if self.bpf_filter and self.bpf_filter.strip():
            cmd.extend(["-f", self.bpf_filter.strip()])

        try:
            creation_flags = subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0
            self.process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.DEVNULL,
                text=True,
                bufsize=1,
                creationflags=creation_flags
            )
            exit_code = self.process.poll()
            if exit_code is not None:
                self.error_message = (
                    f"TShark exited during startup with code {exit_code}."
                )
                logger.error(self.error_message)
                self.process = None
                return False
            self.is_running = True
            self.thread = threading.Thread(target=self._read_stream, daemon=True)
            self.thread.start()
            return True
        except Exception as e:
            self.error_message = f"Failed to start TShark subprocess: {str(e)}"
            logger.error(self.error_message)
            self.is_running = False
            return False

    def _read_stream(self):
        if not self.process or not self.process.stdout:
            return

        try:
            for line in iter(self.process.stdout.readline, ""):
                if not self.is_running:
                    break
                line = line.strip("\r\n")
                if not line:
                    continue

                parts = line.split("\t")
                # Pad to expected field length
                while len(parts) < 22:
                    parts.append("")

                (
                    epoch_str, ip_src, ip_dst, ipv6_src, ipv6_dst,
                    eth_src, eth_dst, proto, tcp_sport, tcp_dport,
                    udp_sport, udp_dport, flen, tcp_flags,
                    dns_qry, dns_a, arp_op, arp_smac, arp_sip,
                    arp_tmac, arp_tip, ttl_str
                ) = (parts + [""] * 22)[:22]

                # Resolve actual source and destination IPs
                src_ip = ip_src or ipv6_src or arp_sip or "N/A"
                dst_ip = ip_dst or ipv6_dst or arp_tip or "N/A"
                src_mac = eth_src or arp_smac or "N/A"
                dst_mac = eth_dst or arp_tmac or "N/A"

                src_port = tcp_sport or udp_sport
                dst_port = tcp_dport or udp_dport

                try:
                    ts = float(epoch_str) if epoch_str else time.time()
                except ValueError:
                    ts = time.time()

                try:
                    pkt_len = int(flen) if flen else 64
                except ValueError:
                    pkt_len = 64

                try:
                    ttl_val = int(ttl_str) if ttl_str else None
                except ValueError:
                    ttl_val = None

                raw_pkt = {
                    "timestamp": ts,
                    "src_ip": src_ip,
                    "dst_ip": dst_ip,
                    "src_mac": src_mac,
                    "dst_mac": dst_mac,
                    "protocol": proto or "IP",
                    "src_port": src_port if src_port else None,
                    "dst_port": dst_port if dst_port else None,
                    "length": pkt_len,
                    "tcp_flags": tcp_flags or None,
                    "dns_query": dns_qry or None,
                    "dns_reply": dns_a or None,
                    "arp_opcode": arp_op or None,
                    "arp_sender_mac": arp_smac or None,
                    "arp_sender_ip": arp_sip or None,
                    "arp_target_mac": arp_tmac or None,
                    "arp_target_ip": arp_tip or None,
                    "ttl": ttl_val
                }

                self.packets_captured += 1
                try:
                    self.packet_callback(raw_pkt)
                except Exception as cb_err:
                    logger.debug(f"Callback error: {cb_err}")

        except Exception as e:
            if self.is_running:
                self.error_message = f"Stream reading error: {str(e)}"
                logger.error(self.error_message)
        finally:
            self.stop()

    def stop(self):
        self.is_running = False
        if self.process:
            try:
                self.process.terminate()
                self.process.wait(timeout=2)
            except Exception:
                try:
                    self.process.kill()
                except Exception:
                    pass
            self.process = None
