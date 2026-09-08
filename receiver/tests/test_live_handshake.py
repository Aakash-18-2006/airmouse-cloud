"""
End-to-end live handshake verification between Server and Receiver.
"""
import subprocess
import time
import socket
import json
import websocket
import sys

def test_live_handshake():
    print("Testing live handshake between Cloud Server and WebSocket client...")

    # Start server in subprocess
    server_proc = subprocess.Popen(
        ["node", "server/dist/index.js"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )

    try:
        # Wait for server to bind
        time.sleep(1.5)

        ws_url = "ws://localhost:5000"
        ws = websocket.create_connection(ws_url, timeout=5)

        # Send register receiver
        ws.send(json.dumps({
            "type": "register_receiver",
            "hostname": "Live-Verification-PC"
        }))

        # Read response
        response_raw = ws.recv()
        data = json.loads(response_raw)

        assert data.get("type") == "pairing_code", f"Expected pairing_code, got {data}"
        code = data.get("code")
        assert code and len(code) == 6 and code.isdigit(), f"Invalid code format: {code}"

        print(f"Verified live server assigned 6-digit pairing code: {code}")

        # Now simulate phone client connecting with this code
        phone_ws = websocket.create_connection(ws_url, timeout=5)
        phone_ws.send(json.dumps({
            "type": "pair_with_code",
            "code": code
        }))

        phone_resp = json.loads(phone_ws.recv())
        assert phone_resp.get("type") == "pairing_success", f"Expected pairing_success, got {phone_resp}"
        session_token = phone_resp.get("sessionToken")
        assert session_token, "Expected session token"
        print(f"Verified phone successfully paired and received session token.")

        # Phone sends a move command
        phone_ws.send(json.dumps({
            "type": "mouse_event",
            "sessionToken": session_token,
            "payload": {
                "type": "move",
                "dx": 15,
                "dy": -10
            }
        }))

        # Receiver should receive mouse_relay
        receiver_msg = json.loads(ws.recv()) # first msg might be pairing_success notification
        if receiver_msg.get("type") == "pairing_success":
            receiver_msg = json.loads(ws.recv())

        assert receiver_msg.get("type") == "mouse_relay", f"Expected mouse_relay, got {receiver_msg}"
        assert receiver_msg.get("payload", {}).get("dx") == 15
        assert receiver_msg.get("payload", {}).get("dy") == -10
        print(f"Verified real-time command relay from Phone to Receiver successfully delivered!")

        ws.close()
        phone_ws.close()
        print("Live End-to-End Handshake Passed Successfully!")
        return True

    finally:
        server_proc.terminate()
        try:
            server_proc.wait(timeout=2)
        except Exception:
            server_proc.kill()

if __name__ == "__main__":
    if not test_live_handshake():
        sys.exit(1)
