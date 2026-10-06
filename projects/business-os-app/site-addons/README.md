# Website add-ons (regalspritz.com)

Small fixes for the WebCake site, one `.html` file each (a `<style>` and/or a `<script>`).
`build.mjs` bundles every file here into `public/site-addons.js`, which Vercel serves at
https://regal-spritz-os.vercel.app/site-addons.js.

WebCake loads it with one line in Settings > HTML/JavaScript > "Before </body>" (pasted once by K):

    <script src="https://regal-spritz-os.vercel.app/site-addons.js" defer></script>

To change the website: add or edit a file here, push to main. Live within about 5 minutes (cache), no WebCake paste.
Each script runs on its own (an error in one doesn't stop the others), and the bundle only runs once per page.
