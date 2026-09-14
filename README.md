# Universal Game Injector & Dynamic Memory Scanner

Universal Game Injector & Dynamic Memory Scanner is a cross-engine toolkit designed to inject non-intrusive cheat, inspection, and manipulation menus into web-based games (HTML5 / RPG Maker MV/MZ) and Ren'Py visual novels. It provides real-time variable inspection, value freezing, mathematical obfuscation reverse-engineering (Advanced Scanner), dynamic delta tracking, and non-destructive file backups.

---

## Features

- **Multi-Engine Target Support**:
  - **RPG Maker MV/MZ (HTML5/NW.js)**: Automatically detects game root structures, parses title metadata (`System.json`), and safely injects low-overhead JavaScript runtime panels into core HTML entry points.
  - **Ren'Py (Python Engine)**: Scans for game directories, dynamically injects an in-game Python cheat menu screen (`cheat.rpy`), and binds hotkeys (F12) alongside main-menu launcher integration.
- **Safe Injection & Backup Management**: Automatically generates backups of original source files (`index.html` or `cheat.rpy`) under a separate `backups/` directory prior to injection, allowing single-click full restoration to the vanilla game state.
- **Interactive GUI Interface (`Injector.py`)**: Built with Tkinter featuring live directory status tracking, engine detection feedback, backup indicator displays, continuous horizontal scrolling marquee notifications, and single-click update/patch toggling.
- **Smart Variable Matrix (`cheat_script.js`)**: Opens an external non-blocking panel to scan, search, favorite, filter, edit, and freeze active live numerical, string, or boolean variables in real time.
- **Advanced Obfuscation Reverse-Engineering (`experimental.js`)**:
  - **Advanced Scanner**: Performs regression analysis fitting across continuous user inputs (linear, power, exponential, inverse curve fitting with $R^2$ quality metrics) to find hidden or obfuscated variable formulas (e.g., encryption multipliers or offset memory formulas).
  - **Delta Scanner**: Tracks variable memory changes by continuous snapshot deltas, direction of change (increased/decreased), or exact numerical offsets.

---

## File Architecture & Role Breakdown

- `Injector.py`: The central Python Tkinter GUI launcher. Manages file system scanning, detects engine signatures, performs string-matching script injections, manages non-destructive backup file states, and handles restoration.
- `cheat_script.js`: The main JavaScript runtime script injected into RPG Maker / HTML5 games. Initializes a secondary floating web window containing the matrix grid, variable freezing timers, real-time value input handlers, and favorite variable lists.
- `experimental.js`: An optional modular extension layer that adds advanced mathematical curve fitting (to defeat obfuscated variables), delta tracking routines, and engine-specific hacks (such as player movement speed multipliers).
- `cheat.rpy`: The native Ren'Py engine cheat module script. Implements variable traversal across the Ren'Py global `store`, name search matching, snapshot delta comparisons, and an overlay screen interface. (WIP)

---

## Quick Start / Usage

1) Execute the application
2) Select the RPGMaker built game folder
3) Optionally add in experimental features
4) Click Inject Cheat Engine
5) Run game

## Building the Executable

If you want to compile Injector.py into a single standalone .exe without requiring users to have Python installed:

    Install PyInstaller:
    Bash

    pip install pyinstaller

    Compile to Single File:
    Run PyInstaller as a module using the --clean, --noconsole, and --onefile flags:
    Bash

    python -m PyInstaller --clean --noconsole --onefile Injector.py

Deploy Runtime Assets:
Once compilation completes, navigate to the newly created dist/ directory. Ensure your runtime injection files (cheat_script.js, experimental.js, cheat.rpy) are placed in the same directory as the generated Injector.exe.
    
### Running from Source

```bash
python Injector.py
