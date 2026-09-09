"""
Unit tests for AirMouse Receiver command protocol, PIN generation, and safety logic.
"""
import unittest
from unittest.mock import patch, MagicMock
import sys
import os

# Add receiver directory to python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from receiver import AirMouseReceiver
from config import validate_ws_url

class TestAirMouseReceiverProtocol(unittest.TestCase):

    def setUp(self):
        self.receiver = AirMouseReceiver(server_url="ws://localhost:5000", enable_gui=False)
        self.receiver.control_enabled = True

    def test_pin_generation(self):
        """Verify PIN generation produces a secure, 6-digit numeric string."""
        for _ in range(50):
            pin = self.receiver.generate_secure_pin()
            self.assertEqual(len(pin), 6)
            self.assertTrue(pin.isdigit())
            val = int(pin)
            self.assertGreaterEqual(val, 100000)
            self.assertLessEqual(val, 999999)

    def test_ws_url_validation(self):
        """Test URL validator with various valid and invalid URLs."""
        valid_urls = [
            "ws://localhost:5000",
            "ws://127.0.0.1:8080",
            "wss://airmouse-cloud.onrender.com",
            "wss://airmouse.example.com/ws",
        ]
        for url in valid_urls:
            is_valid, err = validate_ws_url(url)
            self.assertTrue(is_valid, f"Expected '{url}' to be valid, got: {err}")

        invalid_urls = [
            "",
            None,
            "http://localhost:5000",
            "https://airmouse.example.com",
            "ftp://localhost",
            "not-a-url",
            "ws://",
        ]
        for url in invalid_urls:
            is_valid, err = validate_ws_url(url)
            self.assertFalse(is_valid, f"Expected '{url}' to be invalid")

    @patch('pyautogui.moveRel')
    def test_move_command_normal(self, mock_move):
        payload = {"type": "move", "dx": 25, "dy": -15}
        self.receiver.handle_command(payload)
        mock_move.assert_called_once_with(25, -15, _pause=False)

    @patch('pyautogui.moveRel')
    def test_move_command_case_insensitive(self, mock_move):
        payload = {"type": "MOVE", "dx": 10, "dy": 20}
        self.receiver.handle_command(payload)
        mock_move.assert_called_once_with(10, 20, _pause=False)

    @patch('pyautogui.moveRel')
    def test_move_command_clamped(self, mock_move):
        payload = {"type": "move", "dx": 9999, "dy": -8888}
        self.receiver.handle_command(payload)
        # Should be clamped to [-300, 300]
        mock_move.assert_called_once_with(300, -300, _pause=False)

    @patch('pyautogui.click')
    def test_left_click_command(self, mock_click):
        payload = {"type": "left_click"}
        self.receiver.handle_command(payload)
        mock_click.assert_called_once_with(button="left", _pause=False)

    @patch('pyautogui.click')
    def test_right_click_command(self, mock_click):
        payload = {"type": "right_click"}
        self.receiver.handle_command(payload)
        mock_click.assert_called_once_with(button="right", _pause=False)

    @patch('pyautogui.doubleClick')
    def test_double_click_command(self, mock_double_click):
        payload = {"type": "double_click"}
        self.receiver.handle_command(payload)
        mock_double_click.assert_called_once_with(_pause=False)

    @patch('pyautogui.scroll')
    def test_scroll_command(self, mock_scroll):
        payload = {"type": "scroll", "amount": 10}
        self.receiver.handle_command(payload)
        mock_scroll.assert_called_once_with(10, _pause=False)

    @patch('pyautogui.scroll')
    def test_scroll_clamped(self, mock_scroll):
        payload = {"type": "scroll", "amount": 9999}
        self.receiver.handle_command(payload)
        mock_scroll.assert_called_once_with(100, _pause=False)

    @patch('pyautogui.mouseDown')
    def test_drag_start_command(self, mock_down):
        payload = {"type": "drag_start"}
        self.receiver.handle_command(payload)
        mock_down.assert_called_once_with(button="left", _pause=False)

    @patch('pyautogui.moveRel')
    def test_drag_move_command(self, mock_move):
        payload = {"type": "drag_move", "dx": 40, "dy": -30}
        self.receiver.handle_command(payload)
        mock_move.assert_called_once_with(40, -30, _pause=False)

    @patch('pyautogui.mouseUp')
    def test_drag_end_command(self, mock_up):
        payload = {"type": "drag_end"}
        self.receiver.handle_command(payload)
        mock_up.assert_called_once_with(button="left", _pause=False)

    @patch('pyautogui.mouseUp')
    def test_emergency_stop_disables_control(self, mock_mouseup):
        self.assertTrue(self.receiver.control_enabled)
        self.receiver.emergency_stop()
        self.assertFalse(self.receiver.control_enabled)
        self.assertFalse(self.receiver.phone_connected)
        # Verify safety release of both buttons
        self.assertTrue(mock_mouseup.called)

    @patch('pyautogui.mouseUp')
    def test_peer_disconnect_stops_control(self, mock_mouseup):
        self.receiver.phone_connected = True
        self.receiver.control_enabled = True
        # Simulate receiving peer_disconnected
        self.receiver.on_message(None, '{"type": "peer_disconnected"}')
        self.assertFalse(self.receiver.phone_connected)
        self.assertFalse(self.receiver.control_enabled)
        self.assertTrue(mock_mouseup.called)

    @patch('pyautogui.moveRel')
    def test_invalid_command_rejected_safely(self, mock_move):
        # Malformed or unrecognized commands should not crash or execute move
        self.receiver.handle_command({"type": "format_c_drive"})
        self.receiver.handle_command({"type": "malicious_script", "payload": "rm -rf"})
        self.receiver.handle_command({})
        mock_move.assert_not_called()

    @patch('pyautogui.moveRel')
    def test_ignores_commands_when_control_disabled(self, mock_move):
        self.receiver.control_enabled = False
        payload = {"type": "move", "dx": 50, "dy": 50}
        self.receiver.handle_command(payload)
        mock_move.assert_not_called()

    @patch('pyautogui.press')
    def test_keyboard_key_press_valid(self, mock_press):
        test_keys = ['enter', 'backspace', 'space', 'tab', 'esc', 'up', 'down', 'left', 'right',
                     'delete', 'home', 'end', 'pageup', 'pagedown', 'a', 'z', '0', '9']
        for k in test_keys:
            self.receiver.handle_keyboard_command({"action": "key_press", "key": k})
            mock_press.assert_called_with(k, _pause=False)

    @patch('pyautogui.press')
    def test_keyboard_key_press_escape_alias(self, mock_press):
        self.receiver.handle_keyboard_command({"action": "key_press", "key": "escape"})
        mock_press.assert_called_with("esc", _pause=False)

    @patch('pyautogui.hotkey')
    def test_keyboard_hotkey(self, mock_hotkey):
        self.receiver.handle_keyboard_command({
            "action": "hotkey",
            "modifiers": ["ctrl"],
            "key": "c"
        })
        mock_hotkey.assert_called_once_with("ctrl", "c", _pause=False)

    @patch('pyautogui.write')
    def test_keyboard_type_text(self, mock_write):
        self.receiver.handle_keyboard_command({
            "action": "type_text",
            "text": "Hello World 123!\x00\x07"
        })
        # Verifies control characters \x00 and \x07 are stripped
        mock_write.assert_called_once_with("Hello World 123!", interval=0.005)

    @patch('pyautogui.keyDown')
    @patch('pyautogui.keyUp')
    def test_keyboard_key_down_up_and_emergency_release(self, mock_keyup, mock_keydown):
        self.receiver.handle_keyboard_command({"action": "key_down", "key": "shift"})
        mock_keydown.assert_called_once_with("shift", _pause=False)
        self.assertIn("shift", self.receiver.held_keys)

        # Emergency stop should release shift and all modifiers
        self.receiver.emergency_stop()
        self.assertEqual(len(self.receiver.held_keys), 0)
        self.assertTrue(mock_keyup.called)

    @patch('pyautogui.press')
    @patch('pyautogui.hotkey')
    @patch('pyautogui.write')
    def test_keyboard_malicious_commands_rejected(self, mock_write, mock_hotkey, mock_press):
        # Arbitrary OS or shell commands must be strictly rejected
        dangerous_payloads = [
            {"action": "key_press", "key": "powershell.exe"},
            {"action": "key_press", "key": "cmd.exe"},
            {"action": "key_press", "key": "format c:"},
            {"action": "unknown_action", "key": "enter"},
            {"action": "hotkey", "modifiers": ["sudo"], "key": "rm -rf"},
        ]
        for p in dangerous_payloads:
            self.receiver.handle_keyboard_command(p)
        mock_press.assert_not_called()
        mock_hotkey.assert_not_called()
        mock_write.assert_not_called()

    @patch('pyautogui.press')
    def test_keyboard_relay_via_on_message(self, mock_press):
        msg = '{"type": "keyboard_relay", "keyPayload": {"action": "key_press", "key": "enter"}}'
        self.receiver.on_message(None, msg)
        mock_press.assert_called_once_with("enter", _pause=False)

    @patch('pyautogui.hotkey')
    def test_alt_f4_command(self, mock_hotkey):
        """Test alt_f4 command via handle_command."""
        payload = {"type": "alt_f4"}
        self.receiver.handle_command(payload)
        mock_hotkey.assert_called_once_with("alt", "f4")

    @patch('pyautogui.hotkey')
    def test_alt_f4_keyboard_hotkey(self, mock_hotkey):
        """Test alt_f4 via keyboard hotkey."""
        payload = {"action": "hotkey", "key": "f4", "modifiers": ["alt"]}
        self.receiver.handle_keyboard_command(payload)
        mock_hotkey.assert_called_once_with("alt", "f4")

    @patch('pyautogui.hotkey')
    def test_alt_f4_direct_message(self, mock_hotkey):
        """Test alt_f4 via direct websocket message."""
        msg = '{"type": "alt_f4"}'
        self.receiver.on_message(None, msg)
        mock_hotkey.assert_called_once_with("alt", "f4")

    @patch('receiver.find_airmouse_windows', return_value=[])
    @patch('webbrowser.open')
    def test_hotkey_opens_website_when_not_open(self, mock_web_open, mock_find_win):
        """When website is not open, Ctrl+A+H launches the website."""
        self.receiver.pairing_code = "987654"
        self.receiver.launch_or_focus_airmouse()
        mock_web_open.assert_called_once_with(f"{self.receiver.website_url}/connect?code=987654")

    @patch('receiver.find_airmouse_windows', return_value=[(12345, "AirMouse Cloud - Google Chrome")])
    @patch('receiver.bring_window_to_foreground')
    @patch('webbrowser.open')
    def test_hotkey_focuses_existing_window_when_already_open(self, mock_web_open, mock_bring_fg, mock_find_win):
        """When website is already open, Ctrl+A+H brings it to foreground without opening duplicate."""
        self.receiver.launch_or_focus_airmouse()
        mock_bring_fg.assert_called_once_with(12345)
        mock_web_open.assert_not_called()

if __name__ == '__main__':
    unittest.main()
