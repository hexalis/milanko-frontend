<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/assets/readme/hero-dark.svg">
  <img src="docs/assets/readme/hero-light.svg" width="100%" alt="Milanko · Earth Trend Detective. Not every change is a trend. Ask the planet a question and follow the clues in NASA data, step by step, to an honest verdict.">
</picture>

<br>

<a href="https://milanko.hexalis.org/app"><img src="docs/assets/readme/badge-live.png" height="28" alt="Live: milanko.hexalis.org"></a>
<a href="https://www.spaceappschallenge.org/"><img src="docs/assets/readme/badge-space-apps.png" height="28" alt="NASA Space Apps 2026"></a>
<a href="https://milanko.hexalis.org/app"><img src="docs/assets/readme/badge-languages.png" height="28" alt="Languages: EN · ES"></a>

[**Try it live →**](https://milanko.hexalis.org/app) &nbsp;·&nbsp; [How we know](https://milanko.hexalis.org/app/method) &nbsp;·&nbsp; [The team](https://milanko.hexalis.org/app/team) &nbsp;·&nbsp; [Developer guide](docs/development.md)

</div>

## Why Milanko?

Headlines say _"record heat"_ and _"more disasters than ever"_. Nature is noisy: one hot summer is not a warming trend, and more storms on a list may only mean more counting. **Milanko turns 45 years of NASA measurements into a detective game**: anyone, a 12-year-old, a curious adult or a scientist, asks a question and finds out, with a real statistical test, whether the change is **real or just chance**.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/assets/readme/figures-dark.png">
  <img src="docs/assets/readme/figures-light.png" width="100%" alt="45 years of measurements (1981–2025) · 38 case files, each with its verdict · 24,353 NASA EONET events audited one by one · 256 reference points across the planet">
</picture>

## Investigate like a detective

Pick **what** and **where**, and Milanko walks you through eight short steps, from a question to a verdict you can check yourself.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/assets/readme/journey-dark.png">
  <img src="docs/assets/readme/journey-light.png" width="100%" alt="The eight steps: 1 Pick what and where · 2 Look at the place · 3 Meet the NASA data · 4 Bet on the answer · 5 See decades of data · 6 Trend or chance? · 7 Did you get it right? · 8 Check it yourself">
</picture>

<table>
<tr>
<td width="50%" valign="top">
<img src="docs/assets/readme/shot-lesson.webp" width="100%" alt="The guided lesson: the reader bets that soil wetness in Central Chile is going down and the trend line confirms −8 % since 1981">
<p align="center"><b>Make a hypothesis, then let the data answer.</b><br><sub>Your bet against the trend line, and what the test really says.</sub></p>
</td>
<td width="50%" valign="top">
<img src="docs/assets/readme/shot-case-file.webp" width="100%" alt="A case file: 'Has air temperature changed in Svalbard since 1981? Yes, it changed: +3.48 °C', with the Mann-Kendall and Theil-Sen figures">
<p align="center"><b>Every case file ends in a verdict.</b><br><sub>Plain words first; Mann-Kendall and Theil-Sen right below.</sub></p>
</td>
</tr>
<tr>
<td width="50%" valign="top">
<img src="docs/assets/readme/shot-globe.webp" width="100%" alt="The 3D globe zoomed on Europe, with case-file pins and a side panel listing anomaly files such as Etna, a wildfire in Spain and a flood in Türkiye">
<p align="center"><b>Spin the whole planet.</b><br><sub>Case files, NASA events, live weather and data layers on a 3D globe.</sub></p>
</td>
<td width="50%" valign="top">
<img src="docs/assets/readme/shot-method.webp" width="100%" alt="How we know: 1981–2025, 38 case files, 24,353 EONET events audited and the five steps Observe, Download, Summarise, Test, Decide">
<p align="center"><b>Open science, no black box.</b><br><sub>Five steps, two hands-on labs and every limit said plainly.</sub></p>
</td>
</tr>
</table>

### Made for every screen and every reader

- Fully bilingual, **English and Español**, switchable at any time.
- A _"How does this page work?"_ guided tour on every page.
- Light and dark themes, and reduced motion.
- Keyboard and screen-reader friendly, audited with axe.

<p align="center"><img src="docs/assets/readme/phone.webp" width="260" alt="Milanko on a phone: the Earth with its four doors and the bottom tab bar"></p>

## Honest by design

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/assets/readme/principles-dark.png">
  <img src="docs/assets/readme/principles-light.png" width="100%" alt="Four principles. Trend, anomaly and event are different: a trend lasts decades, an anomaly is a few weeks far from normal, an event is something NASA logged at a place and a date. We measure, we do not blame: a case file says what changed, where and by how much, not a cause or a forecast. 'Inconclusive' is an answer too: when the data are not enough we say so, and why that does not mean nothing changed. Every number is checkable: each figure has its unit, period and source; download the CSV and repeat the test.">
</picture>

## Built on NASA open data

| Source                                                      | What it gives us                                             |
| ----------------------------------------------------------- | ------------------------------------------------------------ |
| [**NASA POWER · MERRA-2**](https://power.larc.nasa.gov/)    | Daily temperature, rain and soil water everywhere since 1981 |
| [**MODIS / Terra · ORNL DAAC**](https://modis.ornl.gov/)    | Vegetation (NDVI) seen from orbit at 250 m                   |
| [**NASA EONET v3**](https://eonet.gsfc.nasa.gov/)           | Natural events: wildfires, storms, floods, volcanoes         |
| [**NASA GIBS**](https://nasa-gibs.github.io/gibs-api-docs/) | Satellite imagery and the Blue Marble Earth                  |

## Under the hood

![Next.js](https://img.shields.io/badge/Next.js_16-000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React_19-149eca?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_4-0ea5e9?logo=tailwindcss&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js_globe-000?logo=threedotjs&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-6e9f18?logo=vitest&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-2ead33?logo=playwright&logoColor=white)

Server Components read the Milanko API; every view keeps its filters in the URL, so any screen can be shared. Every push passes the same gate locally and in CI (format, lint, types, 500+ tests and dead-code checks) before it ships to production.

```bash
git clone https://github.com/hexalis/milanko-frontend.git && cd milanko-frontend
pnpm install            # fetches the exact Node version and installs the Git hooks
cp .env.example .env.local
pnpm dev                # → http://localhost:3000
```

Architecture, environments, scripts and conventions live in the **[developer guide](docs/development.md)** (Spanish).

## The team

Built for the **2026 NASA Space Apps Challenge**, _"Be An Earth System Trend Detective!"_

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/assets/readme/team-dark.webp">
  <img src="docs/assets/readme/team-light.webp" width="100%" alt="The team: Jorge Ramos, Product Designer and team lead · Roger Guido, Software Developer · Anthony Aguilar, Product Investigator · Carlos Pérez, Software Engineer · Marlon Baltodano, Software Engineer · Francelia López, Software Developer">
</picture>

<div align="center">

A **[Hexalis](https://hexalis.org)** project · _Knowledge is universal._

<sub>Milanko is an independent project for NASA Space Apps 2026. It uses public NASA data; it is not an official NASA app.<br>
We used Claude (Anthropic) to help write code, draft copy and review statistics; every number comes from NASA data processed by our open scripts.</sub>

</div>
