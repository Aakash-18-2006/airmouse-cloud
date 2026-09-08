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

if __name__ == '__main__':
    unittest.main()
