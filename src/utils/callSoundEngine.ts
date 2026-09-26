class CallSoundEngine {
  private ctx: AudioContext | null = null;
  private intervalId: any = null;

  initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // ARANAN KİŞİ İÇİN YUMUŞAK GELEN ARAMA ZİL SESİ (2.2 saniyede bir tekrarlayan melodik chime)
  startIncomingRing() {
    this.stopAll();
    this.initContext();

    const playChime = () => {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (Yumuşak Majör Akor)

      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        // Çok yumuşak ses seviyesi (Max 0.18)
        gain.gain.setValueAtTime(0.001, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.18, now + idx * 0.12 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.65);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.7);
      });

      // Mobil cihazlar için nazik titreşim
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate([250, 100, 250]);
        } catch (e) {}
      }
    };

    playChime();
    this.intervalId = setInterval(playChime, 2200);
  }

  // ARAYAN KİŞİ İÇİN ÇALDIRMA SESİ (Yumuşak "Dıııt... Dıııt..." tonu)
  startOutgoingDialTone() {
    this.stopAll();
    this.initContext();

    const playTone = () => {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(425, now); // Standart yumuşak arama frekansı

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.05); // Kulağı yormayan düşük ses
      gain.gain.setValueAtTime(0.12, now + 0.9);
      gain.gain.linearRampToValueAtTime(0.001, now + 1.0);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 1.05);
    };

    playTone();
    this.intervalId = setInterval(playTone, 3000);
  }

  // BAĞLANTI BAŞARILI TONU (Call connected chime)
  playConnectTone() {
    this.stopAll();
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [587.33, 880.00]; // D5, A5 (Pozitif yükselen)
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.001, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.15, now + idx * 0.08 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.5);
    });
  }

  // BAĞLANTI KAPANMA TONU (Call ended tone)
  playDisconnectTone() {
    this.stopAll();
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [400, 300]; // Alçalan hüzünlü tonlar
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);

      gain.gain.setValueAtTime(0.001, now + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.12, now + idx * 0.1 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.4);
    });
  }

  // ARAMA KAPANDIĞINDA VEYA AÇILDIĞINDA ANINDA DURDUR
  stopAll() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(0);
      } catch (e) {}
    }
  }
}

export const callSoundEngine = new CallSoundEngine();
