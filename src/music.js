// Upgraded Web Audio. No audio files are downloaded.
const BPM = 124;
const STEP = 60 / BPM / 2; // eighth notes
const LOOKAHEAD = 0.12;

const THEMES = [
  // 0: Default / Tron (1982) - arpeggios
  {
    lead: [72, null, 76, 79, 81, null, 79, 76, 74, null, 77, 81, 79, null, null, null],
    bass: [48, 48, 45, 45, 41, 41, 43, 43],
    bpm: 124
  },
  // 1: Ghostbusters (1984)
  {
    lead: [72, null, 76, null, 72, null, 76, null, 77, null, 77, null, 77, null, null, null,
           72, null, 76, null, 72, null, 76, null, 74, null, 74, null, 74, null, null, null],
    bass: [48, 48, 48, 48, 53, 53, 53, 53, 48, 48, 48, 48, 50, 50, 50, 50],
    bpm: 115
  },
  // 2: Back to the Future (1985)
  {
    lead: [67, null, 72, null, null, null, 77, null, 76, null, 74, null, 72, null, null, null,
           74, null, null, null, 79, null, null, null, 72, null, null, null, null, null, null, null],
    bass: [43, 43, 48, 48, 48, 48, 48, 48, 50, 50, 55, 55, 48, 48, 48, 48],
    bpm: 110
  },
  // 3: Top Gun (1986)
  {
    lead: [72, null, 67, null, null, null, 65, null, 64, null, 62, null, 60, null, null, null,
           62, null, 64, null, 65, null, null, null, 67, null, null, null, null, null, null, null],
    bass: [48, 48, 48, 48, 41, 41, 41, 41, 43, 43, 43, 43, 45, 45, 45, 45],
    bpm: 100
  },
  // 4: RoboCop (1987)
  {
    lead: [79, null, 72, null, 79, null, 81, null, 79, null, 72, null, 74, null, null, null,
           79, null, 72, null, 79, null, 84, null, 82, null, null, null, null, null, null, null],
    bass: [48, 48, 48, 48, 48, 48, 48, 48, 50, 50, 50, 50, 50, 50, 50, 50],
    bpm: 95
  },
  // 5: Batman (1989)
  {
    lead: [74, null, null, null, 73, null, null, null, 72, null, null, null, 71, null, 72, null,
           74, null, null, null, 73, null, null, null, 72, null, null, null, 71, null, 72, null],
    bass: [50, 50, 50, 50, 49, 49, 49, 49, 48, 48, 48, 48, 47, 47, 48, 48],
    bpm: 105
  },
  // 6: Terminator 2 (1991)
  {
    lead: [62, null, 57, null, null, null, 62, null, null, null, 65, null, 64, null, null, null,
           62, null, 57, null, null, null, 62, null, null, null, 60, null, null, null, null, null],
    bass: [50, null, 50, 50, null, 50, null, null, 50, null, 50, 50, null, 50, null, null],
    bpm: 90
  },
  // 7: Jurassic Park (1993)
  {
    lead: [70, null, 69, null, 70, null, null, null, 65, null, null, null, 62, null, null, null,
           70, null, 69, null, 70, null, null, null, 65, null, null, null, 62, null, null, null],
    bass: [46, 46, 46, 46, 41, 41, 41, 41, 43, 43, 43, 43, 46, 46, 46, 46],
    bpm: 85
  },
  // 8: The Matrix (1999) - Clubbed to death / Spybreak feel
  {
    lead: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
           72, null, 75, null, 77, null, 72, null, 79, null, 75, null, 72, null, null, null],
    bass: [48, 48, 51, 48, 48, 48, 51, 48, 48, 48, 51, 48, 48, 48, 51, 48],
    bpm: 135
  }
];

const PENTATONIC = [0, 3, 5, 7, 10, 12, 15, 17, 19, 22, 24]; // 11 notes for the 11 columns
const freq = (midi) => 440 * 2 ** ((midi - 69) / 12);

export class Chiptune {
  constructor(context, destination = context.destination) {
    this.context = context;
    this.output = context.createGain();
    this.output.gain.value = 0.16;
    this.output.connect(destination);
    this.enabled = true;
    this.playing = false;
    this.transpose = 0;
    this.timer = null;
    this.step = 0;
    this.next = 0;
    this.voices = new Set();
    this.theme = THEMES[0];
  }

  setEnabled(value) { this.enabled = Boolean(value); this.sync(); }
  setPlaying(value) { this.playing = Boolean(value); this.sync(); }
  setLevel(level) { 
    this.transpose = [0, 2, -3, 5][(Math.max(1, level) - 1) % 4]; 
    const idx = (Math.max(1, level) - 1) % THEMES.length;
    this.theme = THEMES[idx];
  }

  sync() {
    const run = this.enabled && this.playing && this.context.state === 'running';
    if (run && this.timer === null) {
      this.next = this.context.currentTime + 0.05;
      this.timer = setInterval(() => this.tick(), 30);
      this.tick();
    } else if (!run && this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
      const now = this.context.currentTime;
      for (const voice of this.voices) {
        voice.gain.gain.cancelScheduledValues(now);
        voice.gain.gain.setValueAtTime(0, now);
        try { voice.osc.stop(now + 0.01); } catch { /* already stopped */ }
      }
      this.voices.clear();
    }
  }

  tick() {
    const stepDuration = 60 / this.theme.bpm / 2;
    while (this.next < this.context.currentTime + LOOKAHEAD) {
      const leadArr = this.theme.lead;
      const bassArr = this.theme.bass;
      const i = this.step % Math.max(leadArr.length, bassArr.length * 2);
      
      const leadIdx = i % leadArr.length;
      const lead = leadArr[leadIdx];
      // Triangle for lead, cleaner than sawtooth
      if (lead !== null) this.note(freq(lead + this.transpose), this.next, stepDuration * 0.85, 'triangle', 0.12, false);
      
      // Bass
      if (i % 2 === 0) {
         const bassIdx = Math.floor(i / 2) % bassArr.length;
         const bass = bassArr[bassIdx];
         if (bass !== null) this.note(freq(bass + this.transpose), this.next, stepDuration * 1.6, 'sine', 0.22, false);
      }

      this.next += stepDuration;
      this.step += 1;
    }
  }

  note(frequency, time, length, type, level, useFilter = false, filterQ = 4) {
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(level, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + length);
    
    let lastNode = osc;
    if (useFilter) {
      const filter = this.context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.Q.value = filterQ;
      filter.frequency.setValueAtTime(Math.min(frequency * 6, 20000), time);
      filter.frequency.exponentialRampToValueAtTime(Math.max(frequency * 0.8, 100), time + length);
      lastNode.connect(filter);
      lastNode = filter;
    }
    
    lastNode.connect(gain);
    gain.connect(this.output);
    osc.start(time);
    osc.stop(time + length + 0.02);
    const voice = { osc, gain };
    this.voices.add(voice);
    osc.onended = () => { this.voices.delete(voice); osc.disconnect(); gain.disconnect(); };
  }

  playBrickNote(col) {
    if (!this.enabled || !this.playing || this.context.state !== 'running') return;
    const noteCol = Math.max(0, Math.min(10, Math.floor(col)));
    const midi = 60 + PENTATONIC[noteCol] + this.transpose;
    this.note(freq(midi), this.context.currentTime, 0.5, 'sine', 0.12, false);
  }
}
