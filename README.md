# Victor Santos — Interactive Portfolio

An immersive, space-themed portfolio built with Vite, React, TypeScript, React Three Fiber, and GSAP.

## Run locally

```bash
pnpm install
pnpm dev
```

## Quality checks

```bash
pnpm lint
pnpm test
pnpm build
```

The Three.js scene is lazy-loaded and progressively degrades to a CSS backdrop when WebGL is unavailable. The interface also supports reduced motion, keyboard navigation, project deep links, and mobile-specific rendering limits.

## Portfolio admin

Double-click or double-tap the **VS** brand mark to open `/admin`. The editor keeps changes in a private draft until **Publish portfolio** is confirmed. It supports all portfolio sections, keyboard-friendly ordering controls, draft preview, and résumé PDF replacement.

The deployed site uses Sites D1 for portfolio revisions and login throttling, plus Sites R2 for uploaded résumés. Admin credentials are PBKDF2 verifiers and signed-session secrets stored only as hosted environment secrets.

To generate a replacement credential set locally:

```bash
pnpm admin:secrets
```

Copy the three generated values into the matching hosted secret names. Never commit them to the repository.
