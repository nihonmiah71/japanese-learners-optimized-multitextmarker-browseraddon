## Disclaimer

The python scripts will probably not run on your system unless you installed all the right packages, some of them might only be supported for older pyhton versions (Python 3.12), debug with AI and install the required packages as needed.


---

## Overview

<img width="2266" height="884" alt="image" src="https://github.com/user-attachments/assets/c82f63f2-68ab-4e71-8f36-2b2e8f9c3dfc" />

---


## 🌟 What Text Markierer Pro Does (Key Features)

Text Markierer Pro is a Google Chrome extension that scans any website you are reading, automatically finds specific words or patterns from your study list, and highlights them for you.

### 1. Smart Visual Highlighting

Instead of highlighting every word with the same color, it organizes them so you can analyze the text at a glance:

* **Color by Language Type:** It instantly checks how a Japanese word is written. Mixed words (Kanji + Kana) turn **Blue**, pure phonetic words (Hiragana/Katakana) turn **Grün (Green)**, and pure **Kanji** words turn **Rot (Red)**.


* **Color by Frequency:** The extension counts how many times a word appears on the page. If a word appears only once or twice, it gets a very light pastel highlight. If it appears frequently, the color automatically becomes much darker and more vibrant.


* **Pattern Matching (Regex):** If you search for advanced text patterns rather than exact words, those matches will highlight in **Gold**.



### 2. The Interactive Dashboard

Whenever you start highlighting, a small blue handle appears on the edge of your webpage. Clicking it opens an analysis panel with three simple views:

* **Frequency:** Shows you a list of your words ranked by how often they appear on the current page.


* **Chronological:** Lists the words in the exact order they appear from the top of the page to the bottom. Clicking any word in this list will smoothly scroll your browser right to that paragraph and make it flash purple so you don't lose your place.


* **Sorted:** Groups all your discovered words neatly by your original search terms.



### 3. Quick Navigation & Built-in Safety

* **Double-Click Jump:** If you see a highlighted word in an article and want to find where it appears next, just double-click it. The page will automatically scroll straight to the next occurrence of that word.


* **Accidental Flood Protection:** The extension automatically ignores short phonetic words (under 3 characters and only hirangana) so your screen doesn't get flooded with common grammatical particles.


* **Auto-Save:** It remembers your search terms and settings automatically every time you open or close it.


---
## Demo

<video src="https://github.com/user-attachments/assets/e962ad63-3a1b-47c9-84d4-3fbccbbb1588" width="854" controls></video>

---

## 🔄 Step-by-Step Workflow: How to Update Your List

To automatically move new words you are learning from your **Anki** flashcards straight into the **Chrome Extension**, you just need to follow these three steps:

### Step 1: Export Your New Words From Anki

1. Open your Anki Browser and search for your current mining cards (using `deck:mining card:pronounciation`).
2. Sort them by the date they were created so your newest words are at the top.
3. Select your new cards, open the **"Extract Inject Fields"** add-on menu, and choose **"Extract Fields"**.
4. Select the `Word` field, choose plain text export, and save the file in your working folder exactly under the name **`extracted_fields1.tsv`**.

https://github.com/user-attachments/assets/e1f7a36a-5fb6-4aff-8836-d2fc8ef7ddb6

### Step 2: Run the Python script vocappend.py

1. Open your computer's Command Prompt (CMD) in the folder where you saved these addon files
2. Run your Python script (`vocappend.py`). (enter py vocappend.py)

https://github.com/user-attachments/assets/9014ee9d-5d1d-4d8d-9426-3e95aeab5619

### Step 3: Load the Words Into Chrome

1. Click the Text Markierer Pro extension icon in your Google Chrome toolbar.
2. Click the button labeled **"Liste Importieren"** (`btnLoad`).
3. Go to the folder where you saved this addon, click on voclist.txt.

Now, whenever you browse any website, the extension will immediately catch, color-code, and track those exact vocabulary words live while you read!

---

### 📝 Note: How to Manually Remove Words from Your List

If you ever want to stop a specific word from being highlighted, you can easily remove it from your list manually.

For example, to remove the word **"example"**:

1. Open your master text file (**`vocliste.txt`**) on your Desktop.
2. Use the "Find and Replace" feature (Ctrl + F or Ctrl + H).
3. Search for the word wrapped in symbols: **`@example@`**
4. Replace it with just a single symbol: **`@`**
5. Save the file and click **"Liste Importieren"** in the Chrome extension to update it.
