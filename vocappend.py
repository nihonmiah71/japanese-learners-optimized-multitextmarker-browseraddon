import os

def verarbeite_tsv(tsv_pfad, ziel_pfad):
    # 1. Wörter aus der TSV-Datei einlesen
    woerter = []
    with open(tsv_pfad, 'r', encoding='utf-8') as f:
        for zeile in f:
            # Entfernt Zeilenumbrüche und Leerzeichen am Anfang/Ende der Zeile
            wort = zeile.strip()
            # Nur hinzufügen, wenn die Zeile nicht leer ist (z. B. die Kopfzeile "Word" oder Leerzeilen)
            if wort:
                woerter.append(wort)
    
    if not woerter:
        print("Keine Wörter in der TSV-Datei gefunden.")
        return

    # 2. String erstellen: Jedes Wort bekommt ein "@" als Präfix
    # Beispiel: ['A', 'B'] wird zu "@A@B"
    ergebnis_string = "".join(f"@{wort}" for wort in woerter)
    
    # 3. Nahtlos an die Zieldatei anhängen ('a' steht für append)
    # Da wir 'write()' nutzen und keinen Zeilenumbruch hinzufügen,
    # wird der String absolut nahtlos an das Ende der Datei angehängt.
    with open(ziel_pfad, 'a', encoding='utf-8') as f:
        f.write(ergebnis_string)

    print(f"Erfolgreich {len(woerter)} Wörter nahtlos an '{ziel_pfad}' angehängt.")

# Pfade definieren
tsv_datei = "extracted_fields1.tsv"
ziel_datei = r"C:\Users\user\Desktop\vocliste.txt"

# Programm ausführen
if __name__ == "__main__":
    # Falls die TSV-Datei im selben Ordner wie das Skript liegt, wird sie so gefunden
    verarbeite_tsv(tsv_datei, ziel_datei)