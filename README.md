# Sarah's Thailand Adventure

GitHub Pages-only travel journal. No Vercel, database, backend, or other hosting service is required.

## Repository structure

```text
index.html
style.css
app.js
config.js
data/
  travel.json
photos/
```

## GitHub setup

1. Put these files in the `jetavi-dev/SM_site` repository.
2. Keep `data/travel.json` at exactly that path.
3. Create a **fine-grained GitHub Personal Access Token** restricted to this repository only.
4. Give it:
   - Repository access: `SM_site` only
   - Contents: **Read and write**
   - Metadata: read-only (automatic)
5. Open `config.js` and replace:

```js
githubToken: "PASTE_YOUR_FINE_GRAINED_TOKEN_HERE",
```

with the token.
6. Change `editorPassword` to the password Sarah should use.
7. Push the files to GitHub Pages.

Sarah then only needs to use the editor password. She will not be asked for a GitHub token.

## Important security note

This is intentionally a GitHub Pages-only solution. GitHub Pages is static, so a GitHub token placed in `config.js` is technically visible to anyone who inspects the site's source/network traffic. The token must therefore be treated as a limited personal-use token, not a secret.

For this personal/friends-only journal, keep the token **fine-grained and restricted to `SM_site` only**. Do not give it access to other repositories or broader account permissions.

If the site ever becomes public or contains sensitive information, remove the browser-side token approach and use a server-side authentication layer.

## Editor behavior

- `EDIT JOURNAL` opens the editor.
- Sarah enters the configured password.
- The unlocked state is remembered locally on that device.
- `LOG OUT` clears that local editor state.
- Saving locations, diary entries and posts updates `data/travel.json` directly through the GitHub Contents API.
- Uploading a photo writes it directly to `photos/` and then updates `data/travel.json`.

## Printing

The printed journal uses the actual Leaflet map currently displayed on the page, including its OpenStreetMap tiles, route and markers, rather than the previous dots-only SVG route diagram.
