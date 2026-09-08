"""
AirMouse Cloud - Windows Receiver Configuration & Loader
Loads configuration from environment variables, .env, or config.json.
Validates the WebSocket URL to ensure reliable connection.
"""
import os
import sys
import json
import re
from urllib.parse import urlparse

def _get_base_dirs():
    """Returns candidate directories where config files might live."""
    dirs = []
    # If compiled with PyInstaller
    if getattr(sys, 'frozen', False):
        dirs.append(os.path.dirname(sys.executable))
    # Script directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    dirs.append(script_dir)
    # Current working directory
    cwd = os.getcwd()
    if cwd not in dirs:
        dirs.append(cwd)
    # Parent directory
    parent = os.path.dirname(script_dir)
    if parent not in dirs:
        dirs.append(parent)
    return dirs

def _load_env_file(filepath):
    """Simple parser for .env files without requiring third-party dotenv library."""
    if not os.path.isfile(filepath):
        return {}
    env_vars = {}
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#') or '=' not in line:
                    continue
                key, val = line.split('=', 1)
                key = key.strip()
                val = val.strip().strip('"').strip("'")
                if key:
                    env_vars[key] = val
    except Exception:
        pass
    return env_vars

def _load_json_file(filepath):
    """Loads a JSON configuration file if available."""
    if not os.path.isfile(filepath):
        return {}
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return {}

def validate_ws_url(url: str) -> tuple[bool, str]:
    """
    Validates that a URL is a valid WebSocket URL.
    Returns (True, '') or (False, error_message).
    """
    if not url or not isinstance(url, str):
        return False, "WebSocket URL is empty or missing."

    url = url.strip()
    if not (url.startswith("ws://") or url.startswith("wss://")):
        return False, f"Invalid protocol in URL '{url}'. WebSocket URLs must start with 'ws://' or 'wss://'."

    try:
        parsed = urlparse(url)
        if not parsed.hostname:
            return False, f"Invalid hostname in WebSocket URL: '{url}'."
    except Exception as e:
        return False, f"Malformed WebSocket URL '{url}': {e}"

    return True, ""

# Gather potential sources
_base_dirs = _get_base_dirs()
_loaded_env = {}
_loaded_json = {}

for d in _base_dirs:
    # Try .env
    env_path = os.path.join(d, '.env')
    if os.path.isfile(env_path) and not _loaded_env:
        _loaded_env = _load_env_file(env_path)
    # Try receiver/.env if in parent
    rec_env_path = os.path.join(d, 'receiver', '.env')
    if os.path.isfile(rec_env_path) and not _loaded_env:
        _loaded_env = _load_env_file(rec_env_path)

    # Try config.json
    json_path = os.path.join(d, 'config.json')
    if os.path.isfile(json_path) and not _loaded_json:
        _loaded_json = _load_json_file(json_path)
    rec_json_path = os.path.join(d, 'receiver', 'config.json')
    if os.path.isfile(rec_json_path) and not _loaded_json:
        _loaded_json = _load_json_file(rec_json_path)

# Resolve CLOUD_WS_URL priority:
# 1. Direct OS Environment variables
# 2. .env file
# 3. config.json
# 4. Default fallback: ws://localhost:5000
DEFAULT_SERVER_URL = (
    os.environ.get("CLOUD_WS_URL")
    or os.environ.get("AIRMOUSE_SERVER_URL")
    or os.environ.get("PUBLIC_WS_URL")
    or _loaded_env.get("CLOUD_WS_URL")
    or _loaded_env.get("AIRMOUSE_SERVER_URL")
    or _loaded_json.get("cloudWsUrl")
    or "ws://localhost:5000"
)

# Reconnection & timeout settings
RECONNECT_DELAY_SECONDS = int(_loaded_json.get("reconnectDelaySeconds", 3))
MAX_RECONNECT_ATTEMPTS = int(_loaded_json.get("maxReconnectAttempts", 100))

# PyAutoGUI settings
PYAUTOGUI_PAUSE = 0.0
PYAUTOGUI_FAILSAFE = False

# Mouse movement clamping limits
MAX_DELTA = int(_loaded_json.get("maxDelta", 300))
MAX_SCROLL = int(_loaded_json.get("maxScroll", 100))
