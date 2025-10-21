/* ===========================
   NEXUS PROTOCOL - Main Entry (MISSION SYSTEM v2)
   =========================== */

(function () {
  function onReady(fn) {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      setTimeout(fn, 0);
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }
  
  onReady(init);

  function init() {
    window.addEventListener('error', function (e) {
      try {
        addLine('[SYSTEM ERROR] ' + (e.message || 'unknown'), 'error-message');
      } catch (_) {}
    });

    var bar = $('#loadingBar');
    var p = 0;
    var done = false;
    var timer = null;

    function step() {
      if (done) return;
      p = Math.min(100, p + 20);
      if (bar) bar.style.width = p + '%';
      if (p >= 100) {
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
    
    $('#forceStart').addEventListener('click', function () {
      stop();
      bar.style.width = '100%';
      showGame();
    });

    // Event Listeners
    $('#executeBtn').addEventListener('click', processCommand);
    
    $('#commandInput').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') processCommand();
    });

    $('#shopBtn').addEventListener('click', openShop);
    $('#invBtn').addEventListener('click', openInventory);
    
    $('#soundBtn').addEventListener('click', function () {
      try {
        if (audioCtx && audioCtx.state === 'suspended') {
          audioCtx.resume();
        }
      } catch (e) {}
      gameState.soundEnabled = !gameState.soundEnabled;
      addLine('Sound ' + (gameState.soundEnabled ? 'enabled' : 'disabled'), 'system-message');
      if (gameState.soundEnabled && !ambientSystem.started) {
        setTimeout(startAmbient, 100);
      } else if (!gameState.soundEnabled) {
        stopAmbient();
      }
    });

    $('#hudToggle').addEventListener('click', function () {
      var h = $('#hud');
      h.style.display = h.style.display === 'block' ? 'none' : 'block';
    });

    $('#closeShop').addEventListener('click', function () {
      $('#shopModal').style.display = 'none';
    });

    $('#closeInv').addEventListener('click', function () {
      $('#inventoryModal').style.display = 'none';
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        $('#shopModal').style.display = 'none';
        $('#inventoryModal').style.display = 'none';
      }
    });

    // Audio initialization
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
  }

  function startGame() {
    addLine('═════════════════════════════════', 'system-message');
    addLine('  NEXUS PROTOCOL v4.0', 'system-message');
    addLine('  Mission System Active', 'system-message');
    addLine('═════════════════════════════════', 'system-message');
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
      addLine('═══ MISSION ASSIGNED ═══', 'success-message');
      addLine(firstMission.title, 'success-message');
      addLine(firstMission.briefing, 'system-message');
      addLine('');
    }
    
    hint('Type "mission" to see your objectives');
    hint('Type "help" for all commands');
    addLine('[Orientation stipend] +50¢', 'success-message');

    gameState.credits += 50;
    
    // Initialize side requests (optional)
    fillRequests();
    
    updateDisplay();

    // Game loop
    setInterval(function () {
      if (gameState.gameOver) return;
      try {
        gameState.time++;

        // Slower passive coherence decay
        if (gameState.time % 180 === 0) {
          gameState.coherence = Math.max(0, gameState.coherence - 1);
        }

        // Small passive credit gain
        if (gameState.time % 120 === 0) {
          gameState.credits += 3;
        }

        // Ambient sound
        if (gameState.time % 40 === 0 && Math.random() < 0.2) {
          playSound('ambient');
        }

        // Atmospheric events
        if (gameState.time % 300 === 0 && gameState.time - gameState._lastEventTime >= 300) {
          var events = [
            'The walls whisper names that do not belong to anyone.',
            'A corridor decides to be longer.',
            'Something breathes behind the paint.',
            'The elevator hums a note it does not remember learning.'
          ];
          var msg = events[Math.floor(Math.random() * events.length)];
          addLine(msg, 'error-message');
          tick(msg);
          gameState._lastEventTime = gameState.time;
        }

        // Tutorial hints
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

        // Check mission progress periodically
        if (gameState.time % 30 === 0) {
          checkAllMissionProgress();
        }

        updateDisplay();
      } catch (e) {
        addLine('[Loop error] ' + e.message, 'error-message');
      }
    }, 1000);
  }
})();