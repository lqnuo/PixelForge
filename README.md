# image

An Electron application with React and TypeScript

## Features (MVP)

- Upload images (click or drag-and-drop), deduplicate by sha256
- Generate mock results via background jobs with live updates
- Preview thumbnails (client-side resized), download results to disk
- Local SQLite DB at Electron `userData/app.db` with WAL for stability

## Data & Privacy

- All data is stored locally on your machine: images and results are saved as BLOBs inside `userData/app.db`.
- Logs are stored at `userData/logs/app.log` and rotate at 5MB (keep 3 files).

## Shortcuts

- `R` or `Enter`: trigger generation for the selected image
- `Delete` or `Backspace`: delete the selected image (with confirm)
- `Ctrl/Cmd + J`: open the system Downloads folder

## Known Limitations

- Large image BLOBs increase DB size; consider external file storage in future.
- Simple mock generator is used; replace with real model/service as needed.
- No signing/notarization configured for production builds yet.

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Project Setup

### Install

```bash
$ pnpm install
```

### Development

```bash
$ pnpm dev
```

### Build

```bash
# For windows
$ pnpm build:win

# For macOS
$ pnpm build:mac

# For Linux
$ pnpm build:linux
```

## Where is the database?

The app database is created at Electron's `userData` directory, which varies by OS:

- macOS: `~/Library/Application Support/<productName>/app.db`
- Windows: `%APPDATA%\\<productName>\\app.db`
- Linux: `~/.config/<productName>/app.db`

You can clear data via the app’s IPC `db.clear('CONFIRM_CLEAR')` exposed on `window.api.db.clear`.
