# Webcake site fixes

One paste-in snippet (`webcake-fixes.html`) that:
- **Stops zoom in/out** (pinch, double-tap, Ctrl +/-; iPhone included), and stops iPhone zooming into form fields.
- **Centers the home video** on phone and tablet (screens up to 1024px wide). Desktop is unchanged.
- **Makes the site snappier**: taps respond instantly (no 300ms delay), images/videos lower down load only when needed, delayed animations start right away on mobile, muted background videos pause when off screen.

## Option A: paste into Webcake (recommended)
1. Open your site in Webcake → **Settings** → **Custom code** (the box for code in `<head>`).
2. Copy everything in `webcake-fixes.html` and paste it in.
3. Save → **Publish**. Check on your phone.

## Option B: you have the exported .html file
Put the file in this folder, then run:
```
python3 add_fixes.py your-page.html
```
(Adds the fixes to the page. Safe to run again; it won't duplicate.)
