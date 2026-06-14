// Globaler Speicher für die statistische und chronologische Auswertung des Regex-Finders
let regexAnalysisMatches = [];
let regexUniqueIdCounter = 0;

// STRIKTE 6-LEVEL-SKALEN (Level 1: Hell/Fad -> Level 6+: Dunkel/Intensiv)
const SKALEN = {
    // Blau: Mischwörter (Kanji + Kana)
    BLAU: [
        ["#f0f5ff", "#cbd5e0"], 
        ["#e0ebff", "#a0c4ff"], 
        ["#c2d9ff", "#709dff"], 
        ["#99bcff", "#00215e"], 
        ["#3772ff", "#ffffff"], 
        ["#00215e", "#ffffff"]  
    ],
    // Grün: Reine Kana-Wörter (Hiragana/Katakana)
    GRUEN: [
        ["#f2fdf9", "#a8e6cf"], 
        ["#e6f9f1", "#82d1b1"], 
        ["#c8f2e2", "#4cae8a"], 
        ["#a8e6cf", "#1b4d3e"], 
        ["#2d7a5f", "#ffffff"], 
        ["#1b4d3e", "#ffffff"]  
    ],
    // Rot: Reine Kanji
    ROT: [
        ["#fdf0ed", "#f4978e"], 
        ["#fbc4ab", "#f08080"], 
        ["#f8ad9d", "#e63946"], 
        ["#f4978e", "#7a0000"], 
        ["#b30000", "#ffffff"], 
        ["#7a0000", "#ffffff"]  
    ],
    // Gold: Für reguläre Ausdrücke (Regex)
    GOLD: [
        ["#fffdf0", "#d4af37"], // 1 Treffer (Zartes Pastell-Gold)
        ["#fff9db", "#b8860b"], // 2 Treffer
        ["#fff3b3", "#996515"], // 3 Treffer
        ["#ffe066", "#593e10"], // 4 Treffer
        ["#ffd700", "#ffffff"], // 5 Treffer (Sattes Gold)
        ["#b8860b", "#ffffff"]  // 6+ Treffer (Tiefes Dunkelgold / Bronze)
    ]
};

function getMuster(anzahl, skalenName) {
    const idx = Math.min(Math.max(anzahl - 1, 0), 5);
    return SKALEN[skalenName][idx];
}

function bestimmeSkala(wort, isRegexPattern) {
    // Wenn es als Regex erkannt wurde, erzwinge die GOLD-Skala
    if (isRegexPattern) return "GOLD";
    
    if (/^[\u4E00-\u9FAF]+$/.test(wort)) return "ROT";
    if (/^[\u3040-\u309F\u30A0-\u30FF]+$/.test(wort)) return "GRUEN";
    return "BLAU";
}

function istGefaehrlichesKana(wort) {
    if (/[\.\*\+\?\{\}\[\]\^\|\$\\]/.test(wort)) return false;
    const nurKana = /^[\u3040-\u309F\u30A0-\u30FF]+$/;
    return nurKana.test(wort) && wort.length < 3;
}

function entferneMarkierung(wort) {
    const markierungen = document.querySelectorAll(`span[data-mark-word="${wort}"]`);
    markierungen.forEach(span => {
        const textNode = document.createTextNode(span.textContent);
        span.parentNode.replaceChild(textNode, span);
    });
    document.body.normalize();
}

function springeZumNaechsten(aktuellesElement, wort) {
    const alleGleichen = Array.from(document.querySelectorAll(`span[data-mark-word="${wort}"]`));
    if (alleGleichen.length <= 1) return;
    const index = alleGleichen.indexOf(aktuellesElement);
    const naechstes = alleGleichen[(index + 1) % alleGleichen.length];
    naechstes.scrollIntoView({ behavior: 'smooth', block: 'center' });
    naechstes.style.outline = "2px solid currentColor";
    setTimeout(() => naechstes.style.outline = "none", 600);
}

function runMarking(inputString) {
    let rawEntries = inputString.split(/[@＠]/).map(w => w.trim()).filter(w => w.length > 0);
    rawEntries = rawEntries.filter(w => !istGefaehrlichesKana(w));
    if (rawEntries.length === 0) return;

    // Reset der Statistik bei jedem neuen Markierungsvorgang
    regexAnalysisMatches = [];

    const compiledPatterns = rawEntries.map(entry => {
        const isRegex = /[\.\*\+\?\{\}\[\]\^\|\$\\]/.test(entry);
        try {
            const finalStr = isRegex ? entry : entry.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            return { 
                original: entry, 
                regex: new RegExp(finalStr, 'g'),
                isRegex: isRegex // Eigenschaft merken für die spätere Farbwahl
            };
        } catch(e) {
            console.error("Ungültige Regex ignoriert: " + entry);
            return null;
        }
    }).filter(p => p !== null);

    const textContent = document.body.innerText;
    const counts = {};
    compiledPatterns.forEach(p => {
        const matches = textContent.match(p.regex);
        counts[p.original] = matches ? matches.length : 0;
    });

    const sortedPatterns = [...compiledPatterns].sort((a, b) => b.original.length - a.original.length);
    if (sortedPatterns.length === 0) return;

    const masterRegexStr = sortedPatterns.map(p => `(?:${p.regex.source})`).join('|');
    const masterRegex = new RegExp(masterRegexStr, 'g');

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    let node, nodesToReplace = [];
    while (node = walker.nextNode()) {
        if (node.parentElement.tagName.match(/SCRIPT|STYLE|TEXTAREA|INPUT|NOSCRIPT/)) continue;
        
        masterRegex.lastIndex = 0;
        if (masterRegex.test(node.nodeValue)) {
            nodesToReplace.push(node);
        }
    }

    nodesToReplace.forEach(textNode => {
        const parent = textNode.parentNode;
        if (!parent) return;
        
        masterRegex.lastIndex = 0;
        const wrapper = document.createElement('span');
        const safeText = textNode.nodeValue.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

        wrapper.innerHTML = safeText.replace(masterRegex, (match) => {
            const passendesPattern = sortedPatterns.find(p => {
                const testRegex = new RegExp(p.regex.source);
                return testRegex.test(match);
            }) || sortedPatterns[0];

            const trefferAnzahl = counts[passendesPattern.original] || 1;
            
            // ÜBERGABE: bestimmeSkala weiß jetzt, ob der Treffer von einer Regex stammt
            const skala = bestimmeSkala(match, passendesPattern.isRegex);
            const [bg, fg] = getMuster(trefferAnzahl, skala);
            const weight = trefferAnzahl >= 4 ? '700' : '400';

            regexUniqueIdCounter++;
            const uniqueMatchId = `regex-match-${regexUniqueIdCounter}`;

            // Für die chronologische Erfassung der Treffer
            regexAnalysisMatches.push({
                elementId: uniqueMatchId,
                text: match,
                patternName: passendesPattern.original,
                percentage: "0.00"
            });

            return `<span class="gemini-mark" id="${uniqueMatchId}" data-mark-word="${passendesPattern.original.replace(/"/g, '&quot;')}" style="background-color: ${bg}; color: ${fg}; padding: 1px 3px; border-radius: 2px; cursor: pointer; font-weight: ${weight}; line-height: 1.4;">${match}</span>`;
        });

        wrapper.querySelectorAll('.gemini-mark').forEach(el => {
            el.addEventListener('dblclick', function(e) {
                e.stopPropagation();
                const wort = this.getAttribute('data-mark-word');
                // GEÄNDERT: Bedingung für rote Markierung (Kanji) restlos entfernt, sodass immer gesprungen wird
                springeZumNaechsten(this, wort);
            });
        });

        while (wrapper.firstChild) parent.insertBefore(wrapper.firstChild, textNode);
        parent.removeChild(textNode);
    });

    // Prozentuale Positionierung nachträglich berechnen
    const totalMatchesCount = regexAnalysisMatches.length;
    regexAnalysisMatches.forEach((m, idx) => {
        m.percentage = totalMatchesCount > 0 ? ((idx / totalMatchesCount) * 100).toFixed(2) : "0.00";
    });

    // Erstelle oder aktualisiere den blauen Analyse-Hub
    const blueHub = document.getElementById('regex-stats-hub');
    if (!blueHub) {
        setupRegexStatsHub();
    } else {
        if (typeof adjustBlueHubPosition === 'function') {
            adjustBlueHubPosition();
        } else {
            adjustLocalHubPositions();
        }
        const shadow = blueHub.shadowRoot;
        const panel = shadow.getElementById('regex-stats-panel');
        if (panel && panel.style.display === 'flex') {
            const activeBtn = shadow.querySelector('.tab-btn.active');
            let tab = "freq";
            if (activeBtn) {
                if (activeBtn.id === 'btn-regex-tab-chrono') tab = "chrono";
                if (activeBtn.id === 'btn-regex-tab-sorted') tab = "sorted";
            }
            renderRegexStatsTable(shadow, tab);
        }
    }
}

// Hilfsfunktion zur lokalen Positionierung, falls das Grammar-Addon nicht auf der Seite ist
function adjustLocalHubPositions() {
    const greenHub = document.getElementById('grammar-miner-hub');
    const yellowHub = document.getElementById('grammar-stats-hub');
    const blueHub = document.getElementById('regex-stats-hub');
    if (blueHub && blueHub.style.width === '20px') {
        const referenceHub = yellowHub || greenHub;
        if (referenceHub) {
            const refRect = referenceHub.getBoundingClientRect();
            blueHub.style.left = referenceHub.style.left;
            if (referenceHub.style.right && referenceHub.style.right !== 'auto') {
                blueHub.style.right = referenceHub.style.right;
                blueHub.style.left = 'auto';
            } else {
                blueHub.style.right = 'auto';
            }
            blueHub.style.top = (refRect.bottom + 10) + 'px';
        } else {
            blueHub.style.top = '80px';
            blueHub.style.right = '20px';
            blueHub.style.left = 'auto';
        }
    }
}

function setupRegexStatsHub() {
    if (document.getElementById('regex-stats-hub')) {
        adjustLocalHubPositions();
        return;
    }

    const hub = document.createElement('div');
    hub.id = 'regex-stats-hub';
    
    hub.style.position = 'fixed';
    hub.style.width = '20px';
    hub.style.height = '20px';
    hub.style.backgroundColor = '#2980b9'; // Zugewiesenes freigewordenes Blau
    hub.style.borderRadius = '4px';
    hub.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
    hub.style.zIndex = '9999999c'; 
    hub.style.cursor = 'pointer';
    hub.style.transition = 'width 0.2s, height 0.2s';
    hub.style.display = 'block'; 

    const greenHub = document.getElementById('grammar-miner-hub');
    const yellowHub = document.getElementById('grammar-stats-hub');
    const referenceHub = yellowHub || greenHub;
    if (referenceHub) {
        const refRect = referenceHub.getBoundingClientRect();
        hub.style.top = (refRect.bottom + 10) + 'px';
        hub.style.right = '20px';
    } else {
        hub.style.top = '80px';
        hub.style.right = '20px';
    }

    const shadow = hub.attachShadow({ mode: 'open' });
    
    const style = document.createElement('style');
    style.textContent = `
        .panel-container { display: none; width: 100%; height: 100%; flex-direction: column; background: #dfe6e9; box-sizing: border-box; font-family: sans-serif; color: #2d3436; }
        .panel-header { background: #2980b9; color: white; padding: 6px 10px; font-weight: bold; display: flex; justify-content: space-between; align-items: center; font-size: 13px; }
        .tab-bar { display: flex; background: #b2bec3; gap: 2px; padding: 2px 2px 0 2px; }
        .tab-btn { border: none; background: #f8f9fa; padding: 6px 12px; cursor: pointer; font-weight: bold; font-size: 12px; border-radius: 4px 4px 0 0; }
        .tab-btn.active { background: white; color: #2980b9; }
        .table-wrapper { flex: 1; overflow: auto; padding: 6px; background: white; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { background: #f1f2f6; border: 1px solid #ced6e0; padding: 6px; text-align: left; position: sticky; top: 0; }
        td { border: 1px solid #ced6e0; padding: 6px; white-space: pre-wrap; word-break: break-all; }
        .jump-link { color: #2980b9; text-decoration: underline; cursor: pointer; font-weight: bold; }
        .jump-link:hover { color: #1c5980; }
        .close-panel-btn { background: none; border: none; color: white; font-size: 16px; cursor: pointer; }
      `;
    shadow.appendChild(style);

    const container = document.createElement('div');
    container.className = 'panel-container';
    container.id = 'regex-stats-panel';

    container.innerHTML = `
        <div class="panel-header">
          <span>Regex Finder Analyse & Navigation</span>
          <button class="close-panel-btn">✕</button>
        </div>
        <div class="tab-bar">
          <button class="tab-btn active" id="btn-regex-tab-freq">Häufigkeit</button>
          <button class="tab-btn" id="btn-regex-tab-chrono">Chronologisch</button>
          <button class="tab-btn" id="btn-regex-tab-sorted">Sortiert</button>
        </div>
        <div class="table-wrapper">
          <table id="regex-stats-table">
            <thead id="regex-stats-thead"></thead>
            <tbody id="regex-stats-tbody"></tbody>
          </table>
        </div>
      `;
    shadow.appendChild(container);
    document.body.appendChild(hub);

    let currentTab = "freq";

    hub.addEventListener('click', (e) => {
        if (hub.style.width === '20px') {
            e.stopPropagation();
            hub.style.width = '550px';
            hub.style.height = '380px';
            hub.style.cursor = 'default';
            hub.style.resize = 'both';
            hub.style.overflow = 'hidden';
            container.style.display = 'flex';
            renderRegexStatsTable(shadow, currentTab);
        }
    });

    shadow.querySelector('.close-panel-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        collapseRegexHub(hub, container);
    });

    shadow.querySelector('#btn-regex-tab-freq').addEventListener('click', (e) => {
        e.stopPropagation(); currentTab = "freq";
        setRegexActiveTabStyle(shadow, '#btn-regex-tab-freq');
        renderRegexStatsTable(shadow, currentTab);
    });

    shadow.querySelector('#btn-regex-tab-chrono').addEventListener('click', (e) => {
        e.stopPropagation(); currentTab = "chrono";
        setRegexActiveTabStyle(shadow, '#btn-regex-tab-chrono');
        renderRegexStatsTable(shadow, currentTab);
    });

    shadow.querySelector('#btn-regex-tab-sorted').addEventListener('click', (e) => {
        e.stopPropagation(); currentTab = "sorted";
        setRegexActiveTabStyle(shadow, '#btn-regex-tab-sorted');
        renderRegexStatsTable(shadow, currentTab);
    });
}

function collapseRegexHub(hub, container) {
    hub.style.width = '20px';
    hub.style.height = '20px';
    hub.style.cursor = 'pointer';
    hub.style.resize = 'none';
    hub.style.overflow = 'hidden';
    container.style.display = 'none';
    if (typeof adjustBlueHubPosition === 'function') {
        adjustBlueHubPosition();
    } else {
        adjustLocalHubPositions();
    }
}

function setRegexActiveTabStyle(shadow, activeId) {
    shadow.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    shadow.querySelector(activeId).classList.add('active');
}

function renderRegexStatsTable(shadow, tab) {
    const thead = shadow.getElementById('regex-stats-thead');
    const tbody = shadow.getElementById('regex-stats-tbody');
    thead.innerHTML = '';
    tbody.innerHTML = '';

    if (tab === "freq") {
        thead.innerHTML = `
          <tr>
            <th style="width: 70%;">Suchwort / Pattern</th>
            <th style="width: 30%;">Anzahl Treffer</th>
          </tr>
        `;
        
        const counts = {};
        regexAnalysisMatches.forEach(m => {
            counts[m.patternName] = (counts[m.patternName] || 0) + 1;
        });

        const sortedFreq = Object.entries(counts).sort((a, b) => b[1] - a[1]);

        if (sortedFreq.length === 0) {
            tbody.innerHTML = `<tr><td colspan="2" style="text-align:center; color:#7f8c8d;">Keine Treffer analysiert.</td></tr>`;
            return;
        }

        let statsHtml = "";
        sortedFreq.forEach(([name, count]) => {
            statsHtml += `<tr><td>${name}</td><td><b>${count}x</b></td></tr>`;
        });
        tbody.innerHTML = statsHtml;

    } else if (tab === "chrono") {
        thead.innerHTML = `
          <tr>
            <th style="width: 30%;">Match (Sprungmarke)</th>
            <th style="width: 50%;">Pattern / Wort</th>
            <th style="width: 20%;">Position</th>
          </tr>
        `;

        if (regexAnalysisMatches.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:#7f8c8d;">Keine Matches vorhanden.</td></tr>`;
            return;
        }

        let statsHtml = "";
        regexAnalysisMatches.forEach(m => {
            statsHtml += `
            <tr>
              <td><span class="jump-link" data-target="${m.elementId}">${m.text}</span></td>
              <td>${m.patternName}</td>
              <td>${m.percentage}%</td>
            </tr>
          `;
        });
        tbody.innerHTML = statsHtml;
        attachRegexJumpLinks(tbody);

    } else if (tab === "sorted") {
        thead.innerHTML = `
          <tr>
            <th style="width: 40%;">Match (Sprungmarke)</th>
            <th style="width: 60%;">Position im Text</th>
          </tr>
        `;

        const counts = {};
        regexAnalysisMatches.forEach(m => {
            counts[m.patternName] = (counts[m.patternName] || 0) + 1;
        });
        const sortedPatternNames = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .map(entry => entry[0]);

        if (sortedPatternNames.length === 0) {
            tbody.innerHTML = `<tr><td colspan="2" style="text-align:center; color:#7f8c8d;">Keine Matches vorhanden.</td></tr>`;
            return;
        }

        let statsHtml = "";
        sortedPatternNames.forEach(pName => {
            statsHtml += `<tr><td colspan="2" style="background: #2980b9; color: white; font-weight: bold; padding: 4px 8px;">${pName} (${counts[pName]}x)</td></tr>`;
            const groupMatches = regexAnalysisMatches.filter(m => m.patternName === pName);
          
            groupMatches.forEach(m => {
                statsHtml += `
              <tr>
                <td><span class="jump-link" data-target="${m.elementId}">${m.text}</span></td>
                <td>${m.percentage}%</td>
              </tr>
            `;
            });
        });
        tbody.innerHTML = statsHtml;
        attachRegexJumpLinks(tbody);
    }
}

function attachRegexJumpLinks(tbody) {
    tbody.querySelectorAll('.jump-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.stopPropagation();
            const targetId = link.getAttribute('data-target');
            const targetEl = document.getElementById(targetId);
            if (targetEl) {
                targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                const originalBg = targetEl.style.backgroundColor;
                targetEl.style.backgroundColor = '#9b59b6';
                targetEl.style.color = '#ffffff';
                setTimeout(() => {
                    targetEl.style.backgroundColor = originalBg;
                    targetEl.style.color = "";
                }, 1000);
            }
        });
    });
}

chrome.runtime.onMessage.addListener((request) => {
    if (request.action === "mark") runMarking(request.query);
});