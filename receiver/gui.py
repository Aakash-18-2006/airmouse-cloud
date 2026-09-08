"""
AirMouse Cloud - Windows Receiver Floating GUI Overlay
Displays connection status, pairing PIN, active control state, and Emergency Stop button.
Designed according to AirMouse specifications.
"""
import tkinter as tk
from tkinter import font as tkfont
import threading

class EmergencyStopOverlay:
    def __init__(self, on_emergency_stop=None):
        self.on_emergency_stop = on_emergency_stop
        self.root = None
        self.cloud_label = None
        self.card_frame = None
        self.title_label = None
        self.code_title_label = None
        self.code_val_label = None
        self.sub_status_label = None
        self.stop_button = None
        self._thread = None
        self.is_running = False

        # State tracking
        self.current_code = "------"
        self.is_phone_connected = False
        self.is_control_active = False

    def start(self):
        """Starts GUI in a background daemon thread."""
        self._thread = threading.Thread(target=self._run_gui, daemon=True)
        self._thread.start()

    def _run_gui(self):
        try:
            self.root = tk.Tk()
            self.root.title("AirMouse")
            self.root.geometry("340x310")
            self.root.resizable(False, False)
            self.root.attributes("-topmost", True)
            self.root.configure(bg="#0b1120")

            # Fonts
            title_font = tkfont.Font(family="Segoe UI", size=15, weight="bold")
            status_font = tkfont.Font(family="Segoe UI", size=10, weight="normal")
            section_font = tkfont.Font(family="Segoe UI", size=9, weight="bold")
            code_font = tkfont.Font(family="Consolas", size=26, weight="bold")
            sub_font = tkfont.Font(family="Segoe UI", size=10)
            btn_font = tkfont.Font(family="Segoe UI", size=11, weight="bold")

            # Outer container
            container = tk.Frame(self.root, bg="#0b1120", padx=18, pady=14)
            container.pack(fill="both", expand=True)

            # 1. Header: AIR MOUSE
            self.title_label = tk.Label(
                container,
                text="AIR MOUSE",
                font=title_font,
                fg="#38bdf8",
                bg="#0b1120"
            )
            self.title_label.pack(pady=(2, 4))

            # 2. Cloud Status: Connecting / Connected
            self.cloud_label = tk.Label(
                container,
                text="Cloud Status: Connecting...",
                font=status_font,
                fg="#facc15",
                bg="#0b1120"
            )
            self.cloud_label.pack(pady=(0, 10))

            # 3. Center Info Card
            self.card_frame = tk.Frame(
                container,
                bg="#1e293b",
                padx=16,
                pady=12,
                highlightbackground="#334155",
                highlightthickness=1
            )
            self.card_frame.pack(fill="x", pady=6)

            # Card Section Label: e.g. "PAIRING CODE" or "Phone: Connected"
            self.code_title_label = tk.Label(
                self.card_frame,
                text="PAIRING CODE",
                font=section_font,
                fg="#94a3b8",
                bg="#1e293b"
            )
            self.code_title_label.pack()

            # Big Code / Control Display
            self.code_val_label = tk.Label(
                self.card_frame,
                text="------",
                font=code_font,
                fg="#f8fafc",
                bg="#1e293b"
            )
            self.code_val_label.pack(pady=4)

            # Sub Status: e.g. "Waiting for phone..." or "Control: ACTIVE"
            self.sub_status_label = tk.Label(
                self.card_frame,
                text="Waiting for phone...",
                font=sub_font,
                fg="#cbd5e1",
                bg="#1e293b"
            )
            self.sub_status_label.pack()

            # 4. Prominent Red Emergency Stop Button
            self.stop_button = tk.Button(
                container,
                text="[ STOP CONTROL ]",
                font=btn_font,
                bg="#ef4444",
                fg="#ffffff",
                activebackground="#dc2626",
                activeforeground="#ffffff",
                relief="flat",
                cursor="hand2",
                padx=16,
                pady=8,
                command=self._handle_stop_click
            )
            self.stop_button.pack(fill="x", pady=(14, 4))

            self.is_running = True
            self.root.protocol("WM_DELETE_WINDOW", self._on_window_close)
            self.root.mainloop()
        except Exception:
            self.is_running = False

    def _on_window_close(self):
        """When user clicks X on floating window, trigger emergency stop then close."""
        self._handle_stop_click()
        if self.root:
            try:
                self.root.destroy()
            except Exception:
                pass

    def _handle_stop_click(self):
        if self.on_emergency_stop:
            self.on_emergency_stop()
        self.show_stopped_state()

    def show_stopped_state(self):
        """Updates UI display to reflect that mouse control has been halted."""
        if not self.root:
            return
        def _update():
            if self.code_title_label:
                self.code_title_label.config(text="STATUS", fg="#ef4444")
            if self.code_val_label:
                self.code_val_label.config(text="STOPPED", fg="#ef4444", font=("Segoe UI", 18, "bold"))
            if self.sub_status_label:
                self.sub_status_label.config(text="Control: INACTIVE", fg="#94a3b8")
            if self.stop_button:
                self.stop_button.config(
                    text="CONTROL STOPPED",
                    bg="#475569",
                    activebackground="#475569",
                    state="disabled",
                    cursor="arrow"
                )
        self.root.after(0, _update)

    def set_cloud_status(self, status_text: str, color="#f8fafc"):
        if self.root and self.cloud_label:
            self.root.after(0, lambda: self.cloud_label.config(text=f"Cloud Status: {status_text}", fg=color))

    def set_pairing_code(self, code: str):
        self.current_code = str(code)
        if not self.root:
            return
        def _update():
            if not self.is_phone_connected:
                if self.code_title_label:
                    self.code_title_label.config(text="PAIRING CODE", fg="#94a3b8")
                if self.code_val_label:
                    self.code_val_label.config(text=str(code), fg="#f8fafc", font=("Consolas", 26, "bold"))
                if self.sub_status_label:
                    self.sub_status_label.config(text="Waiting for phone...", fg="#cbd5e1")
                if self.stop_button:
                    self.stop_button.config(
                        text="[ STOP CONTROL ]",
                        bg="#ef4444",
                        activebackground="#dc2626",
                        state="normal",
                        cursor="hand2"
                    )
        self.root.after(0, _update)

    def set_phone_paired(self, hostname="Phone"):
        self.is_phone_connected = True
        self.is_control_active = True
        if not self.root:
            return
        def _update():
            if self.code_title_label:
                self.code_title_label.config(text="Phone: Connected", fg="#22c55e")
            if self.code_val_label:
                self.code_val_label.config(text="ACTIVE", fg="#22c55e", font=("Segoe UI", 22, "bold"))
            if self.sub_status_label:
                self.sub_status_label.config(text="Control: ACTIVE", fg="#4ade80")
            if self.stop_button:
                self.stop_button.config(
                    text="[ STOP CONTROL ]",
                    bg="#ef4444",
                    activebackground="#dc2626",
                    state="normal",
                    cursor="hand2"
                )
        self.root.after(0, _update)

    def set_phone_disconnected(self):
        self.is_phone_connected = False
        self.is_control_active = False
        if not self.root:
            return
        def _update():
            if self.code_title_label:
                self.code_title_label.config(text="Phone: Disconnected", fg="#facc15")
            if self.code_val_label:
                self.code_val_label.config(text=self.current_code, fg="#f8fafc", font=("Consolas", 26, "bold"))
            if self.sub_status_label:
                self.sub_status_label.config(text="Waiting for phone...", fg="#cbd5e1")
        self.root.after(0, _update)
