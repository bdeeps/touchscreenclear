<!-- glassbox:start -->
<!-- Generated from glassbox.json by the Glassbox hub (npm run readme -- touchscreenclear). Edit glassbox.json, not this block. -->

<h1 align="center">TouchscreenClear</h1>

<p align="center"><b>How does a touchscreen work?</b><br>A phone screen can't feel pressure. It reads a tiny change in an electric field as your fingertip steals a little of it. Pull the glass apart, scan the grid, merge two fingers into one and watch gloves fail.</p>

<p align="center"><a href="https://glassbox.how/touchscreenclear/"><b>▶ Play with it</b></a> &nbsp;·&nbsp; <a href="https://glassbox.how/e/touchscreenclear/">Read the 60-second explainer</a></p>

<p align="center">
  <a href="https://glassbox.how/e/touchscreenclear/"><img alt="Glassbox No. 223" src="https://img.shields.io/badge/Glassbox-No.%20223-8ef0ff"></a>
  <a href="https://glassbox.how/e/touchscreenclear/"><img alt="Computing" src="https://img.shields.io/badge/field-Computing-8ef0ff"></a>
  <a href="LICENSE"><img alt="Code: MIT" src="https://img.shields.io/badge/code-MIT-3fb950"></a>
  <a href="LICENSE-CONTENT.md"><img alt="Content: CC BY 4.0" src="https://img.shields.io/badge/content-CC%20BY%204.0-ef9421"></a>
  <a href="#privacy"><img alt="Privacy: explained" src="https://img.shields.io/badge/privacy-explained-555"></a>
</p>

## In 60 seconds

1. **A sandwich of glass.** A phone screen is a stack about one to two millimetres thick: strengthened cover glass, a clear adhesive, a touch sensor and the display. The sensor is a grid of transparent electrodes, rows in one layer and columns in the next, made of a clear conductor such as indium tin oxide or a fine metal mesh. On many phones it is built into the display panel itself.
2. **Your finger steals a little field.** Every crossing of a row and a column holds a tiny electric field, which is a capacitor. Your body is a conductor, so a fingertip near a crossing takes some of that field. Less signal reaches the column and the reading drops slightly. The glass does not matter, because the field reaches through it. Pressure does not matter either.
3. **Scan the grid.** The controller drives one row at a time and reads every column. After the last row it has a heat map of changes from a stored no-touch baseline. Then it starts again, typically 60 to 240 times a second. Mutual capacitance like this is what lets a screen report many touches at once.
4. **From a blob to a point.** A fingertip is wider than the electrode spacing, so it makes a blob across several crossings. The chip takes a weighted average of the blob, a centroid, so the answer falls between electrodes. Each separate blob is a separate touch. Very close fingers merge into one blob, and a blob that is too big is a palm, which the phone ignores.
5. **Why gloves and wet screens fail.** The sensor needs a conductor close to its field. A wool glove holds the finger too far away, and plastic is not a conductor. Gloves with conductive thread, or a glove mode that raises sensitivity, can help. Water conducts too, so drops can look like touches and a wet film blurs a real one. Controllers filter this, but a wet screen is still the hard case.
6. **Older and other ways.** A resistive screen has two flexible resistive layers that touch when you press. A voltage ramp across one layer, read by the other at the contact, gives the position. It works with any object, but needs a press. Infrared frames and surface acoustic waves find touches with blocked light or absorbed ultrasound. Haptics then touch back, with a small actuator that shakes for a moment.

## Words worth knowing

| Term | Meaning |
|---|---|
| **Capacitance** | How much charge a pair of conductors holds for a given voltage. It depends on their shape, distance and what lies between them. |
| **Mutual capacitance** | The capacitance between a row electrode and a column electrode. A nearby finger makes it drop. |
| **Electrode** | A thin strip of conductor. A touch sensor is a grid of them, rows crossing columns. |
| **Transparent conductor** | A material, such as indium tin oxide, that carries current and lets light through. |
| **Baseline** | The stored reading for each crossing with nothing touching. The controller reports the change from it. |
| **Centroid** | The weighted average position of a blob. It lets a coarse grid report a precise point. |
| **Multitouch** | Reporting several touches at once, each with its own position. |
| **Palm rejection** | Ignoring blobs that are too large or the wrong shape to be a fingertip. |
| **Resistive touchscreen** | A screen with two flexible resistive layers that touch where you press. |
| **Haptics** | Feedback you can feel, such as a small vibration when you touch the screen. |

## A short history

**From wires beside a radar tube in 1965 to glass that reads ten fingers in your pocket.**

- **1965** · A radar engineer describes a finger-driven screen (Eric A. Johnson, Malvern, England)
- **1972** · Infrared beams for the PLATO classroom terminal (Frederick Ebeling, Roger Johnson and Richard Goldhor, University of Illinois, Urbana, USA)
- **1973** · CERN builds the first working touch capacitor (Frank Beck, Bent Stumpe and Chick Nichols, CERN, Geneva, Switzerland)
- **1975** · A resistive sensor that ignores the writer's hand (George S. Hurst and William C. Colwell Jr., Oak Ridge, Tennessee, USA)
- **1982** · A camera behind frosted glass sees many fingers (Nimish Mehta, supervised by K. C. Smith, University of Toronto, Canada)
- **1983** · HP-150: a touchscreen office computer (Hewlett-Packard, USA (Las Vegas Comdex, per Wikipedia))
- **1985** · A Toronto tablet reports every finger and how hard it presses (SK Lee, Bill Buxton and K. C. Smith, University of Toronto, Canada)
- **1994** · IBM Simon: a phone with a touchscreen (IBM, with Mitsubishi Electric (per Wikipedia), Las Vegas and USA)

The full story, with 31 moments, charts, people and 39 sources: [glassbox.how/e/touchscreenclear/history](https://glassbox.how/e/touchscreenclear/history/). The data lives in [`history.json`](history.json).

## Privacy

This box has no accounts and no ads, and it ships its own fonts and libraries. When you run it yourself it sends nothing anywhere. On glassbox.how, the site's `/bar.js` also loads Glassbox's analytics: **Google Analytics** to count visits (it asks first in the EU, UK and Switzerland, and stays off when your browser sends Global Privacy Control or Do Not Track) and **ClickTrust** to detect bots.

It remembers a few things **in your own browser only**, and never sends them anywhere:

| Browser storage key | What it holds |
|---|---|
| `touchscreenclear.v1` | Which chapters you have opened, your best quiz scores, and sound on or off. |

Exactly what each one sees is at [glassbox.how/privacy](https://glassbox.how/privacy/).

## Licences

- **Code:** [MIT](LICENSE). Use it, change it, ship it.
- **Explanations, text, images and videos** (`glassbox.json`, `glassbox/`): [CC BY 4.0](LICENSE-CONTENT.md). Credit “Glassbox, glassbox.how/e/touchscreenclear”.
- **Third-party parts** keep their own licences: [three.js](https://threejs.org) (MIT), [Geist, Instrument Serif](https://openfontlicense.org) (SIL OFL 1.1).
- The Glassbox name and logo aren't covered by either licence. See the [terms](https://glassbox.how/terms/).

Found a mistake? [Open an issue](https://github.com/bdeeps/touchscreenclear/issues). Corrections happen in public.
<!-- glassbox:end -->

## Run it

It's plain HTML, CSS and JavaScript. No build step and no dependencies. Run locally, it contacts no other website.

```bash
python3 -m http.server 8000
```

Three.js and the fonts ship in `vendor/` and `fonts/`, so it also works offline.

Then open http://localhost:8000.

## How it's built

| File | What |
|---|---|
| `index.html`, `css/app.css` | The page and its styles |
| `js/app.js`, `js/stage.js`, `js/ui.js`, `js/kit.js` | The shared Glassbox 3D engine: chapters, 3D stage, controls, quiz, video director |
| `js/chapters/*.js` | One file per chapter: the 3D model, controls, text, key terms, quiz and video scenes |
| `glassbox.json` | Title, question, explainer beats, key terms, browser storage and credits shown on glassbox.how |
| `reel` in each chapter | The storyboard the Glassbox studio records into short videos |
| `glassbox/` | The published video, slides, thumbnail and post copy |
| `fonts/`, `vendor/three/` | Self-hosted Geist and Instrument Serif (SIL OFL 1.1) and three.js (MIT) |
