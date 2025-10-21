/* ===========================
   NEXUS PROTOCOL - Main Entry (COMPLETE)
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

    // Audio initialization on first interaction
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
    addLine('=================================', 'system-message');
    addLine('NEXUS PROTOCOL v4.0 — Meritocratic', 'system-message');
    addLine('=================================');
    addLine('');
    addLine('Welcome back, Gerth.');
    addLine('The building remembers you one floor at a time.');
    addLine('');
    addLine('You are on Floor B1 — Administrative.');
    addLine('Your terminal keeps making eye contact.');
    addLine('');
    addLine('=== PROGRESSION GUIDE ===', 'system-message');
    addLine('• Complete REQUESTS to earn credits and unlock floors');
    addLine('• Talk to NPCs to gain TRUTHS (required for progression)');
    addLine('• Use SCAN to find notes on each floor');
    addLine('• Access terminals to gather data and complete the pattern (7→3→9)');
    addLine('• Purchase KEYCARD (120¢) and SCANNER (150¢) for deeper access');
    addLine('');
    hint('Type "help" for commands. Use "progress" to see unlock requirements.');
    hint('Start with: look, requests, work');
    addLine('[Orientation stipend] +50¢', 'success-message');

    gameState.credits += 50;
    updateDisplay();
    fillRequests();

    // Game loop - more balanced
    setInterval(function () {
      if (gameState.gameOver) return;
      try {
        gameState.time++;

        // Slower passive coherence decay (every 3 minutes)
        if (gameState.time % 180 === 0) {
          gameState.coherence = Math.max(0, gameState.coherence - 1);
        }

        // Small passive credit gain (every 2 minutes)
        if (gameState.time % 120 === 0) {
          gameState.credits += 3;
        }

        // Ambient sound
        if (gameState.time % 40 === 0 && Math.random() < 0.2) {
          playSound('ambient');
        }

        // Atmospheric events (less frequent)
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
        if (gameState.time === 30 && gameState._completedRequests === 0) {
          hint('Try "work" to earn credits, or "visit archives" to explore.');
        }

        if (gameState.time === 90 && !gameState.floorsUnlocked.B2) {
          hint('Complete requests to progress. Use "requests" to see active tasks.');
        }

        if (gameState._completedRequests === 3 && gameState.truths === 0) {
          hint('You have completed 3 requests! Now you need 1 Truth to unlock B2.');
          hint('Truths are gained by talking to NPCs. B2 will unlock, then talk to Marcus.');
        }

        updateDisplay();
      } catch (e) {
        addLine('[Loop error] ' + e.message, 'error-message');
      }
    }, 1000);
  }
})();