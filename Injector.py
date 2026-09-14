import os
import sys
import re
import json
import shutil
import stat
import tkinter as tk
from tkinter import filedialog
from abc import ABC, abstractmethod

# ==========================================
# THEME CONFIGURATION
# ==========================================
COLOR_BG = "#1e1e24"
COLOR_CARD = "#2a2a35"
COLOR_BORDER = "#3a3a44"
COLOR_TEXT = "#f5f5f6"
COLOR_SUBTEXT = "#aaaaaa"
COLOR_PRIMARY = "#4dadff"
COLOR_SUCCESS = "#2ecc71"
COLOR_WARNING = "#ffb347"
COLOR_DANGER = "#e74c3c"
COLOR_INPUT_BG = "#111115"

# ==========================================
# FALLBACK REN'PY CHEAT SCRIPT (if cheat.rpy is missing)
# ==========================================
FALLBACK_RENPY_CHEAT = r'''# CHEAT_VERSION: 1.0.0
# ============================================================
# REN'PY UNIVERSAL CHEAT ENGINE
# Press F1 in-game to open the cheat menu.
# ============================================================

init python:
    import renpy.store as store
    import inspect
    import json
    from collections import OrderedDict

    class CheatEngine:
        def __init__(self):
            self.snapshot = {}
            self.favorites = persistent.cheat_favorites if persistent.cheat_favorites is not None else []
            self.freeze_targets = {}
            self.freeze_active = False
            self.freeze_loop = None

        def deep_scan(self):
            results = []
            for var_name in dir(store):
                if var_name.startswith("_") or var_name in ["config", "gui", "persistent", "cheat"]:
                    continue
                try:
                    val = getattr(store, var_name)
                    if isinstance(val, (int, float)):
                        results.append({"name": var_name, "value": val})
                except:
                    pass
            return results

        def take_snapshot(self):
            self.snapshot = {}
            for var_name in dir(store):
                if var_name.startswith("_") or var_name in ["config", "gui", "persistent", "cheat"]:
                    continue
                try:
                    val = getattr(store, var_name)
                    if isinstance(val, (int, float)):
                        self.snapshot[var_name] = val
                except:
                    pass
            return len(self.snapshot)

        def scan_delta(self, target_delta):
            matches = []
            for var_name, old_val in self.snapshot.items():
                try:
                    current_val = getattr(store, var_name)
                    if isinstance(current_val, (int, float)):
                        if abs((current_val - old_val) - target_delta) < 0.001:
                            matches.append({
                                "name": var_name,
                                "old": old_val,
                                "current": current_val,
                                "change": current_val - old_val
                            })
                except:
                    pass
            return matches

        def start_freeze(self, var_name, target_value):
            if self.freeze_loop is not None:
                self.stop_freeze()
            self.freeze_active = True
            self.freeze_targets[var_name] = target_value
            self.freeze_loop = True
            renpy.invoke_in_new_context(self._freeze_loop)

        def _freeze_loop(self):
            while self.freeze_loop:
                for var_name, target_val in self.freeze_targets.items():
                    try:
                        setattr(store, var_name, target_val)
                    except:
                        pass
                renpy.pause(0.1, hard=True)

        def stop_freeze(self):
            self.freeze_loop = False
            self.freeze_active = False
            self.freeze_targets = {}

        def add_favorite(self, var_name):
            if var_name not in self.favorites:
                self.favorites.append(var_name)
                persistent.cheat_favorites = self.favorites

        def remove_favorite(self, var_name):
            if var_name in self.favorites:
                self.favorites.remove(var_name)
                persistent.cheat_favorites = self.favorites

    cheat = CheatEngine()

init python:
    if persistent.cheat_favorites is None:
        persistent.cheat_favorites = []

screen cheat_menu():
    key "K_F1" action Show("cheat_menu", transition=dissolve)
    tag cheat_menu
    zorder 100

    frame:
        xalign 0.5 yalign 0.5
        xsize 700 ysize 600
        background "#1e1e24"
        vbox:
            xfill True
            spacing 10
            padding (15, 15)

            hbox:
                xfill True
                text "🧪 CHEAT ENGINE" color "#4dadff" size 20 bold True
                textbutton "Close" action Hide("cheat_menu")

            hbox:
                xfill True
                textbutton "🔍 Deep Scan" action SetScreenVariable("tab", "scan")
                textbutton "📉 Delta Scan" action SetScreenVariable("tab", "delta")
                textbutton "⭐ Favorites" action SetScreenVariable("tab", "fav")
                textbutton "❄️ Freeze" action SetScreenVariable("tab", "freeze")

            if tab == "scan":
                use cheat_scan_tab
            elif tab == "delta":
                use cheat_delta_tab
            elif tab == "fav":
                use cheat_fav_tab
            elif tab == "freeze":
                use cheat_freeze_tab

    default tab = "scan"

screen cheat_scan_tab():
    vbox:
        xfill True
        spacing 8

        textbutton "🔎 Run Deep Scan" action Function(cheat.deep_scan), SetScreenVariable("scan_results", cheat.deep_scan())

        viewport:
            draggable True
            mousewheel True
            xsize 650 ysize 350
            vbox:
                spacing 2
                for item in scan_results:
                    frame:
                        background "#2a2a35"
                        padding (5, 5)
                        hbox:
                            text "[item['name']]" color "#fff" bold True size 12
                            text " = [item['value']]" color "#2ecc71" size 12
                            textbutton "⭐" action Function(cheat.add_favorite, item['name']), SetScreenVariable("scan_results", cheat.deep_scan())

    default scan_results = []

screen cheat_delta_tab():
    vbox:
        xfill True
        spacing 8

        hbox:
            text "Delta amount: " color "#aaa"
            input:
                id "delta_input"
                value VariableInputValue("delta_amount")
                background "#111115" color "#fff"
                xsize 80

        hbox:
            textbutton "📷 Take Snapshot" action Function(cheat.take_snapshot), SetVariable("delta_status", "Snapshot taken! Now change the value in-game, then enter delta and scan.")
            textbutton "🔎 Scan Delta" action Function(cheat.scan_delta, delta_amount), SetScreenVariable("delta_results", cheat.scan_delta(delta_amount)), SetVariable("delta_status", "Scan complete.")

        text "[delta_status]" color "#aaa" size 11

        viewport:
            draggable True
            mousewheel True
            xsize 650 ysize 300
            vbox:
                spacing 2
                for match in delta_results:
                    frame:
                        background "#2a2a35"
                        padding (5, 5)
                        hbox:
                            text "[match['name']]" color "#fff" bold True size 12
                            text " old: [match['old']] -> new: [match['current']]" color "#2ecc71" size 12
                            textbutton "⭐" action Function(cheat.add_favorite, match['name'])

    default delta_status = "Take a snapshot first, then change the value and enter the delta."
    default delta_results = []
    default delta_amount = 0

screen cheat_fav_tab():
    vbox:
        xfill True
        spacing 8

        text "Your favorited variables:" color "#aaa" size 12

        viewport:
            draggable True
            mousewheel True
            xsize 650 ysize 350
            vbox:
                spacing 2
                for var_name in cheat.favorites:
                    frame:
                        background "#2a2a35"
                        padding (5, 5)
                        hbox:
                            text "[var_name]" color "#fff" bold True size 12
                            text " = [getattr(store, var_name, 'N/A')]" color "#2ecc71" size 12
                            textbutton "❌" action Function(cheat.remove_favorite, var_name), SetScreenVariable("dummy", 1)

screen cheat_freeze_tab():
    vbox:
        xfill True
        spacing 8

        text "Enter variable name and target value to freeze:" color "#aaa" size 11

        hbox:
            text "Variable: " color "#aaa"
            input:
                value VariableInputValue("freeze_var_name")
                background "#111115" color "#fff"
                xsize 150
        hbox:
            text "Target: " color "#aaa"
            input:
                value VariableInputValue("freeze_target_value")
                background "#111115" color "#fff"
                xsize 80

        hbox:
            textbutton "❄️ Start Freeze" action Function(cheat.start_freeze, freeze_var_name, float(freeze_target_value)), SetVariable("freeze_status", "Freezing...")
            textbutton "🔥 Stop Freeze" action Function(cheat.stop_freeze), SetVariable("freeze_status", "Stopped")

        text "[freeze_status]" color "#aaa" size 11

        viewport:
            draggable True
            mousewheel True
            xsize 650 ysize 200
            vbox:
                spacing 2
                for var, val in cheat.freeze_targets.items():
                    frame:
                        background "#2a2a35"
                        padding (5, 5)
                        hbox:
                            text "[var]" color "#ffb347" bold True size 12
                            text " locked to [val]" color "#4dadff" size 12

    default freeze_var_name = ""
    default freeze_target_value = 0
    default freeze_status = "Not active"

label before_main_menu:
    return
'''

# ==========================================
# AUTO-SCROLLING MARQUEE LABEL
# ==========================================
class MarqueeLabel(tk.Canvas):
    def __init__(self, parent, bg=COLOR_CARD, font=("Segoe UI", 9, "bold"), **kwargs):
        super().__init__(parent, bg=bg, highlightthickness=0, bd=0, height=20, **kwargs)
        self.font = font
        self.bg_color = bg
        self.text_str = ""
        self.fg_color = COLOR_TEXT
        self.text_id = self.create_text(0, 10, anchor="w", text="", font=self.font, fill=self.fg_color)
        self.scroll_job = None
        self.x_pos = 0
        self.pause_counter = 0

    def set_text(self, text, fg=COLOR_TEXT):
        self.text_str = text
        self.fg_color = fg
        self.itemconfig(self.text_id, text=text, fill=fg)

        if self.scroll_job:
            self.after_cancel(self.scroll_job)
            self.scroll_job = None

        self.update_idletasks()
        canvas_width = self.winfo_width()
        bbox = self.bbox(self.text_id)
        text_width = (bbox[2] - bbox[0]) if bbox else 0

        self.x_pos = 0
        self.coords(self.text_id, self.x_pos, 10)

        if text_width > canvas_width and canvas_width > 10:
            self.pause_counter = 30
            self._animate_scroll()

    def _animate_scroll(self):
        canvas_width = self.winfo_width()
        bbox = self.bbox(self.text_id)
        text_width = (bbox[2] - bbox[0]) if bbox else 0

        if text_width <= canvas_width:
            self.coords(self.text_id, 0, 10)
            return

        if self.pause_counter > 0:
            self.pause_counter -= 1
            self.scroll_job = self.after(50, self._animate_scroll)
            return

        self.x_pos -= 1
        if abs(self.x_pos) > text_width:
            self.x_pos = canvas_width
            self.pause_counter = 10

        self.coords(self.text_id, self.x_pos, 10)
        self.scroll_job = self.after(30, self._animate_scroll)

# ==========================================
# MODERN DIALOG
# ==========================================
class ModernDialog(tk.Toplevel):
    def __init__(self, parent, title, message, dialog_type="info"):
        super().__init__(parent)
        self.title(title)
        self.configure(bg=COLOR_BG)
        self.resizable(False, False)
        self.transient(parent)
        self.grab_set()

        color_map = {
            "info": COLOR_PRIMARY,
            "success": COLOR_SUCCESS,
            "warning": COLOR_WARNING,
            "error": COLOR_DANGER
        }
        accent = color_map.get(dialog_type, COLOR_PRIMARY)

        container = tk.Frame(self, bg=COLOR_CARD, padx=20, pady=20,
                             highlightbackground=accent, highlightthickness=1)
        container.pack(padx=15, pady=15, fill="both", expand=True)

        tk.Label(container, text=title.upper(), font=("Segoe UI", 10, "bold"),
                 fg=accent, bg=COLOR_CARD).pack(anchor="w", pady=(0, 8))

        tk.Label(container, text=message, font=("Segoe UI", 9),
                 fg=COLOR_TEXT, bg=COLOR_CARD, justify="left", wraplength=360).pack(anchor="w", pady=(0, 15))

        btn = tk.Button(container, text="OK", font=("Segoe UI", 9, "bold"),
                        bg=accent, fg="#1e1e24", activebackground="#ffffff",
                        activeforeground="#1e1e24", bd=0, padx=20, pady=4,
                        cursor="hand2", command=self.destroy)
        btn.pack(anchor="e")

        self.update_idletasks()
        x = parent.winfo_rootx() + (parent.winfo_width() // 2) - (self.winfo_width() // 2)
        y = parent.winfo_rooty() + (parent.winfo_height() // 2) - (self.winfo_height() // 2)
        self.geometry(f"+{max(0, x)}+{max(0, y)}")
        self.wait_window()

def show_msg(title, message, dialog_type="info"):
    ModernDialog(root, title, message, dialog_type)

# ==========================================
# HELPER FUNCTIONS (shared)
# ==========================================
def get_base_path():
    if getattr(sys, 'frozen', False):
        return os.path.dirname(sys.executable)
    return os.path.dirname(os.path.abspath(__file__))

def sanitize_filename(name):
    return re.sub(r'[\\/*?:"<>|]', '_', name).strip()

def read_file_safe(file_path):
    for encoding in ['utf-8-sig', 'utf-8', 'cp1252', 'latin-1']:
        try:
            with open(file_path, 'r', encoding=encoding) as f:
                return f.read(), encoding
        except UnicodeDecodeError:
            continue
    raise Exception(f"Could not read text encoding for {file_path}")

def write_file_safe(file_path, content, encoding):
    if os.path.exists(file_path):
        os.chmod(file_path, stat.S_IWRITE | stat.S_IREAD)
    with open(file_path, 'w', encoding=encoding) as f:
        f.write(content)

# ==========================================
# ENGINE HANDLERS (ABSTRACT BASE)
# ==========================================
class EngineHandler(ABC):
    def __init__(self, folder_path):
        self.folder = folder_path
        self.detected = False
        self.game_name = ""
        self.injected_version = None
        self.injected_mode = None
        self.has_backup = False
        self.backup_path = None
        self.latest_version = None
        self.latest_mode = "STABLE"
        self.engine_name = "Unknown"

    @abstractmethod
    def detect(self):
        """Return True if folder matches this engine."""
        pass

    @abstractmethod
    def get_injection_status(self):
        """Return dict with injected_version, injected_mode, has_backup."""
        pass

    @abstractmethod
    def inject(self, include_experimental):
        """Perform injection. Return True on success."""
        pass

    @abstractmethod
    def restore(self):
        """Restore original from backup. Return True on success."""
        pass

    def get_latest_version_info(self):
        return None, None

# ==========================================
# RPG MAKER HANDLER
# ==========================================
class RPGGameHandler(EngineHandler):
    def __init__(self, folder_path):
        super().__init__(folder_path)
        self.engine_name = "RPG Maker MV/MZ"
        self.html_file = None
        self.game_root = None
        self.rel_path = None

    def detect(self):
        html_file = self._find_best_game_index(self.folder)
        if html_file:
            self.html_file = html_file
            self.game_name, self.game_root, self.rel_path = self._get_game_info(html_file)
            self.detected = True
            status = self.get_injection_status()
            self.injected_version = status.get("version")
            self.injected_mode = status.get("mode")
            self.has_backup = status.get("has_backup")
            self.backup_path = status.get("backup_path")
            self.latest_version, self.latest_mode = self._get_latest_version()
            return True
        return False

    def _find_best_game_index(self, start_path):
        candidates = []
        for root_dir, _, files in os.walk(start_path):
            if 'index.html' in files:
                html_path = os.path.join(root_dir, 'index.html')
                score = self._score_rpg_maker_dir(html_path)
                if score > 0:
                    candidates.append((score, html_path))
        if not candidates:
            return None
        candidates.sort(key=lambda x: x[0], reverse=True)
        return candidates[0][1]

    def _score_rpg_maker_dir(self, html_path):
        base_dir = os.path.dirname(html_path)
        js_dir = os.path.join(base_dir, 'js')
        if not os.path.exists(js_dir):
            return 0
        score = 0
        core_files = ['rpg_core.js', 'rmmz_core.js', 'rpg_managers.js', 'rmmz_managers.js', 'plugins.js', 'main.js']
        for file in core_files:
            if os.path.exists(os.path.join(js_dir, file)):
                score += 2
        if os.path.basename(base_dir).lower() == 'www':
            score += 1
        return score

    def _get_game_info(self, html_path):
        html_dir = os.path.dirname(html_path)
        game_root = os.path.dirname(html_dir) if os.path.basename(html_dir).lower() == 'www' else html_dir
        rel_path = os.path.relpath(html_path, game_root)

        system_json = os.path.join(html_dir, 'data', 'System.json')
        if os.path.exists(system_json):
            try:
                content, _ = read_file_safe(system_json)
                data = json.loads(content)
                if isinstance(data, dict) and data.get('gameTitle'):
                    return sanitize_filename(data['gameTitle']), game_root, rel_path
            except Exception:
                pass

        folder_title = sanitize_filename(os.path.basename(game_root))
        return folder_title or "RPG_Maker_Game", game_root, rel_path

    def _get_script_version(self, script_path):
        if not os.path.exists(script_path):
            return "1.0.0"
        try:
            content, _ = read_file_safe(script_path)
            match = re.search(r'//\s*CHEAT_VERSION:\s*([\d\.]+)', content, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        except Exception:
            pass
        return "1.0.0"

    def _get_injected_details(self, html_content):
        match = re.search(r'<!-- CHEAT ENGINE START v([\d\.]+) \[(\w+)\] -->', html_content)
        if match:
            return match.group(1).strip(), match.group(2).strip()
        if "GameCheatEngine" in html_content or "CHEAT ENGINE START" in html_content:
            return "1.0.0", "STABLE"
        return None, None

    def _get_latest_version(self):
        cheat_script = os.path.join(get_base_path(), "cheat_script.js")
        version = self._get_script_version(cheat_script)
        exp_exists = os.path.exists(os.path.join(get_base_path(), "experimental.js"))
        mode = "EXPERIMENTAL" if exp_exists else "STABLE"
        return version, mode

    def _get_backup_path(self):
        game_title = self.game_name
        game_root = self.game_root
        rel_path = self.rel_path
        backups_dir = os.path.join(get_base_path(), "backups")
        primary_path = os.path.join(backups_dir, game_title, rel_path)
        folder_name = sanitize_filename(os.path.basename(game_root))
        fallback_path = os.path.join(backups_dir, folder_name, rel_path)
        if not os.path.exists(primary_path) and os.path.exists(fallback_path):
            return fallback_path
        return primary_path

    def get_injection_status(self):
        if not self.detected or not self.html_file:
            return {"version": None, "mode": None, "has_backup": False, "backup_path": None}
        try:
            html_content, _ = read_file_safe(self.html_file)
            ver, mode = self._get_injected_details(html_content)
            backup_path = self._get_backup_path()
            has_backup = os.path.exists(backup_path)
            return {"version": ver, "mode": mode, "has_backup": has_backup, "backup_path": backup_path}
        except:
            return {"version": None, "mode": None, "has_backup": False, "backup_path": None}

    def _get_bundled_js(self, include_experimental):
        base_path = get_base_path()
        cheat_script_path = os.path.join(base_path, "cheat_script.js")
        exp_script_path = os.path.join(base_path, "experimental.js")

        if not os.path.exists(cheat_script_path):
            return None, None, "STABLE"

        core_content, _ = read_file_safe(cheat_script_path)
        version = self._get_script_version(cheat_script_path)
        combined = [f"// MODULE: cheat_script.js\n{core_content}"]
        build_mode = "STABLE"

        if include_experimental and os.path.exists(exp_script_path):
            exp_content, _ = read_file_safe(exp_script_path)
            combined.append(f"\n\n// MODULE: experimental.js\n{exp_content}")
            build_mode = "EXPERIMENTAL"

        return "\n".join(combined), version, build_mode

    def inject(self, include_experimental):
        if not self.detected or not self.html_file:
            return False
        try:
            js_content, version, build_mode = self._get_bundled_js(include_experimental)
            if not js_content:
                return False

            html_content, html_encoding = read_file_safe(self.html_file)
            backup_path = self._get_backup_path()

            if not os.path.exists(backup_path):
                os.makedirs(os.path.dirname(backup_path), exist_ok=True)
                shutil.copy2(self.html_file, backup_path)

            html_content = re.sub(
                r'\n\n\s*<!-- CHEAT ENGINE START.*?<!-- CHEAT ENGINE END -->\n',
                '', html_content, flags=re.DOTALL
            )

            formatted_js = "\n".join(["    " + line for line in js_content.splitlines()])
            injection_block = (
                f"\n\n    <!-- CHEAT ENGINE START v{version} [{build_mode}] -->\n"
                f"    <script>\n{formatted_js}\n    </script>\n"
                f"    <!-- CHEAT ENGINE END -->\n"
            )

            body_match = re.search(r'(?i)</body>', html_content)
            html_match = re.search(r'(?i)</html>', html_content)

            if body_match:
                idx = body_match.start()
                updated_html = html_content[:idx] + injection_block + html_content[idx:]
            elif html_match:
                idx = html_match.start()
                updated_html = html_content[:idx] + injection_block + html_content[idx:]
            else:
                updated_html = html_content + injection_block

            write_file_safe(self.html_file, updated_html, html_encoding)
            self.injected_version = version
            self.injected_mode = build_mode
            self.has_backup = True
            self.backup_path = backup_path
            return True
        except Exception as e:
            print(f"Injection error: {e}")
            return False

    def restore(self):
        if not self.has_backup or not self.backup_path:
            return False
        try:
            backup_content, backup_encoding = read_file_safe(self.backup_path)
            write_file_safe(self.html_file, backup_content, backup_encoding)
            os.remove(self.backup_path)
            self.has_backup = False
            self.backup_path = None
            self.injected_version = None
            self.injected_mode = None
            return True
        except Exception as e:
            print(f"Restore error: {e}")
            return False

# ==========================================
# REN'PY HANDLER (with proper backup)
# ==========================================
class RenPyGameHandler(EngineHandler):
    def __init__(self, folder_path):
        super().__init__(folder_path)
        self.engine_name = "Ren'Py"
        self.game_folder = None          # path to the 'game' subfolder
        self.cheat_rpy_path = None       # full path to cheat.rpy inside game folder
        self.backup_path = None          # full path to backup (in backups folder)

    def _read_cheat_rpy(self):
        """Read the cheat.rpy from the injector's folder (or fallback)."""
        base = get_base_path()
        external_path = os.path.join(base, "cheat.rpy")
        if os.path.exists(external_path):
            try:
                with open(external_path, "r", encoding="utf-8") as f:
                    return f.read()
            except Exception as e:
                print(f"Warning: Could not read external cheat.rpy: {e}")
        return FALLBACK_RENPY_CHEAT

    def _get_cheat_version(self, content=None):
        if content is None:
            content = self._read_cheat_rpy()
        match = re.search(r'# CHEAT_VERSION:\s*([\d\.]+)', content)
        if match:
            return match.group(1).strip()
        return "1.0.0"

    def _find_game_folder(self, start_path, max_depth=2):
        if os.path.isdir(os.path.join(start_path, "game")):
            return os.path.join(start_path, "game")
        if max_depth <= 0:
            return None
        try:
            for item in os.listdir(start_path):
                sub = os.path.join(start_path, item)
                if os.path.isdir(sub):
                    result = self._find_game_folder(sub, max_depth - 1)
                    if result:
                        return result
        except PermissionError:
            pass
        return None

    def _get_backup_path(self):
        """Return backup path: backups/GameName/game/cheat.rpy"""
        if not self.game_name:
            self.game_name = os.path.basename(os.path.dirname(self.game_folder)) if self.game_folder else "Unknown"
        backups_dir = os.path.join(get_base_path(), "backups")
        game_backup_dir = os.path.join(backups_dir, sanitize_filename(self.game_name), "game")
        return os.path.join(game_backup_dir, "cheat.rpy")

    def detect(self):
        game_folder = self._find_game_folder(self.folder)
        if game_folder:
            self.game_folder = game_folder
            self.cheat_rpy_path = os.path.join(game_folder, "cheat.rpy")
            self.game_name = os.path.basename(os.path.dirname(game_folder))
            self.detected = True
            # Get status
            status = self.get_injection_status()
            self.injected_version = status.get("version")
            self.injected_mode = status.get("mode")
            self.has_backup = status.get("has_backup")
            self.backup_path = status.get("backup_path")
            self.latest_version, self.latest_mode = self._get_latest_version()
            return True
        return False

    def _get_latest_version(self):
        # Read from external cheat.rpy
        content = self._read_cheat_rpy()
        ver = self._get_cheat_version(content)
        return ver, "STABLE"

    def _read_rpy_version(self, file_path):
        if not os.path.exists(file_path):
            return None
        try:
            content, _ = read_file_safe(file_path)
            match = re.search(r'# CHEAT_VERSION:\s*([\d\.]+)', content)
            if match:
                return match.group(1).strip()
        except:
            pass
        return None

    def get_injection_status(self):
        if not self.detected or not self.cheat_rpy_path:
            return {"version": None, "mode": None, "has_backup": False, "backup_path": None}
        # Check if cheat.rpy exists in game folder
        if os.path.exists(self.cheat_rpy_path):
            ver = self._read_rpy_version(self.cheat_rpy_path)
        else:
            ver = None
        # Check backup path
        backup_path = self._get_backup_path()
        has_backup = os.path.exists(backup_path)
        return {
            "version": ver,
            "mode": "STABLE",
            "has_backup": has_backup,
            "backup_path": backup_path if has_backup else None
        }

    def inject(self, include_experimental):
        if not self.detected or not self.cheat_rpy_path:
            return False
        try:
            # Create backup if it doesn't exist yet (only on first injection)
            backup_path = self._get_backup_path()
            if not os.path.exists(backup_path):
                # Ensure backup directory exists
                os.makedirs(os.path.dirname(backup_path), exist_ok=True)
                # If the game already has a cheat.rpy, back it up; otherwise just mark backup as empty (we'll create it)
                if os.path.exists(self.cheat_rpy_path):
                    shutil.copy2(self.cheat_rpy_path, backup_path)
                else:
                    # No existing cheat.rpy, we still create an empty backup file? 
                    # Better to not create a backup file for a non-existent file; 
                    # but we want the backup to represent "no cheat.rpy" so we can restore that state.
                    # We'll create an empty file as a placeholder? 
                    # Actually we can just write an empty file or write a comment.
                    # We'll write a small placeholder.
                    with open(backup_path, "w", encoding="utf-8") as f:
                        f.write("# This backup represents that no cheat.rpy existed before injection.\n")
                self.backup_path = backup_path
                self.has_backup = True
            else:
                # Backup already exists – keep it (so we can restore original)
                self.backup_path = backup_path
                self.has_backup = True

            # Write the new cheat.rpy
            cheat_content = self._read_cheat_rpy()
            with open(self.cheat_rpy_path, "w", encoding="utf-8") as f:
                f.write(cheat_content)

            # Update injected version
            self.injected_version = self._get_cheat_version(cheat_content)
            self.injected_mode = "STABLE"
            return True
        except Exception as e:
            print(f"Ren'Py injection error: {e}")
            return False

    def restore(self):
        if not self.has_backup or not self.backup_path:
            return False
        try:
            # Read the backup content
            with open(self.backup_path, "r", encoding="utf-8") as f:
                backup_content = f.read()
            # Write it back to the game folder
            with open(self.cheat_rpy_path, "w", encoding="utf-8") as f:
                f.write(backup_content)
            # Remove the backup file
            os.remove(self.backup_path)
            self.has_backup = False
            self.backup_path = None
            self.injected_version = None
            self.injected_mode = None
            return True
        except Exception as e:
            print(f"Ren'Py restore error: {e}")
            return False
# ==========================================
# UNIFIED INJECTOR GUI
# ==========================================
class InjectorApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Universal Game Injector")
        self.root.geometry("580x380")
        self.root.configure(bg=COLOR_BG)
        self.root.resizable(False, False)

        self.folder_var = tk.StringVar()
        self.use_experimental_var = tk.BooleanVar(value=False)
        self.active_handler = None
        self.engine_label = tk.StringVar(value="Engine: Not Detected")

        self.build_ui()
        self.update_ui_status()

    def build_ui(self):
        main_frame = tk.Frame(self.root, bg=COLOR_BG, padx=20, pady=15)
        main_frame.pack(fill="both", expand=True)

        tk.Label(main_frame, text="UNIVERSAL GAME INJECTOR",
                 font=("Segoe UI", 11, "bold"), fg=COLOR_PRIMARY, bg=COLOR_BG).pack(anchor="w")

        # File Selection Card
        file_card = tk.Frame(main_frame, bg=COLOR_CARD, padx=12, pady=10,
                             highlightbackground=COLOR_BORDER, highlightthickness=1)
        file_card.pack(fill="x", pady=(8, 10))

        tk.Label(file_card, text="Game Directory:", font=("Segoe UI", 8, "bold"),
                 fg=COLOR_SUBTEXT, bg=COLOR_CARD).pack(anchor="w", pady=(0, 4))

        entry_frame = tk.Frame(file_card, bg=COLOR_CARD)
        entry_frame.pack(fill="x")

        entry_path = tk.Entry(entry_frame, textvariable=self.folder_var, font=("Consolas", 9),
                              bg=COLOR_INPUT_BG, fg=COLOR_TEXT, insertbackground=COLOR_TEXT,
                              bd=1, relief="solid", highlightthickness=0)
        entry_path.pack(side="left", fill="x", expand=True, ipady=3, padx=(0, 8))

        btn_browse = tk.Button(entry_frame, text="Browse...", font=("Segoe UI", 8, "bold"),
                               bg=COLOR_BORDER, fg=COLOR_TEXT, activebackground=COLOR_PRIMARY,
                               activeforeground="#1e1e24", bd=0, padx=12, cursor="hand2",
                               command=self.browse_folder)
        btn_browse.pack(side="right")

        self.chk_experimental = tk.Checkbutton(
            file_card, text="Include Experimental Features (if available)",
            variable=self.use_experimental_var, font=("Segoe UI", 8, "bold"),
            fg=COLOR_WARNING, bg=COLOR_CARD, activebackground=COLOR_CARD,
            activeforeground=COLOR_WARNING, selectcolor=COLOR_INPUT_BG,
            command=self.update_ui_status
        )
        self.chk_experimental.pack(anchor="w", pady=(4, 0))

        # Engine Info Card
        engine_card = tk.Frame(main_frame, bg=COLOR_CARD, padx=12, pady=5,
                               highlightbackground=COLOR_BORDER, highlightthickness=1)
        engine_card.pack(fill="x", pady=(0, 10))

        tk.Label(engine_card, textvariable=self.engine_label,
                 font=("Segoe UI", 9, "bold"), fg=COLOR_PRIMARY, bg=COLOR_CARD).pack(anchor="w")

        # Live Status Feedback Card
        status_card = tk.Frame(main_frame, bg=COLOR_CARD, padx=12, pady=10,
                               highlightbackground=COLOR_BORDER, highlightthickness=1)
        status_card.pack(fill="x", pady=(0, 15))

        r1 = tk.Frame(status_card, bg=COLOR_CARD)
        r1.pack(fill="x", pady=2)
        tk.Label(r1, text="Target Game:", font=("Segoe UI", 8, "bold"), fg=COLOR_SUBTEXT, bg=COLOR_CARD, width=12, anchor="w").pack(side="left")
        self.lbl_game_val = tk.Label(r1, text="No Directory Selected", font=("Segoe UI", 9, "bold"), fg=COLOR_SUBTEXT, bg=COLOR_CARD)
        self.lbl_game_val.pack(side="left")

        r2 = tk.Frame(status_card, bg=COLOR_CARD)
        r2.pack(fill="x", pady=2)
        tk.Label(r2, text="Injection State:", font=("Segoe UI", 8, "bold"), fg=COLOR_SUBTEXT, bg=COLOR_CARD, width=12, anchor="w").pack(side="left")
        self.lbl_status_val = MarqueeLabel(r2, bg=COLOR_CARD)
        self.lbl_status_val.pack(side="left", fill="x", expand=True)

        r3 = tk.Frame(status_card, bg=COLOR_CARD)
        r3.pack(fill="x", pady=2)
        tk.Label(r3, text="Backup State:", font=("Segoe UI", 8, "bold"), fg=COLOR_SUBTEXT, bg=COLOR_CARD, width=12, anchor="w").pack(side="left")
        self.lbl_backup_val = tk.Label(r3, text="--", font=("Segoe UI", 9, "bold"), fg=COLOR_SUBTEXT, bg=COLOR_CARD)
        self.lbl_backup_val.pack(side="left")

        # Action Buttons
        btn_frame = tk.Frame(main_frame, bg=COLOR_BG)
        btn_frame.pack(fill="x")

        self.btn_inject = tk.Button(btn_frame, text="Inject Cheat Engine", font=("Segoe UI", 9, "bold"),
                                    bg=COLOR_BORDER, fg="#1e1e24", activebackground="#ffffff",
                                    bd=0, pady=6, cursor="hand2", command=self.inject_cheat, state="disabled")
        self.btn_inject.pack(side="left", fill="x", expand=True, padx=(0, 6))

        self.btn_restore = tk.Button(btn_frame, text="Restore Original", font=("Segoe UI", 9, "bold"),
                                     bg=COLOR_BORDER, fg="#ffffff", activebackground="#ffffff",
                                     bd=0, pady=6, cursor="hand2", command=self.restore_cheat, state="disabled")
        self.btn_restore.pack(side="right", fill="x", expand=True, padx=(6, 0))

    def browse_folder(self):
        folder = filedialog.askdirectory()
        if folder:
            self.folder_var.set(folder)
            self.update_ui_status()

    def try_handlers(self, folder):
        handlers = [
            RPGGameHandler(folder),
            RenPyGameHandler(folder)
        ]
        for handler in handlers:
            if handler.detect():
                return handler
        return None

    def find_game_root(self, folder, max_depth=2):
        handler = self.try_handlers(folder)
        if handler:
            return handler
        if max_depth <= 0:
            return None
        try:
            for item in os.listdir(folder):
                sub = os.path.join(folder, item)
                if os.path.isdir(sub):
                    handler = self.find_game_root(sub, max_depth - 1)
                    if handler:
                        return handler
        except PermissionError:
            pass
        return None

    def update_ui_status(self):
        folder = self.folder_var.get().strip()
        if not folder or not os.path.isdir(folder):
            self.engine_label.set("Engine: Not Detected")
            self.lbl_game_val.config(text="No Directory Selected", fg=COLOR_SUBTEXT)
            self.lbl_status_val.set_text("Waiting for folder selection...", fg=COLOR_SUBTEXT)
            self.lbl_backup_val.config(text="--", fg=COLOR_SUBTEXT)
            self.btn_inject.config(text="Inject Cheat Engine", state="disabled", bg=COLOR_BORDER)
            self.btn_restore.config(state="disabled", bg=COLOR_BORDER)
            self.active_handler = None
            return

        handler = self.find_game_root(folder)
        if handler is None:
            self.engine_label.set("Engine: Not Recognised")
            self.lbl_game_val.config(text="Invalid Game Folder", fg=COLOR_DANGER)
            self.lbl_status_val.set_text("No supported engine found", fg=COLOR_DANGER)
            self.lbl_backup_val.config(text="--", fg=COLOR_SUBTEXT)
            self.btn_inject.config(text="Inject Cheat Engine", state="disabled", bg=COLOR_BORDER)
            self.btn_restore.config(state="disabled", bg=COLOR_BORDER)
            self.active_handler = None
            return

        self.active_handler = handler
        self.engine_label.set(f"Engine: {handler.engine_name}")

        # Game name
        self.lbl_game_val.config(text=handler.game_name, fg=COLOR_PRIMARY)

        # Injection state
        status = handler.get_injection_status()
        injected_ver = status.get("version")
        injected_mode = status.get("mode")
        has_backup = status.get("has_backup")
        backup_path = status.get("backup_path")

        latest_ver, latest_mode = handler.latest_version, handler.latest_mode

        if has_backup:
            self.lbl_backup_val.config(text="✔ Backup Available", fg=COLOR_SUCCESS)
            self.btn_restore.config(state="normal", bg=COLOR_DANGER)
        else:
            self.lbl_backup_val.config(text="✖ No Backup Created", fg=COLOR_SUBTEXT)
            self.btn_restore.config(state="disabled", bg=COLOR_BORDER)

        exp_exists = os.path.exists(os.path.join(get_base_path(), "experimental.js"))
        exp_enabled = self.use_experimental_var.get() and exp_exists
        target_mode = "EXPERIMENTAL" if exp_enabled else "STABLE"

        if injected_ver is None:
            self.lbl_status_val.set_text("Ready to Inject (Not Injected)", fg=COLOR_SUBTEXT)
            self.btn_inject.config(text=f"Inject Cheat Engine ({target_mode})", state="normal", bg=COLOR_PRIMARY)
        elif injected_ver != latest_ver or injected_mode != target_mode:
            self.lbl_status_val.set_text(
                f"⚠ Build Mismatch (Active: v{injected_ver} [{injected_mode}]  ➔  Target: v{latest_ver} [{target_mode}])",
                fg=COLOR_WARNING
            )
            self.btn_inject.config(text=f"Update Cheat Engine ({target_mode})", state="normal", bg=COLOR_WARNING)
        else:
            self.lbl_status_val.set_text(f"✔ Active & Up to Date (v{injected_ver} - {injected_mode})", fg=COLOR_SUCCESS)
            self.btn_inject.config(text=f"Re-Inject Cheat Engine ({target_mode})", state="normal", bg=COLOR_PRIMARY)

    def inject_cheat(self):
        if self.active_handler is None:
            show_msg("Error", "No supported game detected.", "error")
            return

        include_exp = self.use_experimental_var.get()
        success = self.active_handler.inject(include_exp)
        if success:
            self.update_ui_status()
            show_msg("Success", f"Cheat Engine injected into:\n{self.active_handler.game_name}", "success")
        else:
            show_msg("Error", "Injection failed. Check the console for details.", "error")

    def restore_cheat(self):
        if self.active_handler is None:
            show_msg("Error", "No active game detected.", "error")
            return

        success = self.active_handler.restore()
        if success:
            self.update_ui_status()
            show_msg("Restored", f"Original files restored for:\n{self.active_handler.game_name}", "info")
        else:
            show_msg("Error", "Restore failed. No backup found or error occurred.", "error")

# ==========================================
# MAIN
# ==========================================
if __name__ == "__main__":
    root = tk.Tk()
    app = InjectorApp(root)
    root.mainloop()