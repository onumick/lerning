# Listen & Write

Listen & Write is a browser-based dictation practice app focused on Botswana English learning content.
It helps learners move from short sentences to longer paragraphs using a study -> listen -> self-check loop.

## Features

- Level-based roadmap (Sentences, Paragraphs, and a Documents placeholder).
- Phase and part navigation generated from JSON data files.
- Flashcard workflow:
  - Study phase (read and visualize)
  - Dictation phase (listen and write)
  - Self-correction panel (check your answer)
- Speech synthesis fallback for audio playback when no audio file is provided.
- Optional microphone recording to use your own voice for dictation playback.
- Progress tracking with `localStorage` (`completedDecks`).

## Project Structure

```
.
|- index.html
|- botswana_sentences.json
|- botswana_paragraphs.json
|- css/
|  |- styles.css
|- js/
|  |- data.js
|  |- app.js
```

## Getting Started

Because the app loads JSON with `fetch()`, run it through a local HTTP server (do not open `index.html` directly as a file).

### Option 1: Python (recommended)

```bash
cd /home/heisenberg/Desktop/Projects/lerning
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## How Data Is Organized

- `js/data.js` loads:
  - `botswana_sentences.json`
  - `botswana_paragraphs.json`
- Sentences are chunked into parts of 20 cards.
- Paragraphs are chunked into parts of 5 cards.
- The app builds UI levels/phases/parts dynamically from this processed data.

## Progress Storage

- Completed parts are stored in browser storage under key `completedDecks`.
- Clearing browser storage will reset progress.

## Notes

- Audio URLs are currently placeholders in generated cards (`audioUrl: ""`).
- If custom voice recording is enabled, microphone permission is required in the browser.
