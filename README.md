# Retro Breaker

A 3D rhythm-infused arcade brick breaker where a hover-mode DeLorean travels forward in time through iconic pop culture eras (movies, TV, games), shattering equalizer bricks to authentic era-specific synth music.

## Play

Run the local preview server with Node.js 22 or newer. There is nothing to install or build for the game itself:

```sh
npm start
```

Then visit <http://127.0.0.1:4179/>. Use `PORT=4180 npm start` for another port.

## Controls

| Action | Control |
| --- | --- |
| Move the paddle | Mouse, ← / →, or A / D. On touch screens, drag across the board |
| Launch the ball | Space, click, or tap |
| Pause / resume | P or Escape, or the Ⅱ button. Space also resumes |
| Mute all audio | M |
| Start / new game | Enter or the Start button; New game resets to level 1 |
| Theme, music, effects | Separate buttons in the header |

## Rules

- **The Time Machine Paddle**: You control a 3D DeLorean. Moving left/right tilts it.
- **Graphic Equalizer Bricks**: Break bricks to contribute to the music track's layers!
- **88 MPH**: Clear all bricks to time jump to the next year/era.
- **Power-Ups**: Catch power-ups like Flux Surge, Proton Cannons, and Laser Highway.
- **Hazards**: Dodge Tape Jams and Temporal Paradoxes.

## Develop

```sh
npm ci
npm test
npm start
```

## Source layout

| File | Purpose |
| --- | --- |
| `index.html`, `style.css` | Interface, themes, and responsive layout |
| `src/engine.js` | Physics, bricks, power-ups, bugs, lives, and levels |
| `src/main.js` | Three.js rendering, input, HUD, audio, and storage |
| `src/music.js` | Original synthesized Web Audio chiptune |
| `vendor/` | Three.js r180 module build and its MIT license |
| `scripts/` | Preview server, site staging, icon generator |
| `tests/` | Node engine tests |
