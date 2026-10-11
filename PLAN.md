# Retro Breaker: 80s Pop Culture & Audio Visualizer Game Plan

> **Codename**: *Retro Breaker* (formerly *Retro-Breaker*)  
> **Core Concept**: A 3D rhythm-infused arcade brick breaker where a hover-mode DeLorean travels forward in time through iconic pop culture eras (movies, TV, games), shattering equalizer bricks to authentic era-specific synth music.

---

## 1. Core Vision & Gameplay Pillars

1. **The Time Machine Paddle**:
   - You control a low-poly 3D **DeLorean DMC-12** in hover mode (wheels folded 90° flat, glowing cyan/blue repulsor thrusters underneath, and red LED taillights).
   - Moving left and right tilts the hovercar and leaves short light trails.
   - Headlights act as twin laser cannons when power-ups are active.

2. **The Graphic Equalizer Brick Grid ("Beat Breaker")**:
   - The brick field is styled as a **10-to-12 band Graphic Equalizer (EQ) spectrum**.
   - Columns represent audio frequencies (Sub-Bass, Bass, Mids, Highs, Treble).
   - Every time a brick is hit, it plays a musical synth note matching its column frequency and flashes like a VU meter.
   - Breaking bricks actually contributes to the music track's layers!

3. **Temporal Progression (Year-by-Year Levels)**:
   - Rather than generic levels, **each level is a specific year or epoch** featuring a world-famous pop culture franchise (movies, TV, arcade games).
   - Reaching 0 bricks triggers **"88 MPH"**—the time circuits flash, lightning arcs around the DeLorean, the screen warps into a temporal wormhole, and you drop into the next year with a brand-new visual backdrop and musical style.

---

## 2. Chronological Level Progression & Pop Culture Themes

| Level | Year / Era | Pop Culture Franchise / Theme | Visual Backdrop & Brick Aesthetic | Music & Sound Style (Web Audio API) |
| :--- | :--- | :--- | :--- | :--- |
| **Level 1** | **1982** | **Tron & The Arcade Dawn** | Cyan & neon-blue vector wireframes, de-rezzing bit particles, digital cubes. | *Minimalist 8-bit chip arpeggios & Wendy Carlos style square-wave synth pulses.* |
| **Level 2** | **1984** | **Ghostbusters & Gremlins** | New York skyline at midnight, green ectoplasm hazard bricks, proton-beam effects. | *Funky, punchy bassline with spooky synth brass stabs (Ray Parker Jr. energy).* |
| **Level 3** | **1985** | **Back to the Future** *(Signature Level)* | Hill Valley Clock Tower silhouette, lightning storm sky, plutonium fuel rods. | *Driving 1985 pop-rock synth (Huey Lewis / Alan Silvestri horns, power arps).* |
| **Level 4** | **1986** | **Top Gun & OutRun (SEGA)** | Sunset gradient horizon, wireframe palm trees, checkered road vanishing point. | *High-energy "Danger Zone" / SEGA OutRun style FM synth bass & gated reverb snares.* |
| **Level 5** | **1987** | **RoboCop & Predator** | Dystopian Detroit industrial steel, green thermal vision blocks, HUD targeting reticles. | *Heavy industrial synth pulses, mechanical metallic clangs on brick impact.* |
| **Level 6** | **1989** | **Batman & Game Boy Era** | Gothic Gotham gargoyles in misty rain, monochrome pea-green bonus blocks. | *Dark orchestral synth stabs (Danny Elfman) transitioning into catchy Game Boy chiptune.* |
| **Level 7** | **1991** | **Terminator 2: Judgment Day** | Molten steel foundry glow, reflective chrome T-1000 liquid metal bricks (high HP). | *Brad Fiedel's iconic metallic anvil clanks, driving industrial bassline.* |
| **Level 8** | **1993** | **Jurassic Park** | Amber mosquito blocks, Isla Nublar storm clouds, electrified fence hazards. | *Majestic, soaring analog synth melodies with deep rumble bass.* |
| **Level 9** | **1999** | **The Matrix & Y2K Millennium** | Cascading green digital rain code, dial-up sound wave hazards, glitching terminal blocks. | *Fast breakbeat techno / big beat synth (The Prodigy / Chemical Brothers style).* |

---

## 3. Power-Ups & Hazards (Pop Culture Inspired)

### Power-Ups
- **88 MPH / Flux Surge**: The ball ignites with twin fire trails, puncturing through single-hit bricks without bouncing for 6 seconds.
- **Proton Cannons / Twin Lasers**: DeLorean headlights fire rhythmically timed laser bolts straight up to melt columns of bricks.
- **Laser Grid Highway (Safety Net)**: A glowing wireframe neon road stretches under the hovercar for 15 seconds to catch one dropped ball.
- **Multi-Timeline (Multi-Ball)**: Splits the ball into three chronal spheres.
- **Overclock / Bass Boost**: The ball doubles in size and causes a shockwave that damages adjacent bricks.

### Hazards & Obstacles
- **Tape Jam / Cassette Warp**: Distorts the synth pitch, slows audio playback tempo, and shrinks the DeLorean paddle for 8 seconds.
- **Static / Glitch Bricks**: Unbreakable blocks that refract the ball at unpredictable angles.
- **Temporal Paradox**: A wandering ghost hazard that deflects balls if you don't steer around it.

---

## 4. Audio Architecture (`src/music.js`)

Because the game uses the browser's native **Web Audio API** (zero external MP3/WAV files required), we can generate rich synthesized soundscapes on the fly:
1. **Dynamic Chiptune / Synth Engine**:
   - Multi-oscillator setup: Sawtooth (for 80s brass & leads), Square (for 8-bit arps), and Triangle (for deep synth bass).
   - Low-pass resonant filters with envelope generators for classic Moog/Juno filter sweeps.
2. **Interactive Audio ("Beat Breaker")**:
   - Brick collisions trigger pentatonic / dorian scale synth notes matching the column frequency.
   - Bass notes on the left paddle/bricks, soaring synth leads on the right.
   - Tempo and backing tracks smoothly transition when jumping to a new era.

---

## 5. Visual Styling & UI (`style.css` & `src/main.js`)

- **Arcade Cabinet Bezel**:
  - CRT screen curvature shader (subtle scanlines, phosphor glow, chromatic aberration).
  - LED digital segment score display (like a 1980s DeLorean dashboard / VCR clock).
  - Time Circuits HUD: Displays **Destination Year** (Current Level), **Present Year** (High Score era), and **Last Time Departed**.
- **3D World**:
  - Dark synthwave horizon with a shifting retro sun or city skyline.
  - DeLorean model: Low-poly Three.js mesh built with brushed steel and neon emissive materials.

---

## 6. Implementation Roadmap

### Phase 1: Rebranding & Workspace Prep
- [x] Clean up GitHub/Octocat terminology and branding in `index.html`, `README.md`, and `package.json`.
- [x] Update title, metadata, icons, and theme configuration.
- [x] Set up clean CRT retro styling variables in `style.css`.

### Phase 2: 3D DeLorean Paddle & Visualizer Board
- [x] Replace procedural Retro mascot with a 3D low-poly DeLorean hovercar in `src/main.js`.
- [x] Add glowing cyan hover thrusters with banking/tilting physics on paddle movement.
- [x] Rearrange brick layouts in `src/engine.js` into vertical Graphic Equalizer columns.

### Phase 3: Web Audio Synthwave Upgrade
- [x] Upgrade `src/music.js` with analog synth waveforms (Sawtooth + low-pass resonant filters).
- [x] Implement musical note scaling: hitting bricks plays notes in key with the soundtrack.
- [x] Add sound effects for power-ups (Flux capacitor charging whine, laser blasters, tire squeals).

### Phase 4: Era & Level Progression System
- [x] Implement the Level Timeline Engine (Year 1982 through 1999).
- [x] Create unique color palettes and background skyboxes for each era.
- [x] Build the "88 MPH" time jump transition effect between stages.

### Phase 5: Power-ups, Polish, & Cabinet FX
- [x] Rebrand power-ups to Flux Surge, Proton Blasters, Laser Highway, and Tape Jam.
- [x] Add particle sparks, fire trails, and camera shake on high-impact hits.
- [x] Add CRT scanline toggle and reduced-motion accessibility settings.

### Phase 6: Deployment & Hosting
- [x] Enable GitHub Pages on `ChrisBartkoski/retro-breaker` by updating `.github/workflows/pages.yml`.
- [x] Test local preview and home server (`bartkoski`) Docker/Nginx deployment by adding `Dockerfile` and `docker-compose.yml`.

---

## 7. Additional Feature Ideas (Backlog)
- **Boss Fights / Time Guardians**: After every few eras, face a large boss entity (e.g., a giant arcade machine or a robotic T-Rex) before jumping to the next year.
- **Narrative Log**: Collect "Time Fragments" which unlock brief text logs or audio snippets explaining the timeline's collapse.
- **Bonus Round - The Void**: A secret level accessed by breaking a specific sequence of bricks, entirely in wireframe, with superfast gameplay and high score multipliers.
- **Custom Soundtrack Integration**: Allow players to upload or link to their own local audio files to generate custom levels based on their music's EQ data.
- **Endless "OutRun" Mode**: A survival mode where you travel endlessly down a wireframe highway. Rows of bricks and hazards spawn infinitely as your speed continually increases until you crash.
- **Advanced WebGL Post-Processing**: Upgrade the CSS CRT scanlines to a Three.js `EffectComposer` pipeline for authentic screen curvature, aggressive neon bloom, chromatic aberration, and phosphor bleed.
- **Mobile Gyroscope Controls**: Hook into the Device Orientation API so players can physically tilt their phones to steer the DeLorean.
- **Procedural Era-Specific Music**: Build a procedural generator that mutates drum patterns and wave forms to match the era (e.g., 8-bit square waves in 1982, soaring 80s synth rock in 1986).
- **Local Co-Op (Player 2)**: Player 2 joins on the keyboard (e.g., controlling a Hoverboard) to help catch falling balls, featuring unique cooperative power-ups.

---

## 8. Phase 7: User Profiles, Accounts, Statistics & PostgreSQL Database Integration
Targeting deployment on `bartkoski.com`:
- [ ] Implement PostgreSQL schema for `users`, `user_profiles`, `user_settings`, `user_statistics`, `game_sessions`, and `leaderboards`.
- [ ] Create containerized REST API (`/api/v1/auth`, `/api/v1/profile`, `/api/v1/settings`, `/api/v1/games`).
- [ ] Add client-side account login/registration modals and profile drawer.
- [ ] Implement offline-first telemetry syncing: preserve local guest scores and sync with cloud on authentication.
- [ ] Add global and era-specific leaderboards.
