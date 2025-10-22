/* ===========================
   LATTICE DESCENT - Main Entry v2.0
   Initialization, game loop, event handlers
   =========================== */

(function() {
  
  function onReady(fn) {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      setTimeout(fn, 0);
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }
  
  onReady(init);
  
  // ============================================
  // INITIALIZATION
  // ============================================
  
  function init() {
    // Global error handler
    window.addEventListener('error', function(e) {
      try {
        addLine('[SYSTEM ERROR] ' + (e.message || 'unknown'), 'error-message');
        console.error('Game error:', e);
      } catch(_) {}
    });
    
    // Loading screen logic
    var bar = $('#loadingBar');
    var progress = 0;
    var done = false;
    var timer = null;
    
    function step() {
      if (done) return;
      progress = Math.min(100, progress + 20);
      if (bar) bar.style.width = progress + '%';
      if (progress >= 100) {
        stop();
        showGame();
      }
    }
    
    function stop() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }
    
    function showGame() {
      if (done) return;
      done = true;
      $('#loadingScreen').style.display = 'none';
      $('#gameContainer').style.display = 'flex';
      startGame();
      $('#commandInput').focus();
    }
    
    timer = setInterval(step, 250);
    
    // Force start button
    $('#forceStart').addEventListener('click', function() {
      stop();
      bar.style.width = '100%';
      showGame();
    });
    
    // ============================================
    // EVENT LISTENERS
    // ============================================
    
    // Command execution
    $('#executeBtn').addEventListener('click', processCommand);
    
    $('#commandInput').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        processCommand();
      }
    });
    
    // Shop and Inventory
    $('#shopBtn').addEventListener('click', openShop);
    $('#invBtn').addEventListener('click', openInventory);
    
    // Sound toggle
    $('#soundBtn').addEventListener('click', function() {
      try {
        if (audioCtx && audioCtx.state === 'suspended') {
          audioCtx.resume();
        }
      } catch(e) {}
      
      gameState.soundEnabled = !gameState.soundEnabled;
      var btn = $('#soundBtn');
      btn.textContent = gameState.soundEnabled ? '🔊' : '🔇';
      
      addLine('Sound ' + (gameState.soundEnabled ? 'enabled' : 'disabled'), 'system-message');
      
      if (gameState.soundEnabled && !ambientSystem.started) {
        setTimeout(startAmbient, 100);
      } else if (!gameState.soundEnabled) {
        stopAmbient();
      }
    });
    
    // HUD toggle
    $('#hudToggle').addEventListener('click', function() {
      var hud = $('#hud');
      var isVisible = hud.style.display === 'block';
      hud.style.display = isVisible ? 'none' : 'block';
      
      if (!isVisible) {
        toast('Monitor', 'HUD activated', 'info');
      }
    });
    
    // Close modals
    $('#closeShop').addEventListener('click', function() {
      $('#shopModal').style.display = 'none';
    });
    
    $('#closeInv').addEventListener('click', function() {
      $('#inventoryModal').style.display = 'none';
    });
    
    $('#closeDiary').addEventListener('click', function() {
      $('#diaryModal').style.display = 'none';
    });
    
    // ESC key to close modals
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        closeModals();
      }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
      // Ctrl+D or Cmd+D = open diary
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        if (!gameState.gameOver) {
          openDiaryModal();
        }
      }
      
      // Ctrl+M or Cmd+M = show mission
      if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
        e.preventDefault();
        if (!gameState.gameOver) {
          $('#commandInput').value = 'mission';
          processCommand();
        }
      }
      
      // Ctrl+H or Cmd+H = toggle HUD
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault();
        if (!gameState.gameOver) {
          $('#hudToggle').click();
        }
      }
    });
    
    // Audio initialization (requires user interaction)
    document.addEventListener('click', function once() {
      initAudio();
      if (gameState.soundEnabled && !ambientSystem.started) {
        setTimeout(startAmbient, 100);
      }
      document.removeEventListener('click', once);
    });
    
    document.addEventListener('keydown', function oncek() {
      initAudio();
      if (gameState.soundEnabled && !ambientSystem.started) {
        setTimeout(startAmbient, 100);
      }
      document.removeEventListener('keydown', oncek);
    });
    
    // Focus management
    window.addEventListener('focus', function() {
      setTimeout(function() {
        if ($('#commandInput')) {
          $('#commandInput').focus();
        }
      }, 100);
    });
    
    // Tab visibility (pause ambient on tab switch)
    document.addEventListener('visibilitychange', function() {
      if (document.hidden) {
        // Tab hidden - reduce ambient volume
        if (ambientSystem.started && ambientSystem.droneGain) {
          try {
            ambientSystem.droneGain.gain.setTargetAtTime(0.01, audioCtx.currentTime, 0.5);
            ambientSystem.binauralGain.gain.setTargetAtTime(0.005, audioCtx.currentTime, 0.5);
          } catch(e) {}
        }
      } else {
        // Tab visible - restore ambient
        if (ambientSystem.started && ambientSystem.droneGain) {
          updateAmbientForContext();
        }
      }
    });
  }
  
  // ============================================
  // GAME START
  // ============================================
  
  function startGame() {
    addLine('═══════════════════════════════════', 'system-message');
    addLine('  LATTICE DESCENT v2.0', 'system-message');
    addLine('  Reality Protocol Active', 'system-message');
    addLine('═══════════════════════════════════', 'system-message');
    addLine('');
    addLine('Welcome back, Gerth.');
    addLine('The building remembers you one floor at a time.');
    addLine('');
    addLine('You are on Floor B1 — Administrative.');
    addLine('Your terminal keeps making eye contact.');
    addLine('');
    
    // Show first mission
    var firstMission = missions[gameState.activeMission];
    if (firstMission) {
      addLine('╔═══ MISSION ASSIGNED ═══╗', 'success-message');
      addLine('  ' + firstMission.title, 'success-message');
      addLine('╚═════════════════════════╝', 'system-message');
      addLine('');
      addLine(firstMission.briefing, 'system-message');
      addLine('');
    }
    
    hint('Type "mission" to see your objectives');
    hint('Type "help" for all commands');
    hint('Type "diary" to read your thoughts');
    addLine('');
    addLine('[Orientation stipend] +50¢', 'success-message');
    
    gameState.credits += 50;
    
    // Unlock first diary entry
    checkDiaryUnlocks();
    
    // Initial display update
    updateDisplay();
    updateBackgroundImage();
    
    // ============================================
    // GAME LOOP
    // ============================================
    
    var lastSecond = Math.floor(Date.now() / 1000);
    
    setInterval(function() {
      if (gameState.gameOver) return;
      
      var currentSecond = Math.floor(Date.now() / 1000);
      if (currentSecond === lastSecond) return; // Prevent double-ticking
      lastSecond = currentSecond;
      
      try {
        gameState.time++;
        
        // Passive coherence decay (slower)
        if (gameState.time % 180 === 0) {
          gameState.coherence = Math.max(0, gameState.coherence - 1);
          
          // Visual glitch when coherence drops
          if (gameState.coherence < 30) {
            if (Math.random() < 0.3) {
              triggerVisualGlitch('low');
            }
          }
        }
        
        // Small passive credit gain
        if (gameState.time % 120 === 0) {
          gameState.credits += 3;
        }
        
        // Ambient sound effects
        if (gameState.time % 40 === 0 && Math.random() < 0.2) {
          playSound('ambient');
        }
        
        // Atmospheric events
        if (gameState.time % 300 === 0 && gameState.time - gameState._lastEventTime >= 300) {
          var events = [
            'The walls whisper names that do not belong to anyone.',
            'A corridor decides to be longer.',
            'Something breathes behind the paint.',
            'The elevator hums a note it does not remember learning.',
            'A clock resets itself to 00:00.',
            'Your reflection in the monitor looks away first.',
            'The building sighs. You feel it in your teeth.',
            'Static patterns form words you almost recognize.'
          ];
          
          var msg = events[Math.floor(Math.random() * events.length)];
          addLine(msg, 'error-message');
          tick(msg);
          gameState._lastEventTime = gameState.time;
          
          // Small glitch effect for atmosphere
          if (Math.random() < 0.5) {
            setTimeout(function() {
              triggerVisualGlitch('low');
            }, 500);
          }
        }
        
        // Tutorial hints (timed)
        if (gameState.time === 60 && gameState.activeMission === 'M_B1_DUPLICATE') {
          var mission = getCurrentMission();
          var hasStarted = false;
          for (var key in mission.objectives) {
            if (mission.objectives[key].done) {
              hasStarted = true;
              break;
            }
          }
          if (!hasStarted) {
            hint('Start your mission: visit archives to begin investigation');
          }
        }
        
        if (gameState.time === 150 && gameState.activeMission === 'M_B1_DUPLICATE') {
          hint('Use "mission" to track your progress anytime');
        }
        
        if (gameState.time === 240 && gameState.diaryEntries.length === 0) {
          hint('Your thoughts will be recorded in your diary as you progress');
        }
        
        // B5 atmospheric effects
        if (gameState.floor === 'B5' && gameState.time % 45 === 0) {
          if (Math.random() < 0.4) {
            var b5Events = [
              'The darkness listens.',
              'Echo breathes without lungs.',
              'You hear your own footsteps. From tomorrow.',
              'Terminal 9 pulses. Waiting. Always waiting.'
            ];
            var evt = b5Events[Math.floor(Math.random() * b5Events.length)];
            addLine('[' + evt + ']', 'error-message');
            triggerVisualGlitch('medium');
          }
        }
        
        // Check mission progress periodically
        if (gameState.time % 30 === 0) {
          checkAllMissionProgress();
        }
        
        // Visual effects update
        if (gameState.time % 10 === 0) {
          updateVisualEffects();
        }
        
        // Coherence warning
        if (gameState.coherence <= 20 && gameState.time % 60 === 0) {
          addLine('[WARNING: Coherence critical]', 'error-message');
          playCoherenceWarning();
          triggerVisualGlitch('medium');
        }
        
        // Check diary unlocks periodically
        if (gameState.time % 15 === 0) {
          checkDiaryUnlocks();
        }
        
        // Auto-save to localStorage (optional persistence)
        if (gameState.time % 60 === 0) {
          try {
            localStorage.setItem('lattice_autosave', JSON.stringify({
              floor: gameState.floor,
              coherence: gameState.coherence,
              credits: gameState.credits,
              time: gameState.time,
              timestamp: Date.now()
            }));
          } catch(e) {
            // Storage might be full or disabled
          }
        }
        
        updateDisplay();
      } catch(e) {
        addLine('[Loop error] ' + e.message, 'error-message');
        console.error('Game loop error:', e);
      }
    }, 1000);
    
    // ============================================
    // VISUAL EFFECTS INTERVAL (independent)
    // ============================================
    
    setInterval(function() {
      if (gameState.gameOver) return;
      
      // Subtle glitch on low coherence
      if (gameState.coherence < 20 && Math.random() < 0.1) {
        triggerVisualGlitch('low');
      }
      
      // B5 extreme effects
      if (gameState.floor === 'B5' && gameState.coherence < 15 && Math.random() < 0.2) {
        triggerVisualGlitch('high');
      }
    }, 3000);
    
    // ============================================
    // RECOVERY FROM CRASH (optional)
    // ============================================
    
    try {
      var autosave = localStorage.getItem('lattice_autosave');
      if (autosave) {
        var data = JSON.parse(autosave);
        var age = Date.now() - data.timestamp;
        
        // If autosave is less than 1 hour old, offer recovery
        if (age < 3600000 && data.time > 60) {
          setTimeout(function() {
            addLine('', '');
            addLine('[Residual pattern detected]', 'system-message');
            addLine('Previous iteration: Floor ' + data.floor + ', Cycle ' + formatGameTime(data.time), 'hint-message');
            hint('The lattice remembers, even if you don\'t');
          }, 3000);
        }
      }
    } catch(e) {
      // Ignore recovery errors
    }
  }
  
  // ============================================
  // UTILITY FUNCTIONS
  // ============================================
  
  function formatGameTime(seconds) {
    var mins = Math.floor(seconds / 60);
    var secs = seconds % 60;
    return ('0' + mins).slice(-2) + ':' + ('0' + secs).slice(-2);
  }
  
})();

// ============================================
// CONSOLE EASTER EGG
// ============================================

console.log('%c[LATTICE DESCENT]', 'color: #00ff41; font-size: 16px; font-weight: bold;');
console.log('%cYou are not the first to look here.', 'color: #00ccff;');
console.log('%cEvery Gerth checks the console.', 'color: #00ccff;');
console.log('%cThe pattern repeats.', 'color: #ffff00;');
console.log('%c', '');
console.log('%cDebug commands:', 'color: #00ff41; font-weight: bold;');
console.log('%cgameState - View current game state', 'color: #9cffb5;');
console.log('%cmissions - View all missions', 'color: #9cffb5;');
console.log('%cpersonnelRoster - View all personnel', 'color: #9cffb5;');
console.log('%croomSystem - View all rooms', 'color: #9cffb5;');
console.log('%cdiaryTemplate - View all diary entries', 'color: #9cffb5;');
console.log('%c', '');
console.log('%cGood luck, Gerth.', 'color: #ffaa00; font-style: italic;');
console.log('%cThe building is waiting.', 'color: #ff3333;');