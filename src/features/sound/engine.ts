/**
 * Optional soundscape, synthesised with the Web Audio API — no audio files to load
 * or break. Off by default. An AudioContext is created only inside a user gesture,
 * and nothing plays unless the visitor switched sound on.
 */

export type Cue = 'startup' | 'tick' | 'hover' | 'transition';

const STORAGE_KEY = 'bayhan.sound';
/** Minimum spacing per cue, so fast pointer movement cannot stack sounds. */
const COOLDOWN_MS: Record<Cue, number> = { startup: 2000, tick: 70, hover: 90, transition: 900 };

type Listener = (state: { enabled: boolean; volume: number }) => void;

class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private ambience: (() => void) | null = null;
  private servoTimer: ReturnType<typeof setTimeout> | undefined;
  private last: Partial<Record<Cue, number>> = {};
  private listeners = new Set<Listener>();
  /** Immutable snapshot for React (useSyncExternalStore needs a stable reference). */
  private snapshot = { enabled: false, volume: 0.55 };
  /** Visitor's choice; audio actually runs only after a gesture unlocks the context. */
  enabled = false;
  volume = 0.55;

  constructor() {
    if (typeof window === 'undefined') return;
    try {
      // Remember the choice across pages of this session (each page is a new document).
      this.enabled = window.sessionStorage.getItem(STORAGE_KEY) === 'on';
    } catch {
      this.enabled = false;
    }
    this.snapshot = { enabled: this.enabled, volume: this.volume };
    document.addEventListener('visibilitychange', () => this.onVisibility());
    if (this.enabled) {
      // The previous page was playing: resume on the first gesture on this page.
      const unlock = () => {
        window.removeEventListener('pointerdown', unlock);
        window.removeEventListener('keydown', unlock);
        if (this.enabled) void this.start(false);
      };
      window.addEventListener('pointerdown', unlock, { once: true });
      window.addEventListener('keydown', unlock, { once: true });
    }
  }

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private emit() {
    this.snapshot = { enabled: this.enabled, volume: this.volume };
    for (const l of this.listeners) l(this.snapshot);
  }

  getSnapshot = () => this.snapshot;

  private persist() {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, this.enabled ? 'on' : 'off');
    } catch {
      // Storage blocked: the toggle still works for this page.
    }
  }

  /** Must be called from a click / key handler. */
  async toggle(): Promise<void> {
    if (this.enabled) this.stop();
    else await this.start(true);
  }

  setVolume(value: number) {
    this.volume = Math.min(1, Math.max(0, value));
    if (this.ctx && this.master && this.enabled) {
      this.master.gain.setTargetAtTime(this.volume * 0.5, this.ctx.currentTime, 0.08);
    }
    this.emit();
  }

  private async start(withCue: boolean) {
    this.enabled = true;
    this.persist();
    this.emit();
    const AudioCtor = window.AudioContext;
    if (!AudioCtor) return;
    this.ctx ??= new AudioCtor();
    await this.ctx.resume();
    if (!this.master) {
      this.master = this.ctx.createGain();
      this.master.gain.value = 0;
      this.master.connect(this.ctx.destination);
      this.noise = this.createNoise();
    }
    this.master.gain.setTargetAtTime(this.volume * 0.5, this.ctx.currentTime, 0.4);
    if (!this.ambience) this.ambience = this.startAmbience();
    this.scheduleServo();
    if (withCue) this.play('startup');
  }

  private stop() {
    this.enabled = false;
    this.persist();
    this.emit();
    clearTimeout(this.servoTimer);
    if (!this.ctx || !this.master) return;
    this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.15);
    const ambience = this.ambience;
    this.ambience = null;
    setTimeout(() => {
      ambience?.();
      if (!this.enabled) void this.ctx?.suspend();
    }, 800);
  }

  private onVisibility() {
    if (!this.ctx || !this.master || !this.enabled) return;
    if (document.visibilityState === 'hidden') {
      this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
      clearTimeout(this.servoTimer);
      setTimeout(() => void this.ctx?.suspend(), 400);
    } else {
      void this.ctx.resume().then(() => {
        if (!this.ctx || !this.master) return;
        this.master.gain.setTargetAtTime(this.volume * 0.5, this.ctx.currentTime, 0.5);
        this.scheduleServo();
      });
    }
  }

  private createNoise(): AudioBuffer | null {
    if (!this.ctx) return null;
    const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 2, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  /** Low drone + filtered air, both breathing slowly. Returns a stop function. */
  private startAmbience(): () => void {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master || !this.noise) return () => {};
    const now = ctx.currentTime;
    const bus = ctx.createGain();
    bus.gain.setValueAtTime(0, now);
    bus.gain.linearRampToValueAtTime(1, now + 3);
    bus.connect(master);

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 320;
    lowpass.Q.value = 0.7;
    const drone = ctx.createGain();
    drone.gain.value = 0.16;
    lowpass.connect(drone).connect(bus);

    const oscillators = [
      { type: 'sine' as OscillatorType, freq: 55 },
      { type: 'triangle' as OscillatorType, freq: 82.6 },
      { type: 'sine' as OscillatorType, freq: 110.3 },
    ].map(({ type, freq }) => {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = freq;
      osc.connect(lowpass);
      osc.start(now);
      return osc;
    });

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.06;
    const lfoDepth = ctx.createGain();
    lfoDepth.gain.value = 140;
    lfo.connect(lfoDepth).connect(lowpass.frequency);
    lfo.start(now);

    const air = ctx.createBufferSource();
    air.buffer = this.noise;
    air.loop = true;
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = 1600;
    band.Q.value = 0.5;
    const airGain = ctx.createGain();
    airGain.gain.value = 0.018;
    air.connect(band).connect(airGain).connect(bus);
    air.start(now);

    return () => {
      const t = ctx.currentTime;
      bus.gain.setTargetAtTime(0, t, 0.2);
      [...oscillators, lfo].forEach((o) => o.stop(t + 1));
      air.stop(t + 1);
      setTimeout(() => bus.disconnect(), 1200);
    };
  }

  /** A soft servo whirr every few seconds: the machine is alive, not busy. */
  private scheduleServo() {
    clearTimeout(this.servoTimer);
    if (!this.enabled) return;
    this.servoTimer = setTimeout(
      () => {
        this.servo();
        this.scheduleServo();
      },
      7000 + Math.random() * 6000,
    );
  }

  private servo() {
    const ctx = this.ctx;
    if (!ctx || !this.master || document.visibilityState === 'hidden') return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(170, t);
    osc.frequency.exponentialRampToValueAtTime(245, t + 0.35);
    osc.frequency.exponentialRampToValueAtTime(205, t + 0.6);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    const gain = this.envelope(t, 0.025, 0.08, 0.6);
    osc.connect(filter).connect(gain).connect(this.master);
    osc.start(t);
    osc.stop(t + 0.7);
  }

  private envelope(t: number, peak: number, attack: number, release: number): GainNode {
    // Only called while a context exists (from play/servo, which check it first).
    const gain = (this.ctx as AudioContext).createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(peak, t + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + attack + release);
    return gain;
  }

  play(cue: Cue) {
    const ctx = this.ctx;
    if (!this.enabled || !ctx || !this.master || ctx.state !== 'running') return;
    const nowMs = performance.now();
    if (nowMs - (this.last[cue] ?? 0) < COOLDOWN_MS[cue]) return;
    this.last[cue] = nowMs;
    const t = ctx.currentTime;

    if (cue === 'tick' || cue === 'hover') {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(cue === 'tick' ? 1650 : 2600, t);
      osc.frequency.exponentialRampToValueAtTime(cue === 'tick' ? 900 : 2100, t + 0.05);
      const gain = this.envelope(t, cue === 'tick' ? 0.06 : 0.018, 0.004, 0.07);
      osc.connect(gain).connect(this.master);
      osc.start(t);
      osc.stop(t + 0.1);
      return;
    }

    if (cue === 'transition' && this.noise) {
      const src = ctx.createBufferSource();
      src.buffer = this.noise;
      const band = ctx.createBiquadFilter();
      band.type = 'bandpass';
      band.Q.value = 1.4;
      band.frequency.setValueAtTime(380, t);
      band.frequency.exponentialRampToValueAtTime(2600, t + 1.1);
      const gain = this.envelope(t, 0.05, 0.45, 0.9);
      src.connect(band).connect(gain).connect(this.master);
      src.start(t);
      src.stop(t + 1.5);
      return;
    }

    if (cue === 'startup') {
      // Power-up: a rising low sweep, then a two-note chime as the "sensor" lights.
      const sweep = ctx.createOscillator();
      sweep.type = 'sine';
      sweep.frequency.setValueAtTime(70, t);
      sweep.frequency.exponentialRampToValueAtTime(220, t + 1.1);
      const sweepGain = this.envelope(t, 0.12, 0.5, 0.9);
      sweep.connect(sweepGain).connect(this.master);
      sweep.start(t);
      sweep.stop(t + 1.6);
      const master = this.master;
      [880, 1318.5].forEach((freq, i) => {
        const start = t + 0.9 + i * 0.12;
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const gain = this.envelope(start, 0.07, 0.01, 1.6);
        osc.connect(gain).connect(master);
        osc.start(start);
        osc.stop(start + 1.8);
      });
    }
  }
}

export const sound = new SoundEngine();
