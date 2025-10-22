/* ===========================
   LATTICE DESCENT - Audio System v2.0
   Ambient drones, binaural beats, sound effects
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
  noiseFilter: null,
  merger: null,
  started: false
};

// ============================================
// INITIALIZATION
// ============================================

function initAudio() {
  if (!audioCtx && AudioCtx) {
    try {
      audioCtx = new AudioCtx();
    } catch(e) {
      console.warn('Audio context creation failed:', e);
    }
  }
}

// ============================================
// AMBIENT SYSTEM
// ============================================

function startAmbient() {
  if (!gameState.soundEnabled || !audioCtx) return;
  if (ambientSystem.started) return;
  
  try {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    
    // Drone oscillator (base hum)
    ambientSystem.droneOsc = audioCtx.createOscillator();
    ambientSystem.droneGain = audioCtx.createGain();
    ambientSystem.droneOsc.type = 'sine';
    ambientSystem.droneOsc.frequency.value = 55;
    ambientSystem.droneGain.gain.value = 0.03;
    ambientSystem.droneOsc.connect(ambientSystem.droneGain);
    ambientSystem.droneGain.connect(audioCtx.destination);
    
    // White noise (atmospheric)
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
    ambientSystem.noiseFilter.Q.value = 1;
    
    ambientSystem.noiseNode.connect(ambientSystem.noiseFilter);
    ambientSystem.noiseFilter.connect(ambientSystem.noiseGain);
    ambientSystem.noiseGain.connect(audioCtx.destination);
    
    // Binaural beats (stereo effect)
    ambientSystem.merger = audioCtx.createChannelMerger(2);
    ambientSystem.binauralLeft = audioCtx.createOscillator();
    ambientSystem.binauralRight = audioCtx.createOscillator();
    ambientSystem.binauralGain = audioCtx.createGain();
    
    ambientSystem.binauralLeft.type = 'sine';
    ambientSystem.binauralRight.type = 'sine';
    ambientSystem.binauralLeft.frequency.value = 200;
    ambientSystem.binauralRight.frequency.value = 210;
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
  } catch(e) {
    console.error('Could not start ambient:', e);
  }
}

function updateAmbientForContext() {
  if (!gameState.soundEnabled || !audioCtx || !ambientSystem.started) return;
  
  try {
    var now = audioCtx.currentTime;
    var floor = gameState.floor;
    var coh = gameState.coherence;
    
    var baseFreq = 200;
    var binauralDiff = 10;
    
    // Floor-specific ambient parameters
    if (floor === 'B1') {
      binauralDiff = 12;
      ambientSystem.droneOsc.frequency.setTargetAtTime(55, now, 0.5);
      ambientSystem.noiseFilter.frequency.setTargetAtTime(800, now, 0.5);
    } else if (floor === 'B2') {
      binauralDiff = 10;
      ambientSystem.droneOsc.frequency.setTargetAtTime(50, now, 0.5);
      ambientSystem.noiseFilter.frequency.setTargetAtTime(700, now, 0.5);
    } else if (floor === 'B3') {
      binauralDiff = 8;
      ambientSystem.droneOsc.frequency.setTargetAtTime(45, now, 0.5);
      ambientSystem.noiseFilter.frequency.setTargetAtTime(600, now, 0.5);
    } else if (floor === 'B4') {
      binauralDiff = 6;
      ambientSystem.droneOsc.frequency.setTargetAtTime(40, now, 0.5);
      ambientSystem.noiseFilter.frequency.setTargetAtTime(500, now, 0.5);
    } else if (floor === 'B5') {
      binauralDiff = 4;
      ambientSystem.droneOsc.frequency.setTargetAtTime(35, now, 0.5);
      ambientSystem.noiseFilter.frequency.setTargetAtTime(400, now, 0.5);
    }
    
    // Binaural beat adjustment
    ambientSystem.binauralLeft.frequency.setTargetAtTime(baseFreq, now, 0.3);
    ambientSystem.binauralRight.frequency.setTargetAtTime(baseFreq + binauralDiff, now, 0.3);
    
    // Coherence-based intensity
    var intensity = 1 - (coh / 100) * 0.5;
    ambientSystem.noiseGain.gain.setTargetAtTime(0.015 * intensity, now, 0.5);
    
    // Low coherence = more intense ambient
    if (coh < 30) {
      ambientSystem.droneGain.gain.setTargetAtTime(0.05, now, 0.2);
      ambientSystem.binauralGain.gain.setTargetAtTime(0.03, now, 0.2);
    } else {
      ambientSystem.droneGain.gain.setTargetAtTime(0.03, now, 0.5);
      ambientSystem.binauralGain.gain.setTargetAtTime(0.02, now, 0.5);
    }
  } catch(e) {
    console.error('Ambient update error:', e);
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
  } catch(e) {
    console.error('Stop ambient error:', e);
    ambientSystem.started = false;
  }
}

// ============================================
// SOUND EFFECTS
// ============================================

function playSound(type) {
  if (!gameState.soundEnabled || !audioCtx) return;
  
  try {
    var osc = audioCtx.createOscillator();
    var gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    var now = audioCtx.currentTime;
    
    if (type === 'type') {
      // Typing sound
      osc.frequency.value = 800;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
      
    } else if (type === 'success') {
      // Success/positive sound
      osc.frequency.value = 1200;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
      
    } else if (type === 'error') {
      // Error/negative sound
      osc.frequency.value = 200;
      osc.type = 'square';
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
      
    } else if (type === 'notification') {
      // Notification sound
      osc.frequency.value = 600;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
      
    } else if (type === 'glitch') {
      // Glitch sound
      osc.frequency.value = 100;
      osc.type = 'sawtooth';
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
      
    } else if (type === 'ambient') {
      // Ambient blip
      osc.frequency.value = 50;
      osc.type = 'triangle';
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 2);
      osc.start(now);
      osc.stop(now + 2);
      
    } else if (type === 'terminal') {
      // Terminal access sound
      osc.frequency.value = 1000;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
      
    } else if (type === 'elevator') {
      // Elevator sound
      osc.frequency.value = 300;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.5);
      gain.gain.linearRampToValueAtTime(0.01, now + 1);
      osc.start(now);
      osc.stop(now + 1);
    }
  } catch(e) {
    console.error('Sound effect error:', e);
  }
}

// ============================================
// SPECIAL SOUNDS
// ============================================

function playSequenceSound(terminalNumber) {
  if (!gameState.soundEnabled || !audioCtx) return;
  
  try {
    var osc = audioCtx.createOscillator();
    var gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    var now = audioCtx.currentTime;
    
    // Different frequency for each terminal
    var freqMap = {
      '7': 700,
      '3': 300,
      '9': 900
    };
    
    osc.frequency.value = freqMap[terminalNumber] || 500;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    osc.start(now);
    osc.stop(now + 0.5);
  } catch(e) {
    console.error('Sequence sound error:', e);
  }
}

function playEchoSound() {
  if (!gameState.soundEnabled || !audioCtx) return;
  
  try {
    var osc = audioCtx.createOscillator();
    var gain = audioCtx.createGain();
    var delay = audioCtx.createDelay();
    var feedback = audioCtx.createGain();
    
    delay.delayTime.value = 0.3;
    feedback.gain.value = 0.5;
    
    osc.connect(gain);
    gain.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(audioCtx.destination);
    gain.connect(audioCtx.destination);
    
    var now = audioCtx.currentTime;
    
    osc.frequency.value = 150;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 2);
    osc.start(now);
    osc.stop(now + 2);
  } catch(e) {
    console.error('Echo sound error:', e);
  }
}

// ============================================
// COHERENCE WARNING SOUND
// ============================================

function playCoherenceWarning() {
  if (!gameState.soundEnabled || !audioCtx) return;
  
  try {
    var osc = audioCtx.createOscillator();
    var gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    var now = audioCtx.currentTime;
    
    osc.frequency.value = 440;
    osc.type = 'square';
    
    // Pulsing warning sound
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.setValueAtTime(0.01, now + 0.1);
    gain.gain.setValueAtTime(0.1, now + 0.2);
    gain.gain.setValueAtTime(0.01, now + 0.3);
    
    osc.start(now);
    osc.stop(now + 0.3);
  } catch(e) {
    console.error('Warning sound error:', e);
  }
}

// ============================================
// CLEANUP
// ============================================

function cleanupAudio() {
  stopAmbient();
  if (audioCtx) {
    try {
      audioCtx.close();
    } catch(e) {
      console.error('Audio cleanup error:', e);
    }
  }
}

// Cleanup on page unload
window.addEventListener('beforeunload', cleanupAudio);