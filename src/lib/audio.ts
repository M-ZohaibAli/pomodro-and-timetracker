import { AmbientSoundType } from "@/types/focus";

class AudioEngine {
  private ctx: AudioContext | null = null;
  private ambientSource: AudioNode | null = null;
  private ambientGain: GainNode | null = null;
  private currentAmbientType: AmbientSoundType = "none";
  private ambientVolumePercent = 40;
  private chimeVolumePercent = 70;
  private isMuted = false;

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setAmbientVolume(percent: number) {
    this.ambientVolumePercent = Math.max(0, Math.min(100, percent));
    if (this.ambientGain && this.ctx) {
      const targetGain = this.isMuted ? 0 : (this.ambientVolumePercent / 100) * 0.15;
      this.ambientGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
    }
  }

  public setChimeVolume(percent: number) {
    this.chimeVolumePercent = Math.max(0, Math.min(100, percent));
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.ambientGain && this.ctx) {
      const targetGain = this.isMuted ? 0 : (this.ambientVolumePercent / 100) * 0.15;
      this.ambientGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
    }
  }

  public stopAmbient() {
    if (this.ambientSource) {
      try {
        if ("stop" in this.ambientSource && typeof (this.ambientSource as AudioBufferSourceNode).stop === "function") {
          (this.ambientSource as AudioBufferSourceNode).stop();
        }
        this.ambientSource.disconnect();
      } catch {
        // ignore disconnect errors
      }
      this.ambientSource = null;
    }
    this.currentAmbientType = "none";
  }

  public playAmbient(type: AmbientSoundType) {
    if (type === "none") {
      this.stopAmbient();
      return;
    }

    const ctx = this.getContext();
    if (!ctx) return;

    if (this.currentAmbientType === type && this.ambientSource) {
      return; // already playing
    }

    this.stopAmbient();
    this.currentAmbientType = type;

    // Create gain node for ambient
    const gainNode = ctx.createGain();
    const targetGain = this.isMuted ? 0 : (this.ambientVolumePercent / 100) * 0.15;
    gainNode.gain.setValueAtTime(targetGain, ctx.currentTime);
    gainNode.connect(ctx.destination);
    this.ambientGain = gainNode;

    const bufferSize = ctx.sampleRate * 2; // 2 seconds looped buffer
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    if (type === "white_noise") {
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      // Subtle bandpass filter for softer tone
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(3200, ctx.currentTime);

      source.connect(filter);
      filter.connect(gainNode);
      source.start(0);
      this.ambientSource = source;
    } else if (type === "brown_noise") {
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        lastOut = (lastOut + 0.02 * white) / 1.02;
        data[i] = lastOut * 3.5; // boost brown noise level
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(800, ctx.currentTime);

      source.connect(filter);
      filter.connect(gainNode);
      source.start(0);
      this.ambientSource = source;
    } else if (type === "rain") {
      // Pink-tinted noise with randomized raindrop peaks
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99765 * b0 + white * 0.099046;
        b1 = 0.96300 * b1 + white * 0.296516;
        b2 = 0.57000 * b2 + white * 1.0526913;
        const pink = (b0 + b1 + b2 + white * 0.1848) * 0.1;
        // occasional raindrop click
        const drop = Math.random() < 0.003 ? (Math.random() - 0.5) * 0.6 : 0;
        data[i] = pink + drop;
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(1200, ctx.currentTime);
      filter.Q.setValueAtTime(0.7, ctx.currentTime);

      source.connect(filter);
      filter.connect(gainNode);
      source.start(0);
      this.ambientSource = source;
    } else if (type === "fan") {
      // Low rumble + gentle filtered rushing air
      let lastVal = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        lastVal = 0.94 * lastVal + 0.06 * white;
        data[i] = lastVal * 2.2;
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const lowpass = ctx.createBiquadFilter();
      lowpass.type = "lowpass";
      lowpass.frequency.setValueAtTime(450, ctx.currentTime);

      source.connect(lowpass);
      lowpass.connect(gainNode);
      source.start(0);
      this.ambientSource = source;
    }
  }

  // Harmonic bell chime for session completion
  public playSessionCompleteChime() {
    if (this.isMuted || this.chimeVolumePercent <= 0) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const baseVol = (this.chimeVolumePercent / 100) * 0.3;
    const now = ctx.currentTime;

    // Warm multi-harmonic singing bowl/chime (528 Hz - Solfeggio frequency + harmonics)
    const freqs = [528, 1056, 1584, 2112];
    const amplitudes = [1.0, 0.45, 0.2, 0.08];
    const decays = [2.8, 2.2, 1.4, 0.9];

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(baseVol * amplitudes[idx], now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + decays[idx]);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + decays[idx] + 0.1);
    });
  }

  // Lighter uplift chime for break completion
  public playBreakCompleteChime() {
    if (this.isMuted || this.chimeVolumePercent <= 0) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const baseVol = (this.chimeVolumePercent / 100) * 0.25;
    const notes = [440, 554.37, 659.25]; // A major arpeggio
    const delays = [0, 0.14, 0.28];

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = ctx.currentTime + delays[idx];

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(baseVol, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + 1.3);
    });
  }
}

export const audioEngine = new AudioEngine();
