// CHEAT_VERSION: 1.2.5 – Freeze Fix (always running intervals)
(function() {
    // ---- Window positioning ----
    var gameWin = window;
    var winWidth = 700, winHeight = 780;
    var left = gameWin.screenX + (gameWin.innerWidth - winWidth) / 2;
    var top  = gameWin.screenY + (gameWin.innerHeight - winHeight) / 2;
    left = Math.max(0, left);
    top  = Math.max(0, top);

    var scanWindow = window.open('', 'GameCheatEngine',
        'width=' + winWidth + ',height=' + winHeight +
        ',resizable=yes,scrollbars=yes,left=' + left + ',top=' + top
    );

    if (!scanWindow) {
        alert("Popup blocker active! Please allow popups to open the Cheat Panel.");
        return;
    }

    // ---- Immediately refocus the game window to keep it on top ----
    gameWin.focus();

    scanWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Smart Variable Matrix</title>
            <style>
                * { box-sizing: border-box; }
                body {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                    background: #1e1e24; color: #f5f5f6; padding: 12px; margin: 0;
                }
                h3 {
                    margin: 0 0 12px 0;
                    color: #4dadff;
                    border-bottom: 1px solid #3a3a44;
                    padding-bottom: 8px;
                }
                .section {
                    background: #2a2a35;
                    padding: 10px 12px;
                    border-radius: 6px;
                    margin-bottom: 12px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.2);
                }
                .section-title {
                    font-size: 12px;
                    color: #aaa;
                    font-weight: bold;
                    display: block;
                    margin-bottom: 6px;
                }
                button {
                    padding: 6px 12px;
                    background: #4dadff;
                    color: #1e1e24;
                    border: none;
                    border-radius: 4px;
                    font-weight: bold;
                    font-size: 12px;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                button:hover { background: #3596e6; }
                button.danger { background: #e74c3c; color: #fff; }
                button.danger:hover { background: #c0392b; }
                button.secondary { background: #3a3a44; color: #eee; }
                button.secondary:hover { background: #4a4a55; }
                .flex-row { display: flex; gap: 12px; flex-wrap: wrap; }
                .col-left { flex: 7; min-width: 300px; }
                .col-right { flex: 3; min-width: 150px; }

                /* --- Table / Matrix --- */
                .search-wrapper { margin-bottom: 8px; display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
                .search-bar {
                    flex: 1;
                    padding: 4px 8px;
                    background: #111;
                    border: 1px solid #4dadff;
                    color: #fff;
                    border-radius: 4px;
                    font-size: 12px;
                    font-family: monospace;
                    min-width: 150px;
                }
                .search-bar:focus { outline: none; box-shadow: 0 0 5px rgba(77,173,255,0.5); }
                .strict-check {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    color: #aaa;
                    font-size: 11px;
                    cursor: pointer;
                }
                .strict-check input { cursor: pointer; }
                .matrix-container {
                    background: #111;
                    max-height: 380px;
                    overflow-y: auto;
                    border: 1px solid #444;
                    border-radius: 4px;
                    padding: 2px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    font-family: monospace;
                    font-size: 11px;
                }
                th {
                    background: #222;
                    color: #4dadff;
                    text-align: left;
                    padding: 4px 6px;
                    font-size: 10px;
                    border-bottom: 2px solid #333;
                    position: sticky;
                    top: 0;
                    z-index: 2;
                }
                td {
                    padding: 4px 6px;
                    border-bottom: 1px solid #222;
                    vertical-align: middle;
                    word-break: break-all;
                }
                tr { display: none; }
                tr.visible-track { display: table-row; }
                tr.hidden-row { display: none; }
                tr:hover { background: #1a1a24; }
                .live-val { color: #2ecc71; font-weight: bold; }
                .matrix-input {
                    width: 70px;
                    background: #222;
                    border: 1px solid #555;
                    color: #fff;
                    padding: 2px 4px;
                    border-radius: 3px;
                    font-family: monospace;
                    text-align: center;
                    font-size: 11px;
                }
                .matrix-input:focus { border-color: #4dadff; outline: none; }
                .freeze-cb { width: 14px; height: 14px; cursor: pointer; margin: 0; vertical-align: middle; }
                .changed-flash { animation: flash-green 0.5s ease-out; }
                @keyframes flash-green {
                    0% { background-color: rgba(46, 204, 113, 0.4); }
                    100% { background-color: transparent; }
                }
                .source-tag {
                    font-size: 8px;
                    background: #444;
                    color: #eee;
                    padding: 1px 4px;
                    border-radius: 3px;
                    margin-left: 5px;
                    text-transform: uppercase;
                }
                .nickname-btn {
                    font-size: 9px;
                    color: #4dadff;
                    cursor: pointer;
                    margin-left: 6px;
                    text-decoration: underline;
                }
                .nickname-btn:hover { color: #fff; }
                .nickname-display { color: #ffb347; font-style: italic; font-weight: bold; }
                .orig-label-sub {
                    font-size: 9px;
                    color: #888;
                    display: block;
                    margin-top: 2px;
                }
                .fav-star {
                    cursor: pointer;
                    font-size: 14px;
                    display: inline-block;
                    margin-right: 4px;
                    color: #ffb347;
                    user-select: none;
                }
                .fav-star:hover { transform: scale(1.1); }

                /* --- Group rows --- */
                .group-row {
                    cursor: pointer;
                    user-select: none;
                    background: #1a1a2a;
                }
                .group-row td {
                    font-weight: bold;
                    color: #4dadff;
                    border-top: 1px solid #3a3a44;
                    border-bottom: 1px solid #3a3a44;
                    padding: 4px 12px;
                    font-size: 12px;
                }
                .group-row:hover { background: #22223b; }
                .group-icon { font-size: 12px; margin-right: 8px; }
                .group-count { color: #aaa; font-weight: normal; margin-left: 8px; font-size: 10px; }
                .group-indent { display: inline-block; }

                /* --- Log box --- */
                .log-box {
                    background: #111;
                    height: 100%;
                    min-height: 200px;
                    max-height: 380px;
                    overflow-y: auto;
                    font-family: monospace;
                    font-size: 11px;
                    padding: 6px 8px;
                    border-radius: 4px;
                    border: 1px solid #333;
                    color: #00ff66;
                    white-space: pre-wrap;
                    word-break: break-all;
                }
                .log-box::-webkit-scrollbar { width: 4px; }
                .log-box::-webkit-scrollbar-thumb { background: #4dadff; border-radius: 2px; }

                /* --- Favorites --- */
                .favorites-container {
                    margin-top: 10px;
                    border-top: 1px solid #3a3a44;
                    padding-top: 10px;
                }
                .favorites-container h4 {
                    margin: 0 0 6px 0;
                    color: #4dadff;
                    font-size: 13px;
                }
                .fav-matrix {
                    max-height: 200px;
                    overflow-y: auto;
                }

                /* ---- Live tracking toggle ---- */
                .pause-check {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    color: #aaa;
                    font-size: 11px;
                    cursor: pointer;
                    margin-top: 4px;
                }
                .pause-check input { cursor: pointer; }
            </style>
        </head>
        <body>
            <h3>Smart Universal Memory Matrix</h3>

            <div class="flex-row">
                <div class="col-left">
                    <div class="section" style="border: 1px solid #4dadff; padding-bottom: 10px;">
                        <label class="section-title" style="color: #4dadff;">Active Live Variables (Hiding Null/Undefined)</label>
                        <div style="display: flex; gap: 6px; margin-bottom: 8px; flex-wrap: wrap;">
                            <button id="btnLoadMatrix" class="danger" style="flex:1;">Deep Scan All Engines & Bind Monitor</button>
                            <button id="btnCollapseAll" class="secondary" style="flex:0;">Collapse All</button>
                            <button id="btnExpandAll" class="secondary" style="flex:0;">Expand All</button>
                        </div>
                        <div class="search-wrapper">
                            <input type="text" id="matrixSearch" class="search-bar" placeholder="🔍 Filter rows by path, label, or value...">
                            <label class="strict-check">
                                <input type="checkbox" id="strictSearch"> Exact match
                            </label>
                        </div>
                        <div class="matrix-container" id="matrixContainer">
                            <table id="matrixTable">
                                <thead>
                                    <tr>
                                        <th width="5%">★</th>
                                        <th width="35%">Property</th>
                                        <th width="20%">Live Value</th>
                                        <th width="20%">Override</th>
                                        <th width="20%" style="text-align:center;">Freeze</th>
                                    </tr>
                                </thead>
                                <tbody id="matrixBody">
                                    <tr><td colspan="5" style="color:#666; text-align:center; padding:20px;">Click the button above to run a combined deep context scan.</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div class="col-right">
                    <div class="section" style="height: 100%; display: flex; flex-direction: column;">
                        <label class="section-title">Console Activity</label>
                        <div class="log-box" id="logBox">Universal bridge initialized. Standing by...</div>
                        <!-- Pause Live Tracking Checkbox -->
                        <div style="margin-top: 6px; text-align: right;">
                            <label class="pause-check">
                                <input type="checkbox" id="pauseLiveTracking"> ⏸ Pause Live Tracking
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            <div class="favorites-container">
                <h4>⭐ Favorites (pinned below)</h4>
                <div class="fav-matrix matrix-container">
                    <table id="favoritesTable">
                        <thead>
                            <tr>
                                <th width="5%">★</th>
                                <th width="35%">Property</th>
                                <th width="20%">Live Value</th>
                                <th width="20%">Override</th>
                                <th width="20%" style="text-align:center;">Freeze</th>
                            </tr>
                        </thead>
                        <tbody id="favoritesBody">
                            <tr><td colspan="5" style="color:#666; text-align:center; padding:10px;">No favorites yet. Click ★ on any variable to add it.</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div id="experimental-anchor"></div>

            <script>
                const gameWindow = window.opener;
                let freezeRules = {};
                let monitoredVariables = {};
                let collapsedGroups = {};
                let currentSearchQuery = "";
                let strictSearch = false;
                let autoScanDone = false;
                let autoScanTimer = null;
                let rebuilding = false;
                let scanPerformed = false;
                let liveTrackingPaused = false;

                // ---- Performance: intervals ----
                let freezeInterval = null;
                let favoriteInterval = null;

                // ---- Friendly name mappings ----
                const friendlyNames = {
                    '$gameParty': 'Party',
                    '$gameActors': 'Actors',
                    '$gameVariables': 'Variables',
                    '$gameSwitches': 'Switches',
                    '$gamePlayer': 'Player',
                    '$gameMap': 'Map',
                    '$gameScreen': 'Screen',
                    '$gameTemp': 'Temp',
                    '$gameMessage': 'Message',
                    '$gameTroop': 'Troop',
                    '$gameBattle': 'Battle',
                    '$gameSystem': 'System',
                    '$gameTimers': 'Timers',
                    '$gameSelfSwitches': 'SelfSwitches',
                    'rmVar': 'Variables',
                    'switch': 'Switches',
                    'twine': 'Twine'
                };

                function getFriendlyName(segment) {
                    return friendlyNames[segment] || segment;
                }

                function log(msg) {
                    const box = document.getElementById('logBox');
                    const timestamp = new Date().toLocaleTimeString();
                    box.innerHTML += '\\n> [' + timestamp + '] ' + msg;
                    box.scrollTop = box.scrollHeight;
                }

                function updateScanButton() {
                    const btn = document.getElementById('btnLoadMatrix');
                    if (!btn) return;
                    if (scanPerformed) {
                        btn.textContent = '🔄 Rescan Manually';
                        btn.className = 'secondary';
                        btn.style.background = '#4dadff';
                        btn.style.color = '#1e1e24';
                    } else {
                        btn.textContent = 'Deep Scan All Engines & Bind Monitor';
                        btn.className = 'danger';
                        btn.style.background = '';
                        btn.style.color = '';
                    }
                }

                // ---- Build tree ----
                function buildTree(entries) {
                    const root = { children: {}, leafEntries: [] };
                    for (let entry of entries) {
                        const segments = entry.id.split('.');
                        let node = root;
                        let fullPath = '';
                        for (let i = 0; i < segments.length; i++) {
                            let seg = segments[i];
                            fullPath += (fullPath ? '.' : '') + seg;
                            if (!node.children[seg]) {
                                node.children[seg] = { name: seg, children: {}, leafEntries: [], fullPath: fullPath };
                            }
                            node = node.children[seg];
                        }
                        node.leafEntries.push(entry);
                        entry._fullPath = fullPath;
                    }
                    return root;
                }

                function renderTree(node, depth, parentPath) {
                    const frag = document.createDocumentFragment();
                    const keys = Object.keys(node.children).sort();
                    for (let key of keys) {
                        const child = node.children[key];
                        const path = parentPath ? parentPath + '.' + key : key;
                        const hasLeaves = child.leafEntries.length > 0 || Object.keys(child.children).some(k => {
                            const sub = child.children[k];
                            return sub.leafEntries.length > 0 || Object.keys(sub.children).length > 0;
                        });
                        if (!hasLeaves) continue;

                        const isCollapsed = collapsedGroups[path] !== undefined ? collapsedGroups[path] : true;
                        const arrowIcon = isCollapsed ? '▶' : '▼';
                        const indent = depth * 20;
                        const displayName = getFriendlyName(key);

                        const groupRow = document.createElement('tr');
                        groupRow.className = 'group-row visible-track';
                        groupRow.setAttribute('data-group-path', path);
                        groupRow.setAttribute('data-full-path', path);
                        groupRow.innerHTML = '<td colspan="5">' +
                            '<span class="group-indent" style="width:' + indent + 'px;"></span>' +
                            '<span class="group-icon">📁</span> ' + displayName +
                            ' <span class="group-count">(' + countLeaves(child) + ')</span>' +
                            ' <span style="float:right" class="arrow-icon">' + arrowIcon + '</span></td>';
                        groupRow.addEventListener('click', function(e) {
                            e.stopPropagation();
                            toggleGroup(path);
                        });
                        frag.appendChild(groupRow);

                        // Leaves
                        for (let entry of child.leafEntries) {
                            const row = createRow(entry.id, entry.item, entry.currentLiveValue, false);
                            row.setAttribute('data-parent-path', path);
                            row.setAttribute('data-full-path', entry.id);
                            const firstCell = row.querySelector('td');
                            if (firstCell) {
                                const indentSpan = document.createElement('span');
                                indentSpan.className = 'group-indent';
                                indentSpan.style.width = (indent + 20) + 'px';
                                firstCell.prepend(indentSpan);
                            }
                            if (isCollapsed) row.classList.add('hidden-row');
                            frag.appendChild(row);
                        }

                        // Children
                        if (Object.keys(child.children).length > 0) {
                            const childFrag = renderTree(child, depth + 1, path);
                            const allRows = childFrag.querySelectorAll('tr');
                            allRows.forEach(tr => {
                                if (!tr.hasAttribute('data-parent-path')) {
                                    tr.setAttribute('data-parent-path', path);
                                }
                            });
                            frag.appendChild(childFrag);
                        }
                    }
                    return frag;
                }

                function countLeaves(node) {
                    let count = node.leafEntries.length;
                    for (let key in node.children) {
                        count += countLeaves(node.children[key]);
                    }
                    return count;
                }

                function toggleGroup(path) {
                    if (currentSearchQuery !== "") return;
                    collapsedGroups[path] = !collapsedGroups[path];
                    const isCollapsed = collapsedGroups[path];
                    const allRows = document.querySelectorAll('#matrixBody tr');
                    allRows.forEach(row => {
                        const parentPath = row.getAttribute('data-parent-path');
                        const groupPath = row.getAttribute('data-group-path');
                        let isDescendant = false;
                        if (parentPath) {
                            if (parentPath === path || parentPath.startsWith(path + '.')) {
                                isDescendant = true;
                            }
                        }
                        if (groupPath) {
                            if (groupPath.startsWith(path + '.')) {
                                isDescendant = true;
                            }
                        }
                        if (isDescendant) {
                            if (isCollapsed) row.classList.add('hidden-row');
                            else row.classList.remove('hidden-row');
                        }
                    });
                    // Update arrow
                    const groupRow = document.querySelector('#matrixBody tr[data-group-path="' + path + '"]');
                    if (groupRow) {
                        const arrowSpan = groupRow.querySelector('.arrow-icon');
                        if (arrowSpan) arrowSpan.textContent = isCollapsed ? '▶' : '▼';
                    }
                }

                function collapseAll() {
                    for (let key in collapsedGroups) collapsedGroups[key] = true;
                    applyCollapseState();
                }

                function expandAll() {
                    for (let key in collapsedGroups) collapsedGroups[key] = false;
                    applyCollapseState();
                }

                function applyCollapseState() {
                    const allRows = document.querySelectorAll('#matrixBody tr');
                    allRows.forEach(row => {
                        const parentPath = row.getAttribute('data-parent-path');
                        const groupPath = row.getAttribute('data-group-path');
                        let hidden = false;
                        let current = parentPath || groupPath;
                        while (current) {
                            if (collapsedGroups[current] === true) {
                                hidden = true;
                                break;
                            }
                            const lastDot = current.lastIndexOf('.');
                            if (lastDot === -1) break;
                            current = current.substring(0, lastDot);
                        }
                        if (hidden) row.classList.add('hidden-row');
                        else row.classList.remove('hidden-row');
                    });
                    // Update arrows
                    document.querySelectorAll('#matrixBody .group-row').forEach(row => {
                        const path = row.getAttribute('data-group-path');
                        if (path) {
                            const isCollapsed = collapsedGroups[path] !== undefined ? collapsedGroups[path] : true;
                            const arrowSpan = row.querySelector('.arrow-icon');
                            if (arrowSpan) arrowSpan.textContent = isCollapsed ? '▶' : '▼';
                        }
                    });
                }

                function buildMatrixUI() {
                    if (rebuilding) return;
                    rebuilding = true;
                    try {
                        const allTbody = document.getElementById('matrixBody');
                        const favTbody = document.getElementById('favoritesBody');
                        if (!allTbody || !favTbody) {
                            log('UI elements not found');
                            rebuilding = false;
                            return;
                        }

                        allTbody.innerHTML = '';
                        favTbody.innerHTML = '';

                        let visibleEntries = [], favEntries = [];
                        for (let id in monitoredVariables) {
                            const item = monitoredVariables[id];
                            if (!item.everHadValue) continue;
                            const currentLiveValue = item.obj[item.key];
                            const entry = { id, item, currentLiveValue };
                            const displayStr = String(currentLiveValue !== undefined ? currentLiveValue : '').toLowerCase();
                            const nickLower = (item.nickname || '').toLowerCase();
                            let matches = true;
                            if (currentSearchQuery !== '') {
                                if (strictSearch) {
                                    const labelMatch = item.label.toLowerCase() === currentSearchQuery;
                                    const valMatch = displayStr === currentSearchQuery;
                                    const nickMatch = nickLower === currentSearchQuery;
                                    matches = labelMatch || valMatch || nickMatch;
                                } else {
                                    matches = item.label.toLowerCase().includes(currentSearchQuery) ||
                                               displayStr.includes(currentSearchQuery) ||
                                               nickLower.includes(currentSearchQuery);
                                }
                            }
                            if (matches) {
                                if (item.isFavorite) favEntries.push(entry);
                                else visibleEntries.push(entry);
                            }
                        }

                        if (currentSearchQuery !== '') {
                            const root = buildTree(visibleEntries);
                            const frag = renderTree(root, 0, '');
                            allTbody.appendChild(frag);
                            document.querySelectorAll('#matrixBody .group-row').forEach(row => {
                                const path = row.getAttribute('data-group-path');
                                if (path) {
                                    collapsedGroups[path] = false;
                                    const arrow = row.querySelector('.arrow-icon');
                                    if (arrow) arrow.textContent = '▼';
                                }
                            });
                        } else {
                            const root = buildTree(visibleEntries);
                            const frag = renderTree(root, 0, '');
                            allTbody.appendChild(frag);
                            applyCollapseState();
                        }

                        favEntries.sort((a,b) => a.item.label.localeCompare(b.item.label));
                        if (favEntries.length === 0) {
                            favTbody.innerHTML = '<tr><td colspan="5" style="color:#666; text-align:center; padding:10px;">No favorites yet. Click ★ on any variable to add it.</td></tr>';
                        } else {
                            for (let entry of favEntries) {
                                favTbody.appendChild(createRow(entry.id, entry.item, entry.currentLiveValue, true));
                            }
                        }

                        attachRowEvents();
                        log('UI built with ' + visibleEntries.length + ' visible entries');
                    } catch(e) {
                        log('Build error: ' + e.message);
                    } finally {
                        rebuilding = false;
                    }
                }

                function createRow(id, item, currentLiveValue, isFavSection) {
                    const tr = document.createElement('tr');
                    tr.id = (isFavSection ? 'fav-row-' : 'matrix-row-') + id;
                    tr.className = 'visible-track';

                    const displayVal = currentLiveValue !== undefined ? currentLiveValue : 'null';
                    const savedInput = freezeRules[id] ? freezeRules[id].target : (displayVal !== 'null' ? displayVal : 0);
                    const isChecked = freezeRules[id] && freezeRules[id].active ? 'checked' : '';
                    const isFav = item.isFavorite ? true : false;

                    let labelContent = '';
                    if (isFavSection && item.nickname) {
                        labelContent = '<span class="nickname-display">🏷️ ' + escapeHtml(item.nickname) + '</span><span class="orig-label-sub">Path: ' + escapeHtml(item.label) + '</span>';
                    } else if (!isFavSection && item.nickname) {
                        labelContent = '<span class="nickname-display">[ ' + escapeHtml(item.nickname) + ' ] </span><strong>' + escapeHtml(item.label) + '</strong>';
                    } else {
                        labelContent = '<strong>' + escapeHtml(item.label) + '</strong>';
                    }

                    const renameLinkHTML = isFavSection ? '<span class="nickname-btn" data-id="' + id + '">✏️ Rename</span>' : '';

                    tr.innerHTML = '\
                        <td style="text-align:center;"><span class="fav-star" data-id="' + id + '" style="cursor:pointer; font-size:16px;">' + (isFav ? '★' : '☆') + '</span></td>\
                        <td>' + labelContent + renameLinkHTML + '<span class="source-tag">' + item.src + '</span></td>\
                        <td class="live-val" id="live-val-' + id + '">' + escapeHtml(String(displayVal)) + '</td>\
                        <td><input type="text" class="matrix-input" id="input-' + id + '" value="' + escapeHtml(String(savedInput)) + '"></td>\
                        <td style="text-align:center;"><input type="checkbox" class="freeze-cb" id="cb-' + id + '" ' + isChecked + '></td>\
                    ';
                    return tr;
                }

                function escapeHtml(str) {
                    if (str === undefined || str === null) return '';
                    return String(str).replace(/[&<>]/g, function(m) {
                        if (m === '&') return '&amp;';
                        if (m === '<') return '&lt;';
                        if (m === '>') return '&gt;';
                        return m;
                    });
                }

                function attachRowEvents() {
                    document.querySelectorAll('.fav-star').forEach(star => {
                        star.removeEventListener('click', star._handler);
                        const handler = (e) => {
                            e.stopPropagation();
                            const id = star.getAttribute('data-id');
                            if (id) toggleFavorite(id);
                        };
                        star.addEventListener('click', handler);
                        star._handler = handler;
                    });

                    document.querySelectorAll('.nickname-btn').forEach(lnk => {
                        lnk.onclick = (e) => {
                            e.stopPropagation();
                            const id = lnk.getAttribute('data-id');
                            if (id) promptRename(id);
                        };
                    });

                    for (let id in monitoredVariables) {
                        const input = document.getElementById('input-' + id);
                        const cb = document.getElementById('cb-' + id);
                        if (input && cb) {
                            input.removeEventListener('input', input._inputHandler);
                            input.removeEventListener('blur', input._blurHandler);
                            cb.removeEventListener('change', cb._changeHandler);

                            const inputHandler = () => {
                                let targetVal = input.value;
                                if (!isNaN(targetVal) && targetVal.trim() !== '') {
                                    targetVal = Number(targetVal);
                                }
                                if (freezeRules[id]) {
                                    freezeRules[id].target = targetVal;
                                } else {
                                    freezeRules[id] = { target: targetVal, active: false };
                                }
                            };

                            const blurHandler = () => {
                                let newVal = input.value;
                                if (!isNaN(newVal) && newVal.trim() !== '') {
                                    newVal = Number(newVal);
                                }
                                const item = monitoredVariables[id];
                                if (item && item.obj && item.key !== undefined) {
                                    item.obj[item.key] = newVal;
                                    const liveCell = document.getElementById('live-val-' + id);
                                    if (liveCell) liveCell.innerText = newVal;
                                    log('Set ' + (item.nickname || item.label) + ' to ' + newVal);
                                }
                                if (freezeRules[id]) {
                                    freezeRules[id].target = newVal;
                                } else {
                                    freezeRules[id] = { target: newVal, active: false };
                                }
                            };

                            const changeHandler = () => {
                                let targetVal = input.value;
                                if (!isNaN(targetVal) && targetVal.trim() !== '') {
                                    targetVal = Number(targetVal);
                                }
                                const shouldFreeze = cb.checked;
                                freezeRules[id] = { target: targetVal, active: shouldFreeze };
                                if (shouldFreeze) {
                                    const item = monitoredVariables[id];
                                    if (item && item.obj && item.key !== undefined) {
                                        item.obj[item.key] = targetVal;
                                        const liveCell = document.getElementById('live-val-' + id);
                                        if (liveCell) liveCell.innerText = targetVal;
                                    }
                                }
                            };

                            input.addEventListener('input', inputHandler);
                            input.addEventListener('blur', blurHandler);
                            cb.addEventListener('change', changeHandler);

                            input._inputHandler = inputHandler;
                            input._blurHandler = blurHandler;
                            cb._changeHandler = changeHandler;
                        }
                    }
                }

                function toggleFavorite(varId) {
                    log('TOGGLE FAVORITE: ' + varId);
                    if (!monitoredVariables[varId]) return;
                    const item = monitoredVariables[varId];
                    item.isFavorite = !item.isFavorite;
                    if (!item.isFavorite) {
                        item.nickname = '';
                    }

                    if (currentSearchQuery !== '') {
                        buildMatrixUI();
                        return;
                    }

                    let row = document.getElementById('matrix-row-' + varId);
                    if (!row) row = document.getElementById('fav-row-' + varId);
                    if (!row) {
                        buildMatrixUI();
                        return;
                    }

                    const starSpan = row.querySelector('.fav-star');
                    if (starSpan) starSpan.textContent = item.isFavorite ? '★' : '☆';
                    row.id = item.isFavorite ? 'fav-row-' + varId : 'matrix-row-' + varId;

                    const targetTbody = item.isFavorite ?
                        document.getElementById('favoritesBody') :
                        document.getElementById('matrixBody');
                    if (!targetTbody) return;

                    const parent = row.parentNode;
                    if (parent) parent.removeChild(row);

                    const rows = targetTbody.querySelectorAll('tr');
                    let inserted = false;
                    for (let r of rows) {
                        const rId = r.id && r.id.replace(/(matrix-row-|fav-row-)/, '');
                        if (rId && monitoredVariables[rId]) {
                            if (monitoredVariables[rId].label > item.label) {
                                targetTbody.insertBefore(row, r);
                                inserted = true;
                                break;
                            }
                        }
                    }
                    if (!inserted) targetTbody.appendChild(row);

                    if (!item.isFavorite) {
                        const groupKey = getGroupKey(varId);
                        row.setAttribute('data-parent-path', groupKey);
                        row.setAttribute('data-full-path', varId);
                        applyCollapseState();
                    } else {
                        row.classList.remove('hidden-row');
                    }

                    startIntervals();
                }

                function getGroupKey(path) {
                    const parts = path.split('.');
                    return parts[0] || 'Other';
                }

                function promptRename(varId) {
                    const item = monitoredVariables[varId];
                    if (!item) return;
                    const currentNickname = item.nickname || '';
                    const newNickname = prompt('Enter custom identification nickname for "' + item.label + '":', currentNickname);
                    if (newNickname !== null) {
                        item.nickname = newNickname.trim();
                        log('Assigned nickname to ' + item.label + ' -> "' + item.nickname + '"');
                        buildMatrixUI();
                    }
                }

                // ---- Smart intervals with pause support ----
                // FIX: Intervals now run unconditionally (except when paused) to support freeze on demand
                function startIntervals() {
                    if (freezeInterval) clearInterval(freezeInterval);
                    if (favoriteInterval) clearInterval(favoriteInterval);

                    if (liveTrackingPaused) {
                        log('Live tracking paused – intervals not started.');
                        return;
                    }

                    // Freeze interval: always run (so freeze checkboxes work immediately)
                    freezeInterval = setInterval(() => {
                        for (let id in freezeRules) {
                            const rule = freezeRules[id];
                            if (rule && rule.active) {
                                const item = monitoredVariables[id];
                                if (item && item.obj && item.key !== undefined) {
                                    const current = item.obj[item.key];
                                    if (current !== rule.target) {
                                        item.obj[item.key] = rule.target;
                                        const cell = document.getElementById('live-val-' + id);
                                        if (cell) cell.innerText = rule.target;
                                        const input = document.getElementById('input-' + id);
                                        if (input && input.value != rule.target) input.value = rule.target;
                                    }
                                }
                            }
                        }
                    }, 1000);
                    log('Freeze interval started.');

                    // Favorites interval: also always run (to keep favorite values fresh)
                    favoriteInterval = setInterval(() => {
                        for (let id in monitoredVariables) {
                            const item = monitoredVariables[id];
                            if (item && item.isFavorite) {
                                const cell = document.getElementById('live-val-' + id);
                                if (!cell) continue;
                                let actualLiveValue;
                                try { actualLiveValue = item.obj[item.key]; } catch(e) { continue; }
                                if (cell.innerText != String(actualLiveValue)) {
                                    cell.innerText = actualLiveValue;
                                    const input = document.getElementById('input-' + id);
                                    if (input && document.activeElement !== input) {
                                        input.value = actualLiveValue;
                                        if (freezeRules[id] && !freezeRules[id].active) {
                                            freezeRules[id].target = actualLiveValue;
                                        }
                                    }
                                }
                            }
                        }
                    }, 2000);
                    log('Favorites interval started.');
                }

                // ---- Toggle live tracking ----
                function toggleLiveTracking(checked) {
                    liveTrackingPaused = checked;
                    if (liveTrackingPaused) {
                        log('⏸ Live tracking paused.');
                    } else {
                        log('▶️ Live tracking resumed.');
                    }
                    startIntervals();
                }

                // ---- Deep Scan ----
                function performDeepScan() {
                    log('DEEP SCAN START');
                    try {
                        const pooledVariables = harvestAllPossibleVariables();
                        if (Object.keys(pooledVariables).length === 0) {
                            log('❌ No engine objects detected. Make sure the game is unpaused!');
                            return false;
                        }

                        log('🔍 Discovered ' + Object.keys(pooledVariables).length + ' memory tracks. Syncing...');

                        for (let id in pooledVariables) {
                            if (monitoredVariables[id]) {
                                pooledVariables[id].isFavorite = monitoredVariables[id].isFavorite || false;
                                pooledVariables[id].everHadValue = monitoredVariables[id].everHadValue || false;
                                pooledVariables[id].nickname = monitoredVariables[id].nickname || '';
                            } else {
                                pooledVariables[id].isFavorite = false;
                                const val = pooledVariables[id].obj[pooledVariables[id].key];
                                pooledVariables[id].everHadValue = (typeof val === 'number' && !isNaN(val));
                                pooledVariables[id].nickname = '';
                            }
                        }
                        monitoredVariables = pooledVariables;
                        buildMatrixUI();
                        startIntervals();

                        log('✅ Deep scan complete. Monitor is live.');

                        scanPerformed = true;
                        updateScanButton();

                        return true;
                    } catch(e) {
                        log('❌ Scan Error: ' + e.message);
                        return false;
                    }
                }

                // ---- Harvest function ----
                function harvestAllPossibleVariables() {
                    var targets = {};
                    var visited = new WeakSet();
                    var MAX_DEPTH = 4;
                    var MAX_ARRAY = 1000;

                    function walkObject(obj, path, label, depth, src) {
                        if (!obj || typeof obj !== 'object' || depth > MAX_DEPTH) return;
                        if (visited.has(obj)) return;
                        visited.add(obj);

                        var isRPGMVars = (path === '$gameVariables' && obj._data);
                        var isRPGSwitches = (path === '$gameSwitches' && obj._data);

                        for (var key in obj) {
                            try {
                                var val = obj[key];
                                var newPath = path ? path + '.' + key : key;
                                var newLabel = label ? label + '.' + key : key;
                                var newSrc = src || path;

                                if (isRPGMVars && key === '_data' && Array.isArray(val)) {
                                    for (var i = 1; i < Math.min(val.length, MAX_ARRAY); i++) {
                                        var elem = val[i];
                                        if (typeof elem === 'number' && !isNaN(elem)) {
                                            targets['rmVar.' + i] = { obj: val, key: i, label: 'Variable #' + i, src: 'rm-var' };
                                        } else if (elem && typeof elem === 'object') {
                                            walkObject(elem, 'rmVar.' + i, 'Variable #' + i, depth + 1, 'rm-var');
                                        }
                                    }
                                    continue;
                                }

                                if (isRPGSwitches && key === '_data' && Array.isArray(val)) {
                                    for (var j = 1; j < Math.min(val.length, MAX_ARRAY); j++) {
                                        var elem2 = val[j];
                                        if (typeof elem2 === 'number' && !isNaN(elem2)) {
                                            targets['switch.' + j] = { obj: val, key: j, label: 'Switch #' + j, src: 'switch' };
                                        } else if (elem2 && typeof elem2 === 'object') {
                                            walkObject(elem2, 'switch.' + j, 'Switch #' + j, depth + 1, 'switch');
                                        }
                                    }
                                    continue;
                                }

                                if (typeof val === 'number' && !isNaN(val)) {
                                    var friendlyLabel = newLabel;
                                    if (path === '$gameParty' && key === '_gold') friendlyLabel = 'Gold';
                                    else if (path === '$gameParty' && key === '_steps') friendlyLabel = 'Steps';
                                    else if (path === '$gamePlayer' && key === '_x') friendlyLabel = 'Player X';
                                    else if (path === '$gamePlayer' && key === '_y') friendlyLabel = 'Player Y';
                                    else if (path === '$gamePlayer' && key === '_direction') friendlyLabel = 'Player Dir';
                                    else if (path === '$gameMap' && key === '_mapId') friendlyLabel = 'Map ID';
                                    else if (key.startsWith('_')) friendlyLabel = key.substring(1);
                                    else friendlyLabel = key;

                                    var id = (path ? path + '.' : '') + key;
                                    targets[id] = { obj: obj, key: key, label: friendlyLabel, src: newSrc || 'object' };
                                } else if (val && typeof val === 'object') {
                                    if (Array.isArray(val)) {
                                        for (var k = 0; k < Math.min(val.length, MAX_ARRAY); k++) {
                                            var elem3 = val[k];
                                            var arrPath = newPath + '[' + k + ']';
                                            var arrLabel = newLabel + '[' + k + ']';
                                            if (typeof elem3 === 'number' && !isNaN(elem3)) {
                                                targets[arrPath] = { obj: val, key: k, label: arrLabel, src: newSrc || 'array' };
                                            } else if (elem3 && typeof elem3 === 'object') {
                                                walkObject(elem3, arrPath, arrLabel, depth + 1, newSrc);
                                            }
                                        }
                                    } else {
                                        walkObject(val, newPath, newLabel, depth + 1, newSrc);
                                    }
                                }
                            } catch(e) {}
                        }
                    }

                    var roots = [
                        { obj: gameWindow.$gameParty, name: '$gameParty', src: 'party' },
                        { obj: gameWindow.$gameActors, name: '$gameActors', src: 'actor' },
                        { obj: gameWindow.$gameVariables, name: '$gameVariables', src: 'rm-var' },
                        { obj: gameWindow.$gameSwitches, name: '$gameSwitches', src: 'switch' },
                        { obj: gameWindow.$gamePlayer, name: '$gamePlayer', src: 'player' },
                        { obj: gameWindow.$gameMap, name: '$gameMap', src: 'map' },
                        { obj: gameWindow.$gameScreen, name: '$gameScreen', src: 'screen' },
                        { obj: gameWindow.$gameTemp, name: '$gameTemp', src: 'temp' },
                        { obj: gameWindow.$gameMessage, name: '$gameMessage', src: 'message' },
                        { obj: gameWindow.$gameTroop, name: '$gameTroop', src: 'troop' },
                        { obj: gameWindow.$gameBattle, name: '$gameBattle', src: 'battle' },
                        { obj: gameWindow.$gameSystem, name: '$gameSystem', src: 'system' },
                        { obj: gameWindow.$gameTimers, name: '$gameTimers', src: 'timer' },
                        { obj: gameWindow.$gameSelfSwitches, name: '$gameSelfSwitches', src: 'selfswitch' }
                    ];

                    for (var r = 0; r < roots.length; r++) {
                        if (roots[r].obj) {
                            walkObject(roots[r].obj, roots[r].name, roots[r].name, 0, roots[r].src);
                        }
                    }

                    // Twine / SugarCube
                    var twineObj = null;
                    if (gameWindow.State && gameWindow.State.variables) twineObj = gameWindow.State.variables;
                    else if (gameWindow.SugarCube && gameWindow.SugarCube.State) twineObj = gameWindow.SugarCube.State.variables;
                    else if (gameWindow.variables) twineObj = gameWindow.variables;
                    if (twineObj) {
                        for (var k in twineObj) {
                            if (typeof twineObj[k] !== 'function') {
                                targets["twine." + k] = { obj: twineObj, key: k, label: k, src: "twine" };
                                if (twineObj[k] && typeof twineObj[k] === 'object') {
                                    for (var subK in twineObj[k]) {
                                        if (typeof twineObj[k][subK] !== 'object' && typeof twineObj[k][subK] !== 'function') {
                                            targets["twine." + k + "." + subK] = { obj: twineObj[k], key: subK, label: k + "." + subK, src: "sub-obj" };
                                        }
                                    }
                                }
                            }
                        }
                    }

                    return targets;
                }

                // ---- Search and strict mode ----
                document.getElementById('matrixSearch').addEventListener('input', (e) => {
                    currentSearchQuery = e.target.value.toLowerCase().trim();
                    buildMatrixUI();
                });

                document.getElementById('strictSearch').addEventListener('change', (e) => {
                    strictSearch = e.target.checked;
                    buildMatrixUI();
                });

                // ---- Live tracking checkbox ----
                document.getElementById('pauseLiveTracking').addEventListener('change', (e) => {
                    toggleLiveTracking(e.target.checked);
                });

                // ---- Buttons ----
                document.getElementById('btnLoadMatrix').addEventListener('click', () => {
                    autoScanDone = true;
                    if (autoScanTimer) clearInterval(autoScanTimer);
                    performDeepScan();
                });

                document.getElementById('btnCollapseAll').addEventListener('click', collapseAll);
                document.getElementById('btnExpandAll').addEventListener('click', expandAll);

                // ---- Auto-scan with immediate interval clear ----
                function autoDetectGameLoad() {
                    if (autoScanDone) return;
                    try {
                        const scene = gameWindow.SceneManager && gameWindow.SceneManager._scene;
                        const isMapScene = scene && scene.constructor && scene.constructor.name === 'Scene_Map';
                        const mapId = gameWindow.$gameMap && gameWindow.$gameMap._mapId;
                        if (isMapScene && mapId > 0) {
                            if (autoScanTimer) {
                                clearInterval(autoScanTimer);
                                autoScanTimer = null;
                                log('🚀 Auto-scan timer cleared. Game map detected.');
                            }
                            autoScanDone = true;
                            setTimeout(function() {
                                performDeepScan();
                            }, 100);
                        }
                    } catch(e) { /* ignore */ }
                }

                autoScanTimer = setInterval(autoDetectGameLoad, 3000);

                log('💡 Panel ready. Auto-scan will trigger when the game map loads.');
                log('   You can also click "Deep Scan" manually at any time.');

                updateScanButton();
                startIntervals();

                // ---- Ensure intervals are started if not paused ----
                if (!liveTrackingPaused) startIntervals();

            <\/script>
        </body>
        </html>
    `);
    scanWindow.document.close();
})();