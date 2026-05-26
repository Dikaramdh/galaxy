/* ============================================================
   js/music.js — Generative ambient music via Web Audio API
   ============================================================ */

window.GalaxyMusic = (function () {

  let audioCtx    = null;
  let masterGain  = null;
  let oscillators = [];
  let isPlaying   = false;

  const musicBtn = document.getElementById('music-btn');


  /* ── Build ambient drone layers ────────────────────────── */
  function buildAmbient() {
    audioCtx   = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0;
    masterGain.connect(audioCtx.destination);

    /* Reverb (simple convolver with noise impulse) */
    const revLen  = audioCtx.sampleRate * 3;
    const revBuf  = audioCtx.createBuffer(2, revLen, audioCtx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = revBuf.getChannelData(ch);
      for (let i = 0; i < revLen; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / revLen, 2.5);
      }
    }
    const reverb = audioCtx.createConvolver();
    reverb.buffer = revBuf;
    reverb.connect(masterGain);

    /* Layer definitions: [frequency, type, gain, lfoFreq] */
    const layers = [
      [55.0,  'sine',     0.12, 0.04],
      [82.4,  'sine',     0.09, 0.03],
      [110.0, 'triangle', 0.07, 0.05],
      [138.6, 'sine',     0.06, 0.02],
      [164.8, 'triangle', 0.05, 0.06],
      [220.0, 'sine',     0.04, 0.04],
      [246.9, 'sine',     0.03, 0.07],
    ];

    layers.forEach(([freq, type, gainVal, lfoFreq]) => {
      const osc     = audioCtx.createOscillator();
      const gain    = audioCtx.createGain();
      const lfo     = audioCtx.createOscillator();
      const lfoGain = audioCtx.createGain();

      osc.type          = type;
      osc.frequency.value = freq;
      gain.gain.value   = gainVal;

      /* LFO subtly modulates pitch */
      lfo.frequency.value = lfoFreq;
      lfoGain.gain.value  = freq * 0.018;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      osc.connect(gain);
      gain.connect(reverb);

      osc.start();
      lfo.start();
      oscillators.push({ osc, gain, lfo });
    });
  }


  /* ── Toggle ─────────────────────────────────────────────── */
  function toggle() {
    if (!audioCtx) buildAmbient();

    if (!isPlaying) {
      /* Resume context if suspended (browser autoplay policy) */
      if (audioCtx.state === 'suspended') audioCtx.resume();
      masterGain.gain.setTargetAtTime(0.9, audioCtx.currentTime, 1.8);
      musicBtn.textContent = '♬';
      musicBtn.classList.add('active');
    } else {
      masterGain.gain.setTargetAtTime(0, audioCtx.currentTime, 1.2);
      musicBtn.textContent = '♪';
      musicBtn.classList.remove('active');
    }

    isPlaying = !isPlaying;
  }


  /* ── Bind button ────────────────────────────────────────── */
  musicBtn.addEventListener('click', toggle);


  /* ── Public API ─────────────────────────────────────────── */
  return { toggle, isPlaying: () => isPlaying };

})();
