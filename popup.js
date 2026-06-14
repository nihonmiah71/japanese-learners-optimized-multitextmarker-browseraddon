// Beim Öffnen des Popups: Letzten Zustand aus dem Chrome Storage laden
document.addEventListener('DOMContentLoaded', async () => {
    const data = await chrome.storage.local.get(['savedWords', 'isRegex']);
    if (data.savedWords) document.getElementById('words').value = data.savedWords;
    if (data.isRegex) document.getElementById('isRegex').checked = data.isRegex;
});

// Text im Speicher sichern, wenn er sich ändert
document.getElementById('words').addEventListener('input', (e) => {
    chrome.storage.local.set({ savedWords: e.target.value });
});
document.getElementById('isRegex').addEventListener('change', (e) => {
    chrome.storage.local.set({ isRegex: e.target.checked });
});

// Markierung starten
document.getElementById('btn').addEventListener('click', async () => {
    const query = document.getElementById('words').value;
    const isRegexOverride = document.getElementById('isRegex').checked;
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab) {
        chrome.tabs.sendMessage(tab.id, { 
            action: "mark", 
            query: query, 
            isRegex: isRegexOverride 
        });
    }
});

// DATENBANK-FUNKTION: Als Textdatei exportieren
document.getElementById('btnSave').addEventListener('click', () => {
    const text = document.getElementById('words').value;
    if (!text.trim()) return;
    
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `textfinder_db_${new Date().toISOString().slice(0,10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
});

// DATENBANK-FUNKTION: Aus Textdatei importieren
document.getElementById('fileInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(evt) {
        const content = evt.target.result;
        document.getElementById('words').value = content;
        chrome.storage.local.set({ savedWords: content });
    };
    reader.readAsText(file, 'UTF-8');
});

// Triggert das unsichtbare File-Input-Element, wenn der Button geklickt wird
document.getElementById('btnLoad').addEventListener('click', () => {
    document.getElementById('fileInput').click();
});