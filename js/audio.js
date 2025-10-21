/* ===========================
   NEXUS PROTOCOL - Audio System
   =========================== */

var AudioCtx = window.AudioContext || window.webkitAudioContext;
var audioCtx = null;

var ambientSystem = {
  droneOsc: null,
  droneGain: null,
  binauralLeft: null,
  binauralRight: null,
  binauralGain: null,
  noiseNode: null,
  noiseGain: null,
  merger: null,
  noiseFilter: null,
  started: false
};

function initAudio() {
  if (!audioCtx && AudioCtx) {
    audioCtx = new AudioCtx();
  }
}

function startAmbient() {
  if (!gameState.soundEnabled || !audioCtx) return;
  if (ambientSystem.started) return;

  try {
    if (audioCtx.state === 'suspended') audioCtx.resume();

    // Drone oscillator
    ambientSystem.droneOsc = audioCtx.createOscillator();
    ambientSystem.droneGain = audioCtx.createGain();
    ambientSystem.droneOsc.type = 'sine';
    ambientSystem.droneOsc.frequency.value = 55;
    ambientSystem.droneGain.gain.value = 0.03;
    ambientSystem.droneOsc.connect(ambientSystem.droneGain);
    ambientSystem.droneGain.connect(audioCtx.destination);

    // Noise generator
    var bufferSize = 2 * audioCtx.sampleRate;
    var noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    var output = noiseBuffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    ambientSystem.noiseNode = audioCtx.createBufferSource();
    ambientSystem.noiseNode.buffer = noiseBuffer;
    ambientSystem.noiseNode.loop = true;
    ambientSystem.noiseGain = audioCtx.createGain();
    ambientSystem.noiseGain.gain.value = 0.015;

    ambientSystem.noiseFilter = audioCtx.createBiquadFilter();
    ambientSystem.noiseFilter.type = 'lowpass';
    ambientSystem.noiseFilter.frequency.value = 800;

    ambientSystem.noiseNode.connect(ambientSystem.noiseFilter);
    ambientSystem.noiseFilter.connect(ambientSystem.noiseGain);
    ambientSystem.noiseGain.connect(audioCtx.destination);

    // Binaural beats
    ambientSystem.merger = audioCtx.createChannelMerger(2);
    ambientSystem.binauralLeft = audioCtx.createOscillator();
    ambientSystem.binauralRight = audioCtx.createOscillator();
    ambientSystem.binauralGain = audioCtx.createGain();

    ambientSystem.binauralLeft.type = 'sine';
    ambientSystem.binauralRight.type = 'sine';
    ambientSystem.binauralGain.gain.value = 0.02;

    ambientSystem.binauralLeft.connect(ambientSystem.merger, 0, 0);
    ambientSystem.binauralRight.connect(ambientSystem.merger, 0, 1);
    ambientSystem.merger.connect(ambientSystem.binauralGain);
    ambientSystem.binauralGain.connect(audioCtx.destination);

    // Start all oscillators
    ambientSystem.droneOsc.start();
    ambientSystem.noiseNode.start();
    ambientSystem.binauralLeft.start();
    ambientSystem.binauralRight.start();

    ambientSystem.started = true;
    updateAmbientForContext();
  } catch (e) {
    console.error('Could not start ambient:', e);
  }
}

function updateAmbientForContext() {
  if (!gameState.soundEnabled || !audioCtx || !ambientSystem.started) return;

  var now = audioCtx.currentTime;
  var floor = gameState.floor;
  var coh = gameState.coherence;

  var baseFreq = 200;
  var binauralDiff = 10;

  // Adjust frequencies based on floor
  if (floor === 'B1') {
    binauralDiff = 12;
    ambientSystem.droneOsc.frequency.setTargetAtTime(55, now, 0.5);
  } else if (floor === 'B2') {
    binauralDiff = 10;
    ambientSystem.droneOsc.frequency.setTargetAtTime(50, now, 0.5);
  } else if (floor === 'B3') {
    binauralDiff = 8;
    ambientSystem.droneOsc.frequency.setTargetAtTime(45, now, 0.5);
  } else if (floor === 'B4') {
    binauralDiff = 6;
    ambientSystem.droneOsc.frequency.setTargetAtTime(40, now, 0.5);
  } else if (floor === 'B5') {
    binauralDiff = 4;
    ambientSystem.droneOsc.frequency.setTargetAtTime(35, now, 0.5);
  }

  ambientSystem.binauralLeft.frequency.setTargetAtTime(baseFreq, now, 0.3);
  ambientSystem.binauralRight.frequency.setTargetAtTime(baseFreq + binauralDiff, now, 0.3);

  // Adjust intensity based on coherence
  var intensity = 1 - (coh / 100) * 0.5;
  ambientSystem.noiseGain.gain.setTargetAtTime(0.015 * intensity, now, 0.5);

  if (coh < 30) {
    ambientSystem.droneGain.gain.setTargetAtTime(0.05, now, 0.2);
    ambientSystem.binauralGain.gain.setTargetAtTime(0.03, now, 0.2);
  } else {
    ambientSystem.droneGain.gain.setTargetAtTime(0.03, now, 0.5);
    ambientSystem.binauralGain.gain.setTargetAtTime(0.02, now, 0.5);
  }
}

function stopAmbient() {
  if (!ambientSystem.started) return;
  try {
    if (ambientSystem.droneOsc) {
      ambientSystem.droneOsc.stop();
      ambientSystem.droneOsc.disconnect();
    }
    if (ambientSystem.noiseNode) {
      ambientSystem.noiseNode.stop();
      ambientSystem.noiseNode.disconnect();
    }
    if (ambientSystem.binauralLeft) {
      ambientSystem.binauralLeft.stop();
      ambientSystem.binauralLeft.disconnect();
    }
    if (ambientSystem.binauralRight) {
      ambientSystem.binauralRight.stop();
      ambientSystem.binauralRight.disconnect();
    }

    ambientSystem.droneOsc = null;
    ambientSystem.noiseNode = null;
    ambientSystem.binauralLeft = null;
    ambientSystem.binauralRight = null;
    ambientSystem.started = false;
  } catch (e) {
    console.error('Stop ambient error:', e);
    ambientSystem.started = false;
  }
}

function playSound(type) {
  if (!gameState.soundEnabled || !audioCtx) return;
  try {
    var o = audioCtx.createOscillator(),
      g = audioCtx.createGain();
    o.connect(g);
    g.connect(audioCtx.destination);

    if (type === 'type') {
      o.frequency.value = 800;
      o.type = 'sine';
      g.gain.setValueAtTime(0.1, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
      o.start();
      o.stop(audioCtx.currentTime + 0.05);
    } else if (type === 'success') {
      o.frequency.value = 1200;
      o.type = 'sine';
      g.gain.setValueAtTime(0.2, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
      o.start();
      o.stop(audioCtx.currentTime + 0.2);
    } else if (type === 'error') {
      o.frequency.value = 200;
      o.type = 'square';
      g.gain.setValueAtTime(0.15, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      o.start();
      o.stop(audioCtx.currentTime + 0.3);
    } else if (type === 'notification') {
      o.frequency.value = 600;
      o.type = 'sine';
      g.gain.setValueAtTime(0.15, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      o.start();
      o.stop(audioCtx.currentTime + 0.15);
    } else if (type === 'glitch') {
      o.frequency.value = 100;
      o.type = 'sawtooth';
      g.gain.setValueAtTime(0.2, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
      o.start();
      o.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'ambient') {
      o.frequency.value = 50;
      o.type = 'triangle';
      g.gain.setValueAtTime(0.05, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 2);
      o.start();
      o.stop(audioCtx.currentTime + 2);
    }
  } catch (e) {}
}