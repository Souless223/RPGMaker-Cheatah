// MODULE: experimental.js

// =========================================================================
// SECTION 1: GLOBAL DECLARATIONS & SCOPE
// =========================================================================
(function() {
    console.log("%c[EXPERIMENTAL] Universal Module Active & Scanning...", "color:#ffb347; font-weight:bold;");

    const mainWin = typeof window.opener !== 'undefined' && window.opener !== null ? window.opener : window;
    const openWindows = new Set();
    let cheatExposed = false;
    let sandboxInjected = false; // prevent repeated injection

    // ---- Cached cheat window reference to avoid focus stealing ----
    let cachedCheatWindow = null;

    // Helper: check if a document is the cheat panel
    function isCheatPanel(doc) {
        return doc && doc.getElementById('matrixTable') !== null;
    }

    // Helper to get the cheat panel window (by its name) – now with caching
    function getCheatWindow() {
        // Return the cached window if it's still valid
        if (cachedCheatWindow && !cachedCheatWindow.closed) {
            return cachedCheatWindow;
        }

        // Otherwise, try to open or find the window by name
        try {
            const w = window.open('', 'GameCheatEngine');
            if (w && !w.closed && w.document && w.document.body) {
                cachedCheatWindow = w;
                return w;
            }
        } catch(e) {
            // ignore cross-origin or other errors
        }
        return null;
    }

    // ---- Ensure cheat panel exposes its variables (once) ----
    function ensureCheatPanelExposed(cheatWin) {
        if (!cheatWin || cheatExposed) return;
        if (cheatWin.monitoredVariables !== undefined) {
            cheatExposed = true;
            return;
        }

        try {
            const script = cheatWin.document.createElement('script');
            script.textContent = `
                (function() {
                    var checkInterval = setInterval(function() {
                        if (typeof buildMatrixUI === 'function') {
                            clearInterval(checkInterval);
                            var originalBuild = buildMatrixUI;
                            window.monitoredVariables = monitoredVariables;
                            window.buildMatrixUI = function() {
                                originalBuild.apply(this, arguments);
                                window.monitoredVariables = monitoredVariables;
                            };
                            buildMatrixUI = window.buildMatrixUI;
                            window.monitoredVariables = monitoredVariables;
                            console.log('[EXPERIMENTAL] Cheat panel variables exposed globally.');
                        }
                    }, 100);
                })();
            `;
            cheatWin.document.head.appendChild(script);
            cheatExposed = true;
        } catch(e) {
            console.warn('[EXPERIMENTAL] Could not inject expose script:', e);
        }
    }

    // ---- Helper: get monitoredVariables safely ----
    function getMonitoredVariables() {
        const cheatWin = getCheatWindow();
        if (!cheatWin) return null;
        ensureCheatPanelExposed(cheatWin);
        return cheatWin.monitoredVariables || null;
    }

    // ---- Helper: add variable to cheat panel favorites ----
    function addToFavorites(varId, nickname) {
        const cheatWin = getCheatWindow();
        if (!cheatWin || !cheatWin.monitoredVariables) return false;
        const vars = cheatWin.monitoredVariables;
        if (!vars[varId]) return false;
        vars[varId].isFavorite = true;
        if (nickname) vars[varId].nickname = nickname;
        if (typeof cheatWin.buildMatrixUI === 'function') {
            cheatWin.buildMatrixUI();
        }
        return true;
    }

    // ---- Helper: get variable value safely ----
    function getVarValue(item) {
        try {
            return item.obj[item.key];
        } catch (e) {
            return undefined;
        }
    }

    // ---- Advanced Scanner (Math Obfuscation) ----
    // (Linear, Power, Exponential, Inverse model fitting with R²)
    function linearFit(x, y) {
        const n = x.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        for (let i = 0; i < n; i++) {
            sumX += x[i];
            sumY += y[i];
            sumXY += x[i] * y[i];
            sumX2 += x[i] * x[i];
        }
        const denom = n * sumX2 - sumX * sumX;
        if (Math.abs(denom) < 1e-12) return null;
        const a = (n * sumXY - sumX * sumY) / denom;
        const b = (sumY - a * sumX) / n;
        const r2 = calcR2(x, y, (v) => a * v + b);
        return { type: 'linear', equation: a.toFixed(3) + ' * var + ' + b.toFixed(3), a, b, r2 };
    }

    function powerFit(x, y) {
        const n = x.length;
        let logX = [], logY = [];
        for (let i = 0; i < n; i++) {
            if (x[i] <= 0 || y[i] <= 0) return null;
            logX.push(Math.log(x[i]));
            logY.push(Math.log(y[i]));
        }
        const fit = linearFit(logX, logY);
        if (!fit) return null;
        const a = Math.exp(fit.b);
        const b = fit.a;
        const r2 = calcR2(x, y, (v) => a * Math.pow(v, b));
        return { type: 'power', equation: a.toFixed(3) + ' * var ^ ' + b.toFixed(3), a, b, r2 };
    }

    function expFit(x, y) {
        const n = x.length;
        let logY = [];
        for (let i = 0; i < n; i++) {
            if (y[i] <= 0) return null;
            logY.push(Math.log(y[i]));
        }
        const fit = linearFit(x, logY);
        if (!fit) return null;
        const a = Math.exp(fit.b);
        const b = fit.a;
        const r2 = calcR2(x, y, (v) => a * Math.exp(b * v));
        return { type: 'exponential', equation: a.toFixed(3) + ' * exp(' + b.toFixed(3) + ' * var)', a, b, r2 };
    }

    function inverseFit(x, y) {
        const n = x.length;
        let invX = [];
        for (let i = 0; i < n; i++) {
            if (Math.abs(x[i]) < 1e-12) return null;
            invX.push(1 / x[i]);
        }
        const fit = linearFit(invX, y);
        if (!fit) return null;
        const a = fit.a;
        const b = fit.b;
        const r2 = calcR2(x, y, (v) => a / v + b);
        return { type: 'inverse', equation: a.toFixed(3) + ' / var + ' + b.toFixed(3), a, b, r2 };
    }

    function calcR2(x, y, modelFunc) {
        const n = x.length;
        let meanY = 0;
        for (let i = 0; i < n; i++) meanY += y[i];
        meanY /= n;
        let ssTot = 0, ssRes = 0;
        for (let i = 0; i < n; i++) {
            const yi = y[i];
            const pred = modelFunc(x[i]);
            ssTot += (yi - meanY) * (yi - meanY);
            ssRes += (yi - pred) * (yi - pred);
        }
        if (ssTot < 1e-12) return 1;
        return 1 - ssRes / ssTot;
    }

    function fitAllModels(x, y) {
        const models = [];
        const linear = linearFit(x, y);
        if (linear) models.push(linear);
        const power = powerFit(x, y);
        if (power) models.push(power);
        const exp = expFit(x, y);
        if (exp) models.push(exp);
        const inv = inverseFit(x, y);
        if (inv) models.push(inv);
        models.sort((a, b) => b.r2 - a.r2);
        return models;
    }

    // ---- Delta Scanner state ----
    const deltaState = {
        recordings: [],
        candidates: null,
        firstSnapshotTaken: false,
    };

    function computeDeltaCandidates() {
        const vars = getMonitoredVariables();
        if (!vars) return [];
        const recs = deltaState.recordings;
        if (recs.length < 2) return [];

        const allIds = new Set();
        for (let rec of recs) {
            for (let id in rec.snapshot) {
                allIds.add(id);
            }
        }

        const candidates = [];
        const EPS = 0.001;

        for (let id of allIds) {
            const values = [];
            let valid = true;
            for (let rec of recs) {
                const val = rec.snapshot[id];
                if (typeof val !== 'number' || isNaN(val)) {
                    valid = false;
                    break;
                }
                values.push(val);
            }
            if (!valid || values.length < 2) continue;

            let match = true;
            for (let i = 1; i < values.length; i++) {
                const change = values[i] - values[i-1];
                const rec = recs[i];
                const delta = rec.delta;
                const direction = rec.direction || 'exact';

                if (direction === 'exact') {
                    if (Math.abs(change - delta) > EPS) {
                        match = false;
                        break;
                    }
                } else if (direction === 'up') {
                    if (change <= 0) {
                        match = false;
                        break;
                    }
                } else if (direction === 'down') {
                    if (change >= 0) {
                        match = false;
                        break;
                    }
                }
            }
            if (!match) continue;

            const currentValue = values[values.length - 1];
            const item = vars[id];
            candidates.push({
                id: id,
                item: item,
                currentValue: currentValue,
                matches: values.length - 1
            });
        }

        candidates.sort((a, b) => b.matches - a.matches);
        return candidates;
    }

    // ---- Advanced Scanner state ----
    const advancedState = {
        recordings: [],
        candidates: null,
    };

    function computeAdvancedCandidates() {
        const vars = getMonitoredVariables();
        if (!vars) return [];
        const recs = advancedState.recordings;
        if (recs.length < 2) return [];

        const allIds = new Set();
        for (let rec of recs) {
            for (let id in rec.snapshot) {
                allIds.add(id);
            }
        }

        const candidates = [];

        for (let id of allIds) {
            const points = [];
            for (let rec of recs) {
                const val = rec.snapshot[id];
                if (typeof val === 'number' && !isNaN(val)) {
                    points.push({ x: val, y: rec.display });
                }
            }
            if (points.length < 2) continue;

            const xs = points.map(p => p.x);
            const ys = points.map(p => p.y);
            const models = fitAllModels(xs, ys);
            if (models.length === 0) continue;
            const best = models[0];
            if (best.r2 < 0.5) continue;

            candidates.push({
                id: id,
                item: vars[id],
                points: points.length,
                bestModel: best,
                r2: best.r2,
                equation: best.equation
            });
        }

        candidates.sort((a, b) => b.r2 - a.r2);
        return candidates;
    }

    // ---- EXPERIMENTAL FEATURES REGISTRY ----
    const EXPERIMENTAL_FEATURES = [
        {
            id: "advanced_scanner",
            title: "🔬 Advanced Scanner (Math Obfuscation)",
            description: "Record the displayed number, change it, record again. Repeat. Fits linear, power, exponential, inverse models.",
            renderControls: function(container, win) {
                const state = advancedState;
                state.recordings = [];
                state.candidates = null;

                const statusLabel = document.createElement("div");
                statusLabel.style.cssText = "color:#aaaaaa; font-size:11px; margin-bottom:6px;";
                statusLabel.textContent = "Enter the number you see and click 'Record'.";
                container.appendChild(statusLabel);

                const row1 = document.createElement("div");
                row1.style.cssText = "display:flex; align-items:center; gap:6px; margin-bottom:6px;";
                const displayInput = document.createElement("input");
                displayInput.type = "number";
                displayInput.step = "any";
                displayInput.placeholder = "Number shown on screen";
                displayInput.style.cssText = "flex:1; background:#111115; color:#f5f5f6; border:1px solid #3a3a44; padding:4px 8px; border-radius:4px; font-size:11px;";
                row1.appendChild(displayInput);
                const recordBtn = document.createElement("button");
                recordBtn.textContent = "📷 Record Current Value";
                recordBtn.style.cssText = "background:#4dadff; color:#1e1e24; font-weight:bold; border:none; padding:4px 12px; border-radius:4px; cursor:pointer; font-size:11px;";
                row1.appendChild(recordBtn);
                container.appendChild(row1);

                const scanBtn = document.createElement("button");
                scanBtn.textContent = "🔎 Scan for Matches";
                scanBtn.style.cssText = "background:#ffb347; color:#1e1e24; font-weight:bold; border:none; padding:4px 12px; border-radius:4px; cursor:pointer; font-size:11px; margin-bottom:6px;";
                scanBtn.disabled = true;
                container.appendChild(scanBtn);

                const infoLabel = document.createElement("div");
                infoLabel.style.cssText = "color:#aaa; font-size:10px; margin-top:4px;";
                infoLabel.textContent = "Recordings: 0";
                container.appendChild(infoLabel);

                const resultContainer = document.createElement("div");
                resultContainer.style.cssText = "margin-top:8px; max-height:200px; overflow-y:auto; background:#111; border:1px solid #333; border-radius:4px; padding:6px; display:none;";
                container.appendChild(resultContainer);

                recordBtn.onclick = function() {
                    const vars = getMonitoredVariables();
                    if (!vars || Object.keys(vars).length === 0) {
                        alert("Cheat panel not ready. Please run 'Deep Scan' first.");
                        return;
                    }
                    const displayVal = parseFloat(displayInput.value);
                    if (isNaN(displayVal)) {
                        alert("Please enter a valid number.");
                        return;
                    }
                    const snap = {};
                    for (let id in vars) {
                        const val = getVarValue(vars[id]);
                        if (typeof val === 'number' && !isNaN(val)) {
                            snap[id] = val;
                        }
                    }
                    state.recordings.push({ display: displayVal, snapshot: snap });
                    statusLabel.textContent = '✅ Recorded #' + state.recordings.length + ': ' + displayVal;
                    statusLabel.style.color = "#2ecc71";
                    resultContainer.style.display = "none";
                    scanBtn.disabled = (state.recordings.length < 2);
                    infoLabel.textContent = 'Recordings: ' + state.recordings.length;
                    displayInput.value = '';
                };

                scanBtn.onclick = function() {
                    if (state.recordings.length < 2) {
                        alert("Need at least 2 recordings.");
                        return;
                    }
                    const candidates = computeAdvancedCandidates();
                    state.candidates = candidates;
                    resultContainer.style.display = "block";
                    resultContainer.innerHTML = '';
                    if (candidates.length === 0) {
                        resultContainer.innerHTML = '<div style="color:#666; text-align:center; padding:8px;">No strong candidates found. Add more recordings.</div>';
                        return;
                    }
                    const title = document.createElement("div");
                    title.textContent = 'Found ' + candidates.length + ' candidate(s):';
                    title.style.cssText = "color:#4dadff; font-weight:bold; margin-bottom:4px;";
                    resultContainer.appendChild(title);

                    candidates.forEach((cand) => {
                        const row = document.createElement("div");
                        row.style.cssText = "display:flex; align-items:center; gap:6px; padding:2px 0; border-bottom:1px solid #222; font-size:11px;";
                        const label = cand.item.nickname || cand.item.label;
                        const info = document.createElement("span");
                        info.textContent = label + ' → ' + cand.equation + ' (R²=' + cand.r2.toFixed(4) + ')';
                        info.style.cssText = "flex:1; color:#f5f5f6;";
                        row.appendChild(info);

                        const favBtn = document.createElement("button");
                        favBtn.textContent = "⭐ Favorite";
                        favBtn.style.cssText = "background:#2ecc71; color:#1e1e24; border:none; padding:2px 8px; border-radius:3px; cursor:pointer; font-size:10px;";
                        favBtn.onclick = function() {
                            if (addToFavorites(cand.id, cand.equation)) {
                                favBtn.textContent = "✔ Favorited";
                                favBtn.disabled = true;
                            }
                        };
                        row.appendChild(favBtn);
                        resultContainer.appendChild(row);
                    });

                    const favAllBtn = document.createElement("button");
                    favAllBtn.textContent = "⭐ Favorite All Candidates";
                    favAllBtn.style.cssText = "background:#ffb347; color:#1e1e24; border:none; padding:4px 12px; border-radius:4px; cursor:pointer; font-size:11px; margin-top:6px;";
                    favAllBtn.onclick = function() {
                        let count = 0;
                        candidates.forEach(cand => {
                            if (addToFavorites(cand.id, cand.equation)) count++;
                        });
                        alert('Favorited ' + count + ' variables.');
                    };
                    resultContainer.appendChild(favAllBtn);
                };

                const resetState = () => {
                    state.recordings = [];
                    state.candidates = null;
                    resultContainer.style.display = "none";
                    scanBtn.disabled = true;
                    statusLabel.textContent = "Enter the number you see and click 'Record'.";
                    statusLabel.style.color = "#aaaaaa";
                    infoLabel.textContent = "Recordings: 0";
                };
                container._resetScanner = resetState;
            },
            onEnable: function(win) {
                console.log("[EXP] Advanced Scanner enabled");
                const container = win.document.querySelector('#experimental-sandbox .exp-ctrl');
                if (container && container._resetScanner) container._resetScanner();
            },
            onDisable: function(win) {
                console.log("[EXP] Advanced Scanner disabled");
                const container = win.document.querySelector('#experimental-sandbox .exp-ctrl');
                if (container && container._resetScanner) container._resetScanner();
            }
        },
        {
            id: "delta_scanner",
            title: "📉 Delta Scanner (Track Changes by Amount or Direction)",
            description: "Track a variable by recording snapshots and specifying how it changed (exact amount, increased, or decreased).",
            renderControls: function(container, win) {
                const state = deltaState;
                state.recordings = [];
                state.candidates = null;
                state.firstSnapshotTaken = false;

                const statusLabel = document.createElement("div");
                statusLabel.style.cssText = "color:#aaaaaa; font-size:11px; margin-bottom:6px;";
                statusLabel.textContent = "Step 1: Take a snapshot of the current state.";
                container.appendChild(statusLabel);

                const snapshotBtn = document.createElement("button");
                snapshotBtn.textContent = "📸 Take First Snapshot";
                snapshotBtn.style.cssText = "background:#4dadff; color:#1e1e24; font-weight:bold; border:none; padding:4px 12px; border-radius:4px; cursor:pointer; font-size:11px; margin-bottom:8px;";
                container.appendChild(snapshotBtn);

                const controlsWrapper = document.createElement("div");
                controlsWrapper.style.cssText = "display:none;";
                container.appendChild(controlsWrapper);

                const modeRow = document.createElement("div");
                modeRow.style.cssText = "display:flex; align-items:center; gap:8px; margin-bottom:6px;";
                const modeLabel = document.createElement("span");
                modeLabel.textContent = "Change type:";
                modeLabel.style.cssText = "color:#aaa; font-size:10px; font-weight:bold;";
                modeRow.appendChild(modeLabel);

                const modeSelect = document.createElement("select");
                modeSelect.style.cssText = "background:#111115; color:#f5f5f6; border:1px solid #3a3a44; padding:3px 6px; border-radius:4px; font-size:11px;";
                const optExact = document.createElement("option");
                optExact.value = "exact";
                optExact.textContent = "Exact change (e.g., +10)";
                modeSelect.appendChild(optExact);
                const optUp = document.createElement("option");
                optUp.value = "up";
                optUp.textContent = "Increased (went up)";
                modeSelect.appendChild(optUp);
                const optDown = document.createElement("option");
                optDown.value = "down";
                optDown.textContent = "Decreased (went down)";
                modeSelect.appendChild(optDown);
                modeRow.appendChild(modeSelect);
                controlsWrapper.appendChild(modeRow);

                const row1 = document.createElement("div");
                row1.style.cssText = "display:flex; align-items:center; gap:6px; margin-bottom:6px;";
                const deltaInput = document.createElement("input");
                deltaInput.type = "number";
                deltaInput.step = "any";
                deltaInput.placeholder = "Change amount (only for Exact mode)";
                deltaInput.style.cssText = "flex:1; background:#111115; color:#f5f5f6; border:1px solid #3a3a44; padding:4px 8px; border-radius:4px; font-size:11px;";
                row1.appendChild(deltaInput);
                const recordBtn = document.createElement("button");
                recordBtn.textContent = "📷 Record & Apply Delta";
                recordBtn.style.cssText = "background:#4dadff; color:#1e1e24; font-weight:bold; border:none; padding:4px 12px; border-radius:4px; cursor:pointer; font-size:11px;";
                row1.appendChild(recordBtn);
                controlsWrapper.appendChild(row1);

                const infoLabel = document.createElement("div");
                infoLabel.style.cssText = "color:#aaa; font-size:10px; margin-top:4px;";
                infoLabel.textContent = "No recordings yet. Take a snapshot first.";
                controlsWrapper.appendChild(infoLabel);

                const resultContainer = document.createElement("div");
                resultContainer.style.cssText = "margin-top:8px; max-height:200px; overflow-y:auto; background:#111; border:1px solid #333; border-radius:4px; padding:6px; display:none;";
                controlsWrapper.appendChild(resultContainer);

                snapshotBtn.onclick = function() {
                    const vars = getMonitoredVariables();
                    if (!vars || Object.keys(vars).length === 0) {
                        alert("Cheat panel not ready. Please run 'Deep Scan' first.");
                        return;
                    }
                    const snap = {};
                    for (let id in vars) {
                        const val = getVarValue(vars[id]);
                        if (typeof val === 'number' && !isNaN(val)) {
                            snap[id] = val;
                        }
                    }
                    state.recordings = [{ delta: 0, snapshot: snap, direction: 'exact' }];
                    state.firstSnapshotTaken = true;
                    statusLabel.textContent = '✅ First snapshot recorded. Now change the value and record again.';
                    statusLabel.style.color = "#2ecc71";
                    controlsWrapper.style.display = 'block';
                    infoLabel.textContent = 'Snapshot taken. Now record changes.';
                    snapshotBtn.disabled = true;
                    snapshotBtn.style.opacity = '0.5';
                    resultContainer.style.display = 'none';
                };

                recordBtn.onclick = function() {
                    if (!state.firstSnapshotTaken) {
                        alert("Please take the first snapshot first.");
                        return;
                    }
                    const vars = getMonitoredVariables();
                    if (!vars || Object.keys(vars).length === 0) {
                        alert("Cheat panel not ready. Please run 'Deep Scan' first.");
                        return;
                    }
                    const direction = modeSelect.value;
                    let delta = 0;
                    if (direction === 'exact') {
                        delta = parseFloat(deltaInput.value);
                        if (isNaN(delta)) {
                            alert("Please enter a valid change amount (e.g., 10 or -7).");
                            return;
                        }
                    }

                    const snap = {};
                    for (let id in vars) {
                        const val = getVarValue(vars[id]);
                        if (typeof val === 'number' && !isNaN(val)) {
                            snap[id] = val;
                        }
                    }
                    state.recordings.push({ delta: delta, snapshot: snap, direction: direction });
                    const recCount = state.recordings.length;
                    const dirLabel = direction === 'exact' ? 'delta: ' + delta : direction;
                    statusLabel.textContent = '✅ Recording #' + recCount + ' stored (' + dirLabel + ')';
                    deltaInput.value = '';

                    const candidates = computeDeltaCandidates();
                    state.candidates = candidates;
                    const totalVars = Object.keys(snap).length;
                    infoLabel.textContent = 'Total vars: ' + totalVars + ' | Remaining candidates: ' + candidates.length;

                    if (candidates.length > 0 && candidates.length <= 4) {
                        resultContainer.style.display = "block";
                        resultContainer.innerHTML = '';
                        const title = document.createElement("div");
                        title.textContent = '🏆 ' + candidates.length + ' candidate(s) found:';
                        title.style.cssText = "color:#4dadff; font-weight:bold; margin-bottom:4px;";
                        resultContainer.appendChild(title);

                        candidates.forEach((cand) => {
                            const row = document.createElement("div");
                            row.style.cssText = "display:flex; align-items:center; gap:6px; padding:2px 0; border-bottom:1px solid #222; font-size:11px;";
                            const label = cand.item.nickname || cand.item.label;
                            const info = document.createElement("span");
                            info.textContent = label + ' → current: ' + cand.currentValue + ' (matches: ' + cand.matches + ' deltas)';
                            info.style.cssText = "flex:1; color:#f5f5f6;";
                            row.appendChild(info);

                            const favBtn = document.createElement("button");
                            favBtn.textContent = "⭐ Favorite";
                            favBtn.style.cssText = "background:#2ecc71; color:#1e1e24; border:none; padding:2px 8px; border-radius:3px; cursor:pointer; font-size:10px;";
                            favBtn.onclick = function() {
                                const nickname = 'Delta match (' + cand.matches + ' changes)';
                                if (addToFavorites(cand.id, nickname)) {
                                    favBtn.textContent = "✔ Favorited";
                                    favBtn.disabled = true;
                                }
                            };
                            row.appendChild(favBtn);
                            resultContainer.appendChild(row);
                        });

                        const favAllBtn = document.createElement("button");
                        favAllBtn.textContent = "⭐ Favorite All Candidates";
                        favAllBtn.style.cssText = "background:#ffb347; color:#1e1e24; border:none; padding:4px 12px; border-radius:4px; cursor:pointer; font-size:11px; margin-top:6px;";
                        favAllBtn.onclick = function() {
                            let count = 0;
                            candidates.forEach(cand => {
                                const nickname = 'Delta match (' + cand.matches + ' changes)';
                                if (addToFavorites(cand.id, nickname)) count++;
                            });
                            alert('Favorited ' + count + ' variables.');
                        };
                        resultContainer.appendChild(favAllBtn);
                    } else if (candidates.length > 4) {
                        resultContainer.style.display = "none";
                    } else {
                        resultContainer.style.display = "block";
                        resultContainer.innerHTML = '<div style="color:#666; text-align:center; padding:8px;">No variables matched all changes. Try again with more recordings.</div>';
                    }
                };

                const resetState = () => {
                    state.recordings = [];
                    state.candidates = null;
                    state.firstSnapshotTaken = false;
                    controlsWrapper.style.display = 'none';
                    snapshotBtn.disabled = false;
                    snapshotBtn.style.opacity = '1';
                    resultContainer.style.display = 'none';
                    statusLabel.textContent = "Step 1: Take a snapshot of the current state.";
                    statusLabel.style.color = "#aaaaaa";
                    infoLabel.textContent = "No recordings yet. Take a snapshot first.";
                    deltaInput.placeholder = "Change amount (only for Exact mode)";
                };
                container._resetScanner = resetState;
            },
            onEnable: function(win) {
                console.log("[EXP] Delta Scanner enabled");
                const container = win.document.querySelector('#experimental-sandbox .exp-ctrl');
                if (container && container._resetScanner) container._resetScanner();
            },
            onDisable: function(win) {
                console.log("[EXP] Delta Scanner disabled");
                const container = win.document.querySelector('#experimental-sandbox .exp-ctrl');
                if (container && container._resetScanner) container._resetScanner();
            }
        },
        {
            id: "speed_hack",
            title: "Movement Speed Multiplier",
            description: "Adjusts player movement speed across maps.",
            renderControls: function(container, win) {
                const slider = document.createElement("input");
                slider.className = "exp-ctrl";
                slider.type = "range";
                slider.min = "1";
                slider.max = "5";
                slider.value = "2";
                slider.style.cssText = "vertical-align:middle; margin-right:8px;";
                const valLabel = document.createElement("span");
                valLabel.innerText = "2x Speed";
                valLabel.style.cssText = "color:#ffb347; font-size:11px; font-weight:bold;";
                slider.oninput = function() {
                    valLabel.innerText = slider.value + 'x Speed';
                    if (win.$gamePlayer) {
                        win.$gamePlayer._moveSpeed = 4 + Number(slider.value);
                    }
                };
                container.appendChild(slider);
                container.appendChild(valLabel);
            },
            onEnable: function(win) { console.log("[EXP] Speed Hack Enabled"); },
            onDisable: function(win) { console.log("[EXP] Speed Hack Disabled"); }
        }
    ];

    // ---- Inject the sandbox panel ----
    function injectExperimentalPanel(targetDoc, targetWin) {
        if (!targetDoc || !targetDoc.body) return;
        if (!isCheatPanel(targetDoc)) return;
        if (targetDoc.getElementById("experimental-sandbox")) return;

        const sandbox = targetDoc.createElement("div");
        sandbox.id = "experimental-sandbox";
        sandbox.style.cssText = "margin:15px 0; padding:12px; background:#2a2a35; border:1px solid #ffb347; border-radius:6px; font-family:'Segoe UI', sans-serif; clear:both;";

        const title = targetDoc.createElement("div");
        title.innerHTML = "🧪 <b>EXPERIMENTAL FEATURES</b>";
        title.style.cssText = "color:#ffb347; font-size:11px; letter-spacing:0.5px; margin-bottom:10px;";
        sandbox.appendChild(title);

        EXPERIMENTAL_FEATURES.forEach(feature => {
            const row = targetDoc.createElement("div");
            row.style.cssText = "padding:8px; background:#1e1e24; border:1px solid #3a3a44; border-radius:4px; margin-bottom:8px; opacity:0.45; filter:grayscale(80%); transition: all 0.2s ease;";

            const header = targetDoc.createElement("label");
            header.style.cssText = "display:flex; align-items:center; cursor:pointer; color:#f5f5f6; font-size:12px; font-weight:bold;";

            const chk = targetDoc.createElement("input");
            chk.type = "checkbox";
            chk.style.cssText = "margin-right:8px; cursor:pointer;";

            const textSpan = targetDoc.createElement("span");
            textSpan.innerText = feature.title;

            header.appendChild(chk);
            header.appendChild(textSpan);
            row.appendChild(header);

            const desc = targetDoc.createElement("div");
            desc.innerText = feature.description;
            desc.style.cssText = "color:#aaaaaa; font-size:10px; margin:4px 0 6px 22px;";
            row.appendChild(desc);

            const controlsBox = targetDoc.createElement("div");
            controlsBox.style.cssText = "margin-left:22px; margin-top:6px; display:block;";
            feature.renderControls(controlsBox, targetWin);
            row.appendChild(controlsBox);

            const setControlsDisabled = (disabled) => {
                const ctrls = controlsBox.querySelectorAll(".exp-ctrl, button, input, select");
                ctrls.forEach(c => {
                    c.disabled = disabled;
                    c.style.cursor = disabled ? "not-allowed" : "pointer";
                });
            };

            setControlsDisabled(true);

            chk.onchange = function() {
                if (chk.checked) {
                    row.style.opacity = "1";
                    row.style.filter = "none";
                    row.style.borderColor = "#4dadff";
                    setControlsDisabled(false);
                    feature.onEnable(targetWin);
                } else {
                    row.style.opacity = "0.45";
                    row.style.filter = "grayscale(80%)";
                    row.style.borderColor = "#3a3a44";
                    setControlsDisabled(true);
                    feature.onDisable(targetWin);
                }
            };

            sandbox.appendChild(row);
        });

        const anchor = targetDoc.getElementById('experimental-anchor');
        if (anchor) {
            anchor.parentNode.insertBefore(sandbox, anchor.nextSibling);
        } else {
            targetDoc.body.appendChild(sandbox);
        }
        console.log("%c[EXPERIMENTAL] Sandbox Injected Successfully!", "color:#2ecc71; font-weight:bold;");
    }

    // ---- Injection loop (now uses cached getCheatWindow) ----
    setInterval(() => {
        const cheatWin = getCheatWindow();
        if (cheatWin && !cheatWin.closed) {
            ensureCheatPanelExposed(cheatWin);
            injectExperimentalPanel(cheatWin.document, mainWin);
        }
        openWindows.forEach(w => {
            try {
                if (w && !w.closed && w.document && w.document.body) {
                    injectExperimentalPanel(w.document, mainWin);
                } else if (w && w.closed) {
                    openWindows.delete(w);
                }
            } catch(e) {}
        });
    }, 2000); // Reduced frequency to 2 seconds
})();
// =========================================================================
// END SECTION 7
// =========================================================================