# BOOP

BOOP is a portfolio concept for a dog hotel in New York. This static website includes responsive layouts, a service and date picker, and a demo enquiry form. The form validates entries in the browser and displays a confirmation. All form data stays on the page.

[View the live demo](https://boop-restored.toriyume.chatgpt.site/)

## Run locally

From the repository root, run:

```sh
python3 -m http.server 8000
```

Open http://localhost:8000 in your browser. No build step is required.

## Project structure

- `index.html` — page markup
- `styles/site.css` — layout, responsive styles, and motion
- `scripts/site.js` — page interactions and demo form
- `assets/` — images, video, icons, and fonts
- `netlify.toml` and `_headers` — hosting configuration
