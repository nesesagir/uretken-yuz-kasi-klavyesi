/**
 * Two-tone siren generated in-browser. No media file, no copyright.
 * AudioContext is unlocked from the onboarding click (autoplay policy).
 */

export class AlarmSynth {
  private ctx: AudioContext | null = null;
  private nodes: AudioNode[] = [];
  private interval: number | null = null;
  private playing = false;

  async unlock(): Promise<void> {
    const ctx = this.ensureContext();
    if (ctx.state === "suspended") await ctx.resume();
  }

  async start(): Promise<void> {
    await this.unlock();
    if (this.playing) return;
    const ctx = this.ensureContext();
    this.playing = true;

    const master = ctx.createGain();
    master.gain.value = 0.18;
    master.connect(ctx.destination);

    const oscA = ctx.createOscillator();
    const oscB = ctx.createOscillator();
    oscA.type = "sawtooth";
    oscB.type = "square";
    oscA.frequency.value = 680;
    oscB.frequency.value = 920;

    const trem = ctx.createGain();
    trem.gain.value = 0.7;
    oscA.connect(trem);
    oscB.connect(trem);
    trem.connect(master);

    oscA.start();
    oscB.start();
    this.nodes = [oscA, oscB, trem, master];

    let high = true;
    this.interval = window.setInterval(() => {
      high = !high;
      const a = high ? 680 : 440;
      const b = high ? 920 : 560;
      const now = ctx.currentTime;
      oscA.frequency.setTargetAtTime(a, now, 0.04);
      oscB.frequency.setTargetAtTime(b, now, 0.04);
    }, 320);
  }

  stop(): void {
    if (this.interval !== null) {
      window.clearInterval(this.interval);
      this.interval = null;
    }
    for (const node of this.nodes) {
      if (node instanceof OscillatorNode) {
        try {
          node.stop();
        } catch {
          /* already stopped */
        }
      }
      node.disconnect();
    }
    this.nodes = [];
    this.playing = false;
  }

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      const Ctor = window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctor();
    }
    return this.ctx;
  }
}
