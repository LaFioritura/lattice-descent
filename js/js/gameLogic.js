/* ===========================
   NEXUS PROTOCOL - Game Logic (FIXED - Meritocratic)
   =========================== */

function grantAchievement(id) {
  if (gameState.achievements[id]) return;
  var rule = achRules.find(function (a) { return a.id === id; });
  if (!rule) return;
  gameState.achievements[id] = true;
  gameState.achCount = Object.keys(gameState.achievements).length;
  toast('Recognition granted', '◆ ' + rule.name, 'good');
  addLine('[RECOGNITION] ◆ ' + rule.name, 'success-message');
  playSound('success');
  updateDisplay();
}

function checkAchievements() {
  achRules.forEach(function (r) {
    try {
      if (r.test()) grantAchievement(r.id);
    } catch (e) {}
  });
}

function showPresence() {
  if (gameState.place) return;
  (presenceByFloor[gameState.floor] || []).forEach(function (s) {
    addLine(s, 'system-message');
  });
}

function doLook() {
  var desc = {
    B1: 'Admin level. Forms try to reorder you. Filing cabinets breathe in shifts.',
    B2: 'Security level. Cameras answer slowly. Mirrors remember you twice.',
    B3: 'Research level. Glass eavesdrops. Samples watch back.',
    B4: 'Maintenance level. Pipes practice breathing. Mops know your rhythm.',
    B5: 'Lowest level. Architecture forgets geometry. Pressure feels like recognition.'
  };
  addLine(desc[gameState.floor]);
  if (gameState.presenceHints) showPresence();
  if (!gameState.place) {
    Object.values(npcsData).forEach(function (npc) {
      if (npc.location === gameState.floor && gameState.floorsUnlocked[gameState.floor] && npc !== npcsData.echo) {
        addLine(npc.name + ' is here.', 'success-message');
      }
    });
    if (gameState.floor === 'B5' && gameState.floorsUnlocked.B5) {
      addLine(gameState.echoUnlocked ? 'Something answers your breathing.' : 'Silence learns your outlines.', 'thought');
    }
  }
}

// ===== CLEAR PROGRESSION REQUIREMENTS =====
function canUnlockFloor(floor) {
  if (floor === 'B2') {
    // B2: Complete 3 requests + gain 1 Truth (from talking to Marcus once unlocked)
    return gameState._completedRequests >= 3 && gameState.truths >= 1;
  }
  if (floor === 'B3') {
    // B3: B2 unlocked + talked to Marcus + 2 Truths + 2 more requests
    return gameState.floorsUnlocked.B2 && gameState.met.marcus > 0 && gameState.truths >= 2 && gameState._completedRequests >= 5;
  }
  if (floor === 'B4') {
    // B4: B3 unlocked + Keycard purchased + talked to Sarah + 3 Truths
    var hasKeycard = gameState.inventory.some(function (i) { return i.id === 'keycard'; });
    return gameState.floorsUnlocked.B3 && hasKeycard && gameState.met.sarah > 0 && gameState.truths >= 3;
  }
  if (floor === 'B5') {
    // B5: B4 unlocked + Keycard + Scanner + Pattern complete (7→3→9) + talked to Janitor + 4 Truths
    var hasKeycard = gameState.inventory.some(function (i) { return i.id === 'keycard'; });
    var hasScanner = gameState.inventory.some(function (i) { return i.id === 'scanner'; });
    var patternDone = gameState.dataChain && gameState.dataChain.done;
    return gameState.floorsUnlocked.B4 && hasKeycard && hasScanner && patternDone && gameState.met.janitor > 0 && gameState.truths >= 4;
  }
  return false;
}

function tryUnlockB2() {
  if (!gameState.floorsUnlocked.B2 && canUnlockFloor('B2')) {
    gameState.floorsUnlocked.B2 = true;
    think('The elevator remembers the way to B2.');
    toast('Access expanded', 'B2 is now reachable.', 'info');
    hint('Security level unlocked. Marcus Webb awaits. Use: move b2');
  }
}

function tryUnlockB3() {
  if (!gameState.floorsUnlocked.B3 && canUnlockFloor('B3')) {
    gameState.floorsUnlocked.B3 = true;
    think('Research starts taking my calls.');
    toast('Access expanded', 'B3 is now reachable.', 'info');
    hint('Research level unlocked. Dr. Sarah Chen is there. Use: move b3');
  }
}

function tryUnlockB4() {
  if (!gameState.floorsUnlocked.B4 && canUnlockFloor('B4')) {
    gameState.floorsUnlocked.B4 = true;
    think('Maintenance signs my permission with a wet glove.');
    toast('Access expanded', 'B4 is now reachable.', 'info');
    hint('Maintenance level unlocked. Custodian Unit 4 maintains the depths. Use: move b4');
  }
}

function tryUnlockB5() {
  if (!gameState.floorsUnlocked.B5 && canUnlockFloor('B5')) {
    gameState.floorsUnlocked.B5 = true;
    think('The bottom floor exhales.');
    toast('Access expanded', 'B5 is now reachable.', 'warn');
    hint('WARNING: B5 drains coherence rapidly. Ensure you have Scanner and Pattern complete.');
  }
}

function pickDistinct(arr, n) {
  var pool = arr.slice(), out = [];
  while (pool.length && out.length < n) {
    out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return out;
}

// ===== BALANCED REQUEST SYSTEM =====
function makeRequest() {
  var k = requestKinds[Math.floor(Math.random() * requestKinds.length)];
  var id = Math.random().toString(36).slice(2, 7);
  var meta = {}, goal = 1, progress = 0, reward = 40, desc = '';

  if (k === 'visit') {
    var places_to_visit = pickDistinct(places, 2);
    meta.places = places_to_visit;
    meta.donePlaces = {};
    goal = places_to_visit.length;
    reward = 60;
    desc = 'Visit: ' + places_to_visit.join(', ');
  } else if (k === 'speak') {
    var npcs_to_talk = pickDistinct(['guard', 'researcher', 'custodian'], 2);
    meta.who = npcs_to_talk;
    meta.done = {};
    goal = npcs_to_talk.length;
    reward = 70;
    desc = 'Speak with: ' + npcs_to_talk.join(' & ');
  } else if (k === 'terminals') {
    var terms = pickDistinct([1, 2, 3, 4, 5, 6], 3);
    meta.terminals = terms;
    meta.done = {};
    goal = terms.length;
    reward = 80;
    desc = 'Access terminals: ' + terms.join(', ');
  } else if (k === 'scan') {
    goal = 2;
    reward = 50;
    desc = 'Scan vents (2x)';
  } else if (k === 'work') {
    goal = 3;
    reward = 60;
    desc = 'Complete work shifts (3x)';
  } else if (k === 'clean') {
    goal = 2;
    reward = 55;
    desc = 'Help maintenance (2 corridors)';
  } else if (k === 'rest') {
    meta.targetCoherence = 85;
    reward = 40;
    desc = 'Restore coherence above 85%';
  } else if (k === 'files') {
    goal = 2;
    reward = 70;
    desc = 'Read 2 files';
  }

  return { id: id, kind: k, desc: desc, goal: goal, progress: progress, reward: reward, meta: meta };
}

function fillRequests() {
  gameState.requests = [];
  for (var i = 0; i < 3; i++) gameState.requests.push(makeRequest());
}

function listRequests() {
  if (gameState.requests.length === 0) fillRequests();
  addLine('=== ACTIVE REQUESTS ===', 'system-message');
  gameState.requests.forEach(function (r, i) {
    var status = r.progress >= r.goal ? '[DONE]' : '[' + r.progress + '/' + r.goal + ']';
    addLine((i + 1) + '. ' + r.desc + ' ' + status + ' — ' + r.reward + '¢');
  });
  addLine('Use "accept [n]" to focus. "refresh" (-20¢) for new requests.');
}

// ===== DETERMINISTIC REWARDS =====
function finishRequest(r) {
  addLine('[COMPLETED] ' + r.desc + ' [+' + r.reward + '¢]', 'success-message');
  gameState.credits += r.reward;
  playSound('success');
  gameState._completedRequests++;
  createParticles(15, $('#credits').parentElement);

  // Fixed progression checks
  if (gameState._completedRequests === 3 && gameState.truths >= 1) {
    tryUnlockB2();
  }
  if (gameState._completedRequests === 5 && gameState.met.marcus > 0 && gameState.truths >= 2) {
    tryUnlockB3();
  }

  // Deterministic note reward: every 2 completed requests
  if (gameState._completedRequests % 2 === 0) {
    var pool = Object.keys(noteBank).filter(function (id) { return gameState.notes.indexOf(id) === -1; });
    if (pool.length) {
      grantNote(pool[0]); // First available note
    }
  }

  updateDisplay();
}

function completeRequestIf(kind, payload) {
  gameState.requests.forEach(function (r) {
    if (r.progress >= r.goal || r.kind !== kind) return;

    if (kind === 'visit' && r.meta.places && r.meta.places.indexOf(payload) > -1 && !r.meta.donePlaces[payload]) {
      r.meta.donePlaces[payload] = true;
      r.progress++;
      addLine('[Request: ' + r.progress + '/' + r.goal + ']', 'success-message');
    } else if (kind === 'speak' && r.meta.who) {
      for (var i = 0; i < r.meta.who.length; i++) {
        if (payload.indexOf(r.meta.who[i]) > -1 && !r.meta.done[r.meta.who[i]]) {
          r.meta.done[r.meta.who[i]] = true;
          r.progress++;
          addLine('[Request: ' + r.progress + '/' + r.goal + ']', 'success-message');
          break;
        }
      }
    } else if (kind === 'terminals' && r.meta.terminals && r.meta.terminals.indexOf(Number(payload)) > -1 && !r.meta.done[payload]) {
      r.meta.done[payload] = true;
      r.progress++;
      addLine('[Request: ' + r.progress + '/' + r.goal + ']', 'success-message');
    } else if ((kind === 'scan' || kind === 'clean' || kind === 'work') && !payload) {
      r.progress++;
      addLine('[Request: ' + r.progress + '/' + r.goal + ']', 'success-message');
    } else if (kind === 'rest' && r.meta.targetCoherence && gameState.coherence >= r.meta.targetCoherence) {
      r.progress = r.goal;
    } else if (kind === 'files' && payload === 'read') {
      r.progress++;
      addLine('[Request: ' + r.progress + '/' + r.goal + ']', 'success-message');
    }

    if (r.progress >= r.goal) finishRequest(r);
  });
}

// ===== DETERMINISTIC NOTE/FILE SYSTEM =====
function grantNote(id) {
  if (gameState.notes.indexOf(id) === -1) {
    gameState.notes.push(id);
    addLine('[NOTE] ' + noteBank[id], 'success-message');
    toast('New Note', noteBank[id], 'good');
    playSound('notification');
    updateDisplay();
  }
}

function grantFile(obj) {
  if (!gameState.files.find(function (f) { return f.id === obj.id; })) {
    gameState.files.push(obj);
    addLine('[FILE] ' + obj.id + ' — ' + obj.title, 'success-message');
    toast('New File', obj.title, 'info');
    playSound('notification');
    updateDisplay();
  }
}

function listFiles() {
  addLine('=== COLLECTED FILES ===', 'system-message');
  if (gameState.files.length === 0) {
    addLine('No files collected yet.');
    return;
  }
  gameState.files.forEach(function (f) {
    addLine(f.id + ' — ' + f.title);
  });
  addLine('Use: read [id]');
}

function readFile(arg) {
  if (!arg) {
    addLine('Read what? Use file ID.', 'error-message');
    return;
  }
  var s = arg.toUpperCase();
  var f = gameState.files.find(function (x) { return x.id === s || x.title.toLowerCase().indexOf(arg.toLowerCase()) > -1; });
  if (!f) {
    addLine('No such file in your collection.', 'error-message');
    return;
  }
  addLine('=== ' + f.id + ' — ' + f.title + ' ===', 'system-message');
  f.body.forEach(function (p) { addLine(p); });

  // Fixed: Only specific files grant truths, and only once
  if (f.grantsTruth && !f._truthGranted) {
    gameState.truths++;
    think('The pieces agree for a breath.');
    createParticles(8, $('#coherence').parentElement);
    f._truthGranted = true;
    addLine('[+1 Truth]', 'success-message');
  }

  completeRequestIf('files', 'read');
  updateDisplay();
}

// ===== SCAN SYSTEM - Limited but fair =====
function scanEvent() {
  addLine('[I steady my breath and listen...]', 'system-message');
  playSound('glitch');
  flashGlitch();
  
  var loss = 4;
  gameState.coherence = Math.max(0, gameState.coherence - loss);
  addLine('[-' + loss + ' Coherence]', 'error-message');

  // Deterministic note drops based on floor
  var floorNotes = {
    'B1': ['N1', 'N3', 'N6'],
    'B2': ['N2', 'N4', 'N16'],
    'B3': ['N7', 'N8', 'N10'],
    'B4': ['N5', 'N13'],
    'B5': ['N9', 'N11', 'N12', 'N14', 'N15']
  };

  var availableNotes = (floorNotes[gameState.floor] || []).filter(function (id) {
    return gameState.notes.indexOf(id) === -1;
  });

  if (availableNotes.length > 0) {
    grantNote(availableNotes[0]); // Give first available note for this floor
  } else {
    addLine('[The vents have nothing new to say here.]', 'thought');
  }

  completeRequestIf('scan');
  updateDisplay();
}

// ===== TERMINAL PATTERN SYSTEM =====
function initDataChain() {
  if (gameState.dataChain) return;
  gameState.dataChain = { steps: [7, 3, 9], index: 0, done: false };
  think('A pattern emerges from the terminal logs: 7 → 3 → 9.');
  hint('Access terminals in this specific sequence to complete the pattern.');
}

function processTerminalAccess(tnum) {
  var num = parseInt(tnum, 10);
  
  // Auto-initialize pattern on first terminal 7, 3, or 9 access
  if (!gameState.dataChain && (num === 7 || num === 3 || num === 9)) {
    initDataChain();
  }

  // Check pattern progression
  if (gameState.dataChain && !gameState.dataChain.done) {
    var expected = gameState.dataChain.steps[gameState.dataChain.index];
    
    if (num === expected) {
      gameState.dataChain.index++;
      gameState._terminalPattern.push(num);
      think('Pattern progress: ' + gameState._terminalPattern.join(' → '));

      if (gameState.dataChain.index >= gameState.dataChain.steps.length) {
        gameState.dataChain.done = true;
        gameState.truths++;
        addLine('[PATTERN COMPLETE] Something in me stops resisting.', 'success-message');
        addLine('[+1 Truth]', 'success-message');
        toast('Data Chain Complete', 'Pattern 7→3→9 recognized', 'good');
        createParticles(20, document.body);
        hint('Pattern complete. B5 access is closer if you have Scanner, Keycard, and 4 Truths.');
        
        // Check if B5 can be unlocked now
        tryUnlockB5();
      }
    } else if (num === 7 || num === 3 || num === 9) {
      addLine('[Pattern broken. Restart from terminal 7.]', 'error-message');
      gameState.dataChain.index = 0;
      gameState._terminalPattern = [];
    }
  }
}

// ===== ECHO UNLOCK SYSTEM =====
function maybeUnlockEcho() {
  if (gameState.echoUnlocked) return;
  
  // Echo requires: B5 unlocked + talked to Marcus, Sarah, and Janitor + 4 Truths + Pattern done
  var spokeToAll = gameState.met.marcus > 0 && gameState.met.sarah > 0 && gameState.met.janitor > 0;
  var hasPattern = gameState.dataChain && gameState.dataChain.done;
  
  if (gameState.floorsUnlocked.B5 && spokeToAll && gameState.truths >= 4 && hasPattern) {
    gameState.echoUnlocked = true;
    think('The hush on B5 starts answering the outline of my breath.');
    toast('A presence stirs', 'Echo listens on B5.', 'warn');
    hint('Echo can now be contacted on B5 using: talk voice');
  }
}

// ===== LOSE/WIN CONDITIONS =====
function checkLose() {
  if (gameState.coherence <= 0) {
    gameState.coherence = 0;
    triggerGameOver('COHERENCE COLLAPSE');
  }
}

function triggerGameOver(reason) {
  if (gameState.gameOver) return;
  gameState.gameOver = true;
  $('#commandInput').disabled = true;
  $('#executeBtn').disabled = true;

  var mins = ('0' + Math.floor(gameState.time / 60)).slice(-2);
  var secs = ('0' + (gameState.time % 60)).slice(-2);

  var html = '<p class="error-message"><strong>' + reason + '</strong></p>' +
    '<p>Time survived: <strong>' + mins + ':' + secs + '</strong></p>' +
    '<p>Credits earned: <strong>' + gameState.credits + '¢</strong></p>' +
    '<p>Truths gathered: <strong>' + gameState.truths + '</strong></p>' +
    '<p>Notes found: <strong>' + gameState.notes.length + '/16</strong></p>' +
    '<p>Files collected: <strong>' + gameState.files.length + '/' + fileBank.length + '</strong></p>' +
    '<p>Requests completed: <strong>' + gameState._completedRequests + '</strong></p>' +
    '<div style="margin-top:10px"><button class="action-btn" id="restartBtn">RESTART</button></div>';

  $('#gameOverContent').innerHTML = html;
  $('#gameOverModal').style.display = 'block';
  $('#restartBtn').onclick = function () { location.reload(); };

  addLine('=== PERMADEATH ACTIVATED ===', 'system-message');
  playSound('error');
  stopAmbient();
}

function triggerWin() {
  if (gameState.gameOver) return;
  gameState.gameOver = true;
  gameState._won = true;
  $('#commandInput').disabled = true;
  $('#executeBtn').disabled = true;

  var mins = ('0' + Math.floor(gameState.time / 60)).slice(-2);
  var secs = ('0' + (gameState.time % 60)).slice(-2);

  var html = '<p class="success-message"><strong>YOU REMEMBER YOUR NAME</strong></p>' +
    '<p>Time to revelation: <strong>' + mins + ':' + secs + '</strong></p>' +
    '<p>Final Coherence: <strong>' + gameState.coherence + '%</strong></p>' +
    '<p>Truths gathered: <strong>' + gameState.truths + '</strong></p>' +
    '<p>Notes found: <strong>' + gameState.notes.length + '/16</strong></p>' +
    '<p>Files collected: <strong>' + gameState.files.length + '/' + fileBank.length + '</strong></p>' +
    '<p>Requests completed: <strong>' + gameState._completedRequests + '</strong></p>' +
    '<p>Achievements: <strong>' + gameState.achCount + '</strong></p>' +
    '<div style="margin-top:10px"><button class="action-btn" id="restartBtn2">RESTART</button></div>';

  $('#winContent').innerHTML = html;
  $('#winModal').style.display = 'block';
  $('#restartBtn2').onclick = function () { location.reload(); };

  addLine('=== REVELATION COMPLETE ===', 'system-message');
  toast('Achievement unlocked', 'Revelation', 'good');
  grantAchievement('ACH_WIN');
  playSound('success');
  createParticles(30, document.body);
}

// ===== ITEM USAGE =====
function useItem(name) {
  var item = gameState.inventory.find(function (i) {
    return i.name.toLowerCase().indexOf(name.toLowerCase()) > -1;
  });
  if (!item) {
    addLine('You do not have that item.', 'error-message');
    return;
  }

  if (item.id === 'stim') {
    gameState.coherence = Math.min(100, gameState.coherence + 20);
    addLine('[My thoughts fall into line] +20 Coherence', 'success-message');
    playSound('success');
    createParticles(15, $('#coherence').parentElement);
    gameState.inventory = gameState.inventory.filter(function (i) { return i !== item; });
    
    // Check rest request completion
    gameState.requests.forEach(function (r) {
      if (r.kind === 'rest' && r.meta.targetCoherence && gameState.coherence >= r.meta.targetCoherence) {
        completeRequestIf('rest', 'restore');
      }
    });
  } else if (item.id === 'keycard') {
    if (gameState._keycardUsed) {
      addLine('[Keycard already activated.]', 'thought');
      return;
    }
    gameState._keycardUsed = true;
    addLine('[Green light. Doors remember me now.]', 'system-message');
    createParticles(10, $('#floor').parentElement);
    toast('Keycard activated', 'Access permissions updated', 'info');
    
    // Check if we can unlock B4 now
    tryUnlockB4();
  } else if (item.id === 'scanner') {
    if (gameState._scannerUsed) {
      addLine('[Scanner cooldown active. Wait before using again.]', 'thought');
      return;
    }
    gameState._scannerUsed = true;
    
    addLine('[I hold the scanner to the wall...]', 'system-message');
    setTimeout(function () {
      addLine('[It hears something breathing behind the paint.]', 'thought');
      playSound('glitch');
      flashGlitch();
      
      // Grant floor-specific file
      var floorFiles = fileBank.filter(function (f) {
        return f.floor === gameState.floor && !gameState.files.find(function (x) { return x.id === f.id; });
      });
      
      if (floorFiles.length > 0) {
        grantFile(floorFiles[0]);
      }
      
      // Reset cooldown after 3 seconds
      setTimeout(function () {
        gameState._scannerUsed = false;
        think('Scanner recharged.');
      }, 3000);
      
      tryUnlockB5();
    }, 900);
  } else if (item.id === 'backup') {
    addLine('[I save a version of me I will never meet.]', 'system-message');
    addLine('(This place files everyone.)', 'thought');
    toast('Memory Backup', 'Consciousness snapshot saved', 'warn');
    createParticles(20, document.body);
  }

  updateDisplay();
}

// ===== NPC DIALOGUE SYSTEM =====
function talkTo(npcId) {
  var npc = npcsData[npcId];
  if (!npc) return;

  // Check max talks limit
  if (gameState.met[npcId] >= npc.maxTalks) {
    addLine('[' + npc.name + ' has nothing more to say right now.]', 'thought');
    return;
  }

  var bank = tierLines[npcId] || [['...']];
  var tierIndex = Math.min(gameState.met[npcId], bank.length - 1);
  var lines = bank[tierIndex];
  var line = lines[Math.floor(Math.random() * lines.length)];

  addLine('[' + npc.name + ']:', 'npc-message');
  addLine(line, 'npc-message');

  // DETERMINISTIC TRUTH GAIN
  // First talk with Marcus: +1 Truth (needed for B2)
  // First talk with Sarah: +1 Truth
  // First talk with Janitor: +1 Truth
  // First talk with Echo: +1 Truth
  
  if (gameState.met[npcId] === 0) {
    gameState.truths++;
    addLine('[+1 Truth] Their words find a place to sit in me.', 'success-message');
    createParticles(10, $('#coherence').parentElement);
    
    // Grant floor-specific file on first meeting
    var floorFiles = fileBank.filter(function (f) {
      return f.floor === npc.location && !gameState.files.find(function (x) { return x.id === f.id; });
    });
    if (floorFiles.length > 0) {
      grantFile(floorFiles[0]);
    }
  }

  gameState.met[npcId]++;

  // Progression checks after talking
  if (npcId === 'marcus' && gameState.met.marcus === 1) {
    // First Marcus talk grants 1 Truth, check if B2 can unlock (need 3 requests too)
    if (gameState._completedRequests >= 3) {
      tryUnlockB2();
    } else {
      hint('Complete ' + (3 - gameState._completedRequests) + ' more requests to unlock B2.');
    }
  }

  if (npcId === 'sarah' && gameState.met.sarah === 1) {
    // Check B4 unlock
    tryUnlockB4();
  }

  if (npcId === 'janitor' && gameState.met.janitor === 1) {
    // Janitor trust increases
    gameState.janitorTrust += 20;
    tryUnlockB5();
  }

  if (npcId === 'marcus') {
    tryUnlockB3();
  }

  // Check for request completion
  completeRequestIf('speak', npc.role[0]);

  // Check Echo unlock
  maybeUnlockEcho();

  updateDisplay();
}