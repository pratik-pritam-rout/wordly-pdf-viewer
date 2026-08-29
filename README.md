# Wordly

Wordly is a browser-based PDF reader that lets you select a word or phrase in a text-based PDF and immediately view its English definitions.

PDFs are processed in the browser. Uploaded PDFs and reading progress are saved only on the user's device, so saved documents can be reopened later without uploading them again.

## Features

- Open and read text-based PDF files
- Select a word or phrase to see up to three English definitions
- Uses two public dictionary services for more reliable lookups
- Save uploaded PDFs locally in the browser with IndexedDB
- Reopen saved PDFs directly from the **On this device** library
- Resume a saved PDF on the page where it was last closed
- Keep text highlights when a saved PDF is closed and reopened
- Remove saved PDFs from the local device library
- Navigate pages using toolbar controls, the mouse wheel, or the Left and Right Arrow keys
- Zoom from 60% to 300%
- High-density PDF rendering for sharper pages

## Tech stack

- React 18
- Vite
- PDF.js (`pdfjs-dist`)
- Browser IndexedDB for device-local document storage

## Run locally

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or newer
- npm (included with Node.js)

### Installation

```bash
npm install
npm run start
```

Open `http://127.0.0.1:5173` in a modern desktop browser.

## Build for production

```bash
npm run build
```

The built files are created in the `dist` folder.

## AI page summaries

Wordly can summarize the currently displayed page through Gemini. This feature is designed for Vercel deployment: add `GEMINI_API_KEY` as an environment variable in the Vercel project settings. The key is used only by `api/summarize.js` on the server and is never sent to the browser.

## How to use

1. Select **Open PDF** or **Choose a PDF**.
2. Choose a text-based PDF from your device.
3. Drag across a word or phrase in the PDF to view definitions.
4. Use the page field, toolbar buttons, mouse wheel, or Left/Right Arrow keys to navigate.
5. Select **Close** when you finish reading. Wordly saves the current page for that PDF.
6. Next time you open Wordly, choose a document under **On this device** to continue reading.

## Privacy and storage

Wordly does not upload PDF files to a server. PDFs and their last-read page are stored in the browser's IndexedDB database for this website only.

Definitions are fetched from these public services, so a selected word or phrase is sent to them for lookup:

- [Free Dictionary API](https://dictionaryapi.dev/)
- [Datamuse API](https://www.datamuse.com/api/)

Clearing the browser's site data, using private browsing, or switching browsers/devices can remove access to locally saved PDFs.

## Limitations

- PDFs must contain an embedded text layer. Scanned or image-only PDFs need OCR and are not supported.
- Dictionary lookups require an internet connection and depend on the availability of the external dictionary services.
- Saved PDFs are available only in the same browser and browser profile where they were uploaded.

## Scripts

| Command                | Description                                       |
| ---------------------- | ------------------------------------------------- |
| `npm run start`        | Starts the Vite development server on `127.0.0.1` |
| `npm run dev`          | Starts Vite's development server                  |
| `npm run build`        | Creates a production build in `dist`              |
| `npm run preview`      | Previews the production build locally             |
| `npm run format`       | Formats files with Prettier                       |
| `npm run format:check` | Checks formatting with Prettier                   |
