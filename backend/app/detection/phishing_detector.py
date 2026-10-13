import re
import math
from typing import Optional, Dict, Any

SUSPICIOUS_TLDS = {".xyz", ".top", ".tk", ".ml", ".ga", ".cf", ".gq", ".buzz", ".cam", ".bid", ".loan"}
CREDENTIAL_KEYWORDS = {"login", "verify", "secure", "account", "bank", "update", "signin", "wallet", "portal", "support", "auth"}
KNOWN_BRANDS = ["paypal", "google", "microsoft", "apple", "amazon", "netflix", "chase", "bankofamerica", "wellsfargo"]
KNOWN_BLOCKLIST = {
    "malicious-phish-portal.xyz",
    "paypa1-secure-login.com",
    "account-verification-support.top",
    "micros0ft-azure-portal.net",
    "secure-login-bank-id.xyz",
    "apple-id-verify-alert.com"
}

def calculate_entropy(text: str) -> float:
    """Calculates Shannon entropy of domain label to catch DGA/obfuscated strings."""
    if not text:
        return 0.0
    prob = [float(text.count(c)) / len(text) for c in dict.fromkeys(list(text))]
    return -sum([p * math.log(p) / math.log(2.0) for p in prob])

def check_phishing(domain: Optional[str], raw_packet: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Evaluates DNS queries or HTTP hostnames for phishing and lookalike domains.
    Returns detection dictionary if suspicious, otherwise None.
    """
    if not domain or domain == "N/A":
        return None

    clean_domain = domain.lower().strip(".")

    # 1. Direct blocklist hit
    if clean_domain in KNOWN_BLOCKLIST:
        return {
            "category": "PHISHING",
            "severity": "CRITICAL",
            "confidence": 0.99,
            "rule_id": "PHISH-RULE-001-BLOCKLIST",
            "domain": clean_domain,
            "detection_reason": f"Exact match against verified malicious phishing threat intelligence blocklist: {clean_domain}",
            "evidence": f"Domain {clean_domain} observed in network traffic matching active threat database.",
            "risk_score": 90,
            "recommended_response": "ISOLATE"
        }

    # 2. Punycode detection (IDN Homograph attack, e.g. xn--...)
    if "xn--" in clean_domain:
        return {
            "category": "PHISHING",
            "severity": "HIGH",
            "confidence": 0.90,
            "rule_id": "PHISH-RULE-002-PUNYCODE",
            "domain": clean_domain,
            "detection_reason": f"Punycode homograph domain detected ({clean_domain}). Common vector for impersonation.",
            "evidence": f"DNS query contains internationalized punycode prefix indicating visual spoofing.",
            "risk_score": 75,
            "recommended_response": "RESTRICT"
        }

    # 3. Lookalike brand typo-squatting (e.g. paypa1, micros0ft, goog1e)
    for brand in KNOWN_BRANDS:
        # Check leetspeak substitutions
        leetspeak_pattern = brand.replace("o", "[o0]").replace("l", "[l1|]").replace("i", "[i1!]")
        if re.search(leetspeak_pattern, clean_domain) and brand not in clean_domain:
            return {
                "category": "PHISHING",
                "severity": "HIGH",
                "confidence": 0.92,
                "rule_id": "PHISH-RULE-003-TYPOSQUAT",
                "domain": clean_domain,
                "detection_reason": f"Typosquatting/lookalike domain targeting brand '{brand}' ({clean_domain}).",
                "evidence": f"Pattern analysis confirmed character substitution mimicking recognized brand '{brand}'.",
                "risk_score": 80,
                "recommended_response": "RESTRICT"
            }

    # 4. Credential keywords paired with suspicious TLDs
    has_keyword = any(kw in clean_domain for kw in CREDENTIAL_KEYWORDS)
    has_suspicious_tld = any(clean_domain.endswith(tld) for tld in SUSPICIOUS_TLDS)
    if has_keyword and has_suspicious_tld:
        return {
            "category": "PHISHING",
            "severity": "HIGH",
            "confidence": 0.88,
            "rule_id": "PHISH-RULE-004-TLD-KEYWORD",
            "domain": clean_domain,
            "detection_reason": f"High-risk credential keyword combined with low-reputation top-level domain ({clean_domain}).",
            "evidence": f"Domain combines credential harvesting keywords with suspicious TLD registry.",
            "risk_score": 70,
            "recommended_response": "RESTRICT"
        }

    # 5. High entropy & excessive subdomains
    labels = clean_domain.split(".")
    if len(labels) >= 4:
        entropy = calculate_entropy(labels[0])
        if entropy > 3.8:
            return {
                "category": "PHISHING",
                "severity": "MEDIUM",
                "confidence": 0.75,
                "rule_id": "PHISH-RULE-005-DGA-ENTROPY",
                "domain": clean_domain,
                "detection_reason": f"Domain generation algorithm (DGA) pattern: high Shannon entropy ({entropy:.2f}) and excessive depth.",
                "evidence": f"Label '{labels[0]}' exhibited random character distribution characteristic of algorithmic command-and-control.",
                "risk_score": 60,
                "recommended_response": "MONITOR"
            }

    return None
