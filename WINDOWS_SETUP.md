# Run AssetQ on Windows

`/workspace/asset` is a path on the cloud machine. It does not exist on your Windows computer.

1. Install Node.js LTS (22.12 or newer) from https://nodejs.org.
2. Install Python 3.12 or newer from https://www.python.org/downloads/windows/. Keep the Python launcher enabled in the installer.
3. Extract this ZIP to your Desktop. The ZIP contains an `AssetQ` folder.
4. Open that folder and double-click `START_ASSETQ.bat`. It installs the app dependencies and starts the application. Internet access is needed for the first installation.
5. Keep the command window open. Open your browser using the Local address printed by Vite in that window.
6. Create your organization workspace and administrator account in AssetQ. Then use the setup checklist for locations, departments, team accounts, and assets.

If you prefer Command Prompt, after extracting the folder directly to your Desktop run:

```bat
cd /d "%USERPROFILE%\Desktop\AssetQ"
npm ci
npm run dev
```

If your Desktop is in OneDrive or you extracted elsewhere, open the `AssetQ` folder in File Explorer, type `cmd` into its address bar, and press Enter. Then run `npm ci` and `npm run dev`. This avoids guessing the folder's path.

AssetQ automatically checks for the Python launcher or Python executable. If Python is not found, finish installing it and reopen the command window. For time-zone setting changes on Windows, install the official time-zone data with `py -3 -m pip install tzdata` if the application reports an unavailable time zone.

Your local data is created in `AssetQ\.data\assetq.sqlite3`. This download excludes cloud databases, passwords, sessions, environment variables, and test customer data. Register a new workspace on your computer.

This starts AssetQ locally on your computer; public SaaS hosting is a separate deployment step.
