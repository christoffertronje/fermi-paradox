# Fermi Paradox

An interactive journey through cosmic time, a hypothetical Milky Way expansion, and the question “Where is everybody?”

```sh
npm install
npm run dev
```

`npm run build` runs TypeScript validation and creates the static site in `dist/`.

Pushes to `main` deploy through GitHub Actions. In repository **Settings → Pages**, set **Build and deployment → Source** to **GitHub Actions**. The Vite base path is `/fermi-paradox/`.

The simulator is an illustrative expansion-front calculation. Its assumptions and sources are available in the site footer.
