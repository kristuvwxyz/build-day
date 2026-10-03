# Let Claude control my Chrome (one-time setup)

Claude can only use your Chrome when Claude runs **on your Mac** (a "Local" session).
Cloud sessions can't reach your computer. Do this once.

## 1. Put the project on your Mac
1. Press **⌘ + Space**, type **Terminal**, press Enter.
2. Paste this and press Enter (downloads your project into your home folder):
   ```
   cd ~ && git clone https://github.com/kristuvwxyz/build-day.git
   ```
   - If a box asks to install "command line developer tools", click **Install**, wait, then paste the line again.
   - If it asks for a GitHub username/password, sign in with your GitHub account (the password is a token from GitHub → Settings → Developer settings → Personal access tokens).
3. Paste this and press Enter (switches to the latest work):
   ```
   cd ~/build-day && git checkout claude/zealous-turing-un21qa
   ```

## 2. Open a Local session in the Claude desktop app
1. Open the **Claude** desktop app (get it at claude.ai/download if you don't have it).
2. Click the **Code** tab.
3. Start a new session → choose **Local** (not Cloud) → pick the folder **build-day** in your home folder.

## 3. Connect Chrome
1. In Chrome, click the Claude extension icon and make sure you're signed in with the **same account** as the desktop app.
2. Keep Chrome open. When Claude asks to use Chrome or to allow a site (Webcake, regal.famcoventures.com), click **Allow**.

## 4. Paste this as your first message in the Local session

```
Read CLAUDE.md. From now on you control my Chrome (Claude in Chrome) for this project and every other project.

1. Make this permanent for all my projects: create or update ~/.claude/CLAUDE.md with my profile from this repo's CLAUDE.md plus this rule: "For any website or browser task, use my Chrome via Claude in Chrome: open a new tab, do the task, and check the result yourself."
2. Test the Chrome connection: list my open tabs.
3. Do the pending Webcake edit: paste projects/regal-webcake/edits/2026-10-03-brand-name-ph.html into Webcake → Edit → General → </> HTML/JavaScript → Before </body> → Save → Publish. Then open regal.famcoventures.com and confirm the header says REGAL SPRITZ PH and the tab title changed. Screenshot it.
4. Check the shop header still fits on a 360px-wide phone screen with the new name "Regal Spritz PH" (projects/shop).
5. Commit and push, then finish with Done / Left / Next.
```

## Every time after that
Open the Claude app → **Code** → your **Local** session (or a new Local one in the project's folder) → just ask.
For a new project, make a new folder and start a Local session in it; the Chrome rule in ~/.claude/CLAUDE.md applies everywhere.
