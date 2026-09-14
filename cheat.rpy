# CHEAT_VERSION: 1.0.0
# ============================================================
# REN'PY CHEAT ENGINE – Name Search + Delta Scanner
# Click the "CHEAT" button on the main menu (top-right),
# or press F12 to open/close.
# ============================================================

init python:
    import renpy.store as store
    import inspect
    renpy.notify("Cheat Engine loaded! Click CHEAT button or press F12.")

    if not persistent.cheat_favorites:
        persistent.cheat_favorites = []

    class CheatScanner:
        def __init__(self):
            self.results = []
            self.snapshot = {}
            self.edit_values = {}

        def _collect_values(self, obj, path, depth, max_depth, results):
            if depth > max_depth:
                return
            if obj is None:
                return
            if inspect.isbuiltin(obj) or inspect.ismodule(obj) or inspect.isclass(obj):
                return

            if isinstance(obj, (list, tuple)):
                for i, val in enumerate(obj):
                    self._collect_values(val, f"{path}[{i}]" if path else f"[{i}]", depth+1, max_depth, results)
                return

            if isinstance(obj, dict):
                for key, val in obj.items():
                    key_str = str(key)
                    self._collect_values(val, f"{path}.{key_str}" if path else key_str, depth+1, max_depth, results)
                return

            if isinstance(obj, (int, float)):
                results.append({"name": path, "value": obj})
                return

            if hasattr(obj, "__dict__"):
                for attr_name, attr_val in obj.__dict__.items():
                    if attr_name.startswith("_"):
                        continue
                    self._collect_values(attr_val, f"{path}.{attr_name}" if path else attr_name, depth+1, max_depth, results)
            else:
                for attr_name in dir(obj):
                    if attr_name.startswith("_"):
                        continue
                    try:
                        attr_val = getattr(obj, attr_name)
                        if callable(attr_val):
                            continue
                        self._collect_values(attr_val, f"{path}.{attr_name}" if path else attr_name, depth+1, max_depth, results)
                    except:
                        pass

        def scan_all(self):
            self.results = []
            self._collect_values(store, "", 0, 3, self.results)
            self.results.sort(key=lambda x: x["name"])
            return self.results

        def search_by_name(self, search_term):
            self.results = []
            self._collect_values(store, "", 0, 3, self.results)
            matches = []
            for item in self.results:
                if search_term.lower() in item["name"].lower():
                    matches.append(item)
            matches.sort(key=lambda x: x["name"])
            return matches

        def take_snapshot(self):
            self.snapshot = {}
            snapshot_list = []
            self._collect_values(store, "", 0, 3, snapshot_list)
            for item in snapshot_list:
                self.snapshot[item["name"]] = item["value"]
            return len(self.snapshot)

        def scan_delta(self, delta):
            matches = []
            current_list = []
            self._collect_values(store, "", 0, 3, current_list)
            current_dict = {item["name"]: item["value"] for item in current_list}

            for name, old_val in self.snapshot.items():
                if name in current_dict:
                    current_val = current_dict[name]
                    if isinstance(current_val, (int, float)):
                        if abs((current_val - old_val) - delta) < 0.001:
                            matches.append({
                                "name": name,
                                "old": old_val,
                                "current": current_val,
                                "change": current_val - old_val
                            })
            matches.sort(key=lambda x: x["name"])
            return matches

        def set_value(self, name, new_value_str):
            try:
                new_value = float(new_value_str)
            except:
                return False
            parts = name.split('.')
            obj = store
            for part in parts[:-1]:
                if hasattr(obj, part):
                    obj = getattr(obj, part)
                elif isinstance(obj, dict) and part in obj:
                    obj = obj[part]
                elif isinstance(obj, list) and part.isdigit():
                    obj = obj[int(part)]
                else:
                    return False
            attr = parts[-1]
            if hasattr(obj, attr):
                setattr(obj, attr, new_value)
                return True
            elif isinstance(obj, dict) and attr in obj:
                obj[attr] = new_value
                return True
            elif isinstance(obj, list) and attr.isdigit():
                obj[int(attr)] = new_value
                return True
            return False

    scanner = CheatScanner()

# ---- Styles (top-level) ----
style cheat_frame:
    xsize 400
    ysize 1.0
    background "#1e1e24"
    padding (10, 10)

style cheat_input:
    background "#111115"
    color "#fff"
    padding (4, 4)
    size 12

style cheat_textbutton:
    background None
    hover_background None
    color "#4dadff"
    hover_color "#ffffff"

# ---- Helper: standardised input field ----
screen cheat_input_field(label, var, width=150):
    hbox:
        spacing 5
        if label:
            text label color "#aaa" size 11
        input:
            value ScreenVariableValue(var)
            style "cheat_input"
            xsize width

# ---- Main Screen ----
screen cheat_scanner():
    default tab = "search"
    default results = []
    default search_term = ""
    default delta_results = []
    default delta_amount = 0
    default delta_status = "Take a snapshot first."
    default edit_values = {}

    tag cheat_scanner
    zorder 100

    drag:
        drag_name "cheat_panel"
        draggable True
        xpos 1.0
        ypos 0.0
        xanchor 1.0
        yanchor 0.0

        frame:
            style "cheat_frame"
            vbox:
                xfill True
                yfill True
                spacing 8

                # ---- Header ----
                hbox:
                    xfill True
                    spacing 10
                    text "🧪 CHEAT ENGINE" color "#4dadff" size 18 bold True
                    textbutton "✕" action Hide("cheat_scanner") text_color "#ff6b6b" text_size 14

                # ---- Tabs ----
                hbox:
                    xfill True
                    spacing 10
                    textbutton "🔍 Search Name":
                        action SetScreenVariable("tab", "search")
                    textbutton "📉 Delta Scan":
                        action SetScreenVariable("tab", "delta")

                # ---- Search Tab ----
                if tab == "search":
                    vbox:
                        xfill True
                        spacing 8

                        use cheat_input_field("Variable name:", "search_term", 150)

                        hbox:
                            spacing 5
                            textbutton "🔎 Search":
                                action Function(scanner.search_by_name, search_term), SetScreenVariable("results", scanner.search_by_name(search_term))
                            textbutton "Clear":
                                action SetScreenVariable("results", [])

                        viewport:
                            mousewheel True
                            xfill True
                            yfill True
                            vbox:
                                spacing 4
                                for item in results:
                                    frame:
                                        background "#2a2a35"
                                        padding (6, 4)
                                        vbox:
                                            spacing 2
                                            hbox:
                                                spacing 10
                                                text "[item['name']]" color "#fff" bold True size 11
                                                text "= [item['value']]" color "#2ecc71" size 11
                                            hbox:
                                                spacing 5
                                                text "Set to:" color "#aaa" size 10
                                                $ var_name = item['name']
                                                $ edit_values[var_name] = edit_values.get(var_name, str(item['value']))
                                                use cheat_input_field("", "edit_values['{}']".format(var_name), 60)
                                                textbutton "Apply":
                                                    action Function(scanner.set_value, var_name, edit_values[var_name]), Function(scanner.search_by_name, search_term), SetScreenVariable("results", scanner.search_by_name(search_term))

                # ---- Delta Tab ----
                else:
                    vbox:
                        xfill True
                        spacing 8

                        text "Take snapshot, change value, then scan." color "#aaa" size 11

                        use cheat_input_field("Change amount:", "delta_amount", 60)

                        hbox:
                            spacing 5
                            textbutton "📷 Take Snapshot":
                                action Function(scanner.take_snapshot), SetScreenVariable("delta_status", "Snapshot taken! Change the value in-game, then enter the change amount and scan.")
                            textbutton "🔎 Scan Delta":
                                action Function(scanner.scan_delta, delta_amount), SetScreenVariable("delta_results", scanner.scan_delta(delta_amount)), SetScreenVariable("delta_status", "Scan complete.")

                        text "[delta_status]" color "#aaa" size 10

                        viewport:
                            mousewheel True
                            xfill True
                            yfill True
                            vbox:
                                spacing 2
                                for match in delta_results:
                                    frame:
                                        background "#2a2a35"
                                        padding (4, 4)
                                        hbox:
                                            spacing 10
                                            text "[match['name']]" color "#fff" bold True size 11
                                            text "old: [match['old']] → new: [match['current']]" color "#2ecc71" size 11

# ---- On‑screen button ----
screen cheat_launcher():
    zorder 100
    modal False
    frame:
        xalign 1.0
        yalign 0.02
        background "#4dadff"
        xpadding 10
        ypadding 5
        xminimum 80
        xmaximum 120
        textbutton "🧪 CHEAT" action Show("cheat_scanner") text_color "#1e1e24" text_size 14

# ---- Register button ----
init python:
    if "cheat_launcher" not in config.overlay_screens:
        config.overlay_screens.append("cheat_launcher")
    if "cheat_launcher" not in config.always_shown_screens:
        config.always_shown_screens.append("cheat_launcher")

# ---- F12 Keybinding ----
init python:
    def toggle_scanner():
        if renpy.get_screen("cheat_scanner"):
            renpy.hide_screen("cheat_scanner")
        else:
            renpy.show_screen("cheat_scanner")
        renpy.restart_interaction()

    config.keymap["toggle_scanner"] = ["K_F12"]
    config.underlay.append(renpy.Keymap(toggle_scanner=toggle_scanner))

# ---- Show button on main menu ----
label before_main_menu:
    show screen cheat_launcher
    return