// Upgraded Web Audio synthwave loop. No audio files are downloaded.
const BPM = 124;
const STEP = 60 / BPM / 2; // eighth notes
const LOOKAHEAD = 0.12;
// Sixteen eighth notes per bar, four bars. null leaves space for effects.
const LEAD = [
  72, null, 76, 79, 81, null, 79, 76, 74, null, 77, 81, 79, null, null, null,
  72, null, 76, 79, 84, null, 83, 79, 81, null, 77, 74, 76, null, null, null,
  69, null, 72, 76, 77, null, 76, 72, 74, null, 71, 74, 79, null, 77, 76,
  72, 76, 79, null, 77, 74, 71, null, 72, null, null, null, 67, null, null, null,
];
const BASS = [48, 48, 45, 45, 41, 41, 43, 43];
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
  }

  setEnabled(value) { this.enabled = Boolean(value); this.sync(); }
  setPlaying(value) { this.playing = Boolean(value); this.sync(); }
  setLevel(level) { this.transpose = [0, 2, -3, 5][(Math.max(1, level) - 1) % 4]; }

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
    while (this.next < this.context.currentTime + LOOKAHEAD) {
      const i = this.step % LEAD.length;
      const lead = LEAD[i];
      // Use sawtooth with filter for analog synth feel
      if (lead !== null) this.note(freq(lead + this.transpose), this.next, STEP * 0.85, 'sawtooth', 0.09, true);
      // Deep bass
      if (i % 2 === 0) this.note(freq(BASS[Math.floor(i / 8) % BASS.length] + this.transpose), this.next, STEP * 1.6, 'square', 0.18, true, 2);
      this.next += STEP;
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
    // Map column index to pentatonic scale (0 to 10 for the 11 columns)
    const noteCol = Math.max(0, Math.min(10, Math.floor(col)));
    const midi = 60 + PENTATONIC[noteCol] + this.transpose;
    this.note(freq(midi), this.context.currentTime, 0.5, 'sawtooth', 0.12, true, 8);
  }
}
