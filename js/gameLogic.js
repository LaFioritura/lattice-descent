/* ===========================
   NEXUS PROTOCOL - Game Logic (MISSION SYSTEM v2)
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

// ===== MISSION SYSTEM =====

function getCurrentMission() {
  if (!gameState.activeMission) return null;
  return missions[gameState.activeMission];
}

function updateMissionObjective(objId, value) {
  var mission = getCurrentMission();
  if (!mission) return;
  
  var obj = mission.objectives[objId];
  if (!obj || obj.done) return;
  
  var wasComplete = isMissionComplete(mission);
  
  // Update based on type
  if (obj.type === 'work_count' || obj.type === 'scan_count' || obj.type === 'clean_count') {
    obj.progress = (obj.progress || 0) + 1;
    if (obj.progress >= obj.target) {
      obj.done = true;
      addLine('[OBJECTIVE] ' + obj.desc + ' ✓', 'success-message');
    } else {
      addLine('[OBJECTIVE] ' + obj.desc + ' (' + obj.progress + '/' + obj.target + ')', 'system-message');
    }
  } else if (obj.type === 'terminal_list') {
    if (obj.progress.indexOf(value) === -1) {
      obj.progress.push(value);
      addLine('[OBJECTIVE] Terminal ' + value + ' accessed (' + obj.progress.length + '/' + obj.targets.length + ')', 'system-message');
      if (obj.progress.length >= obj.targets.length) {
        obj.done = true;
        addLine('[OBJECTIVE] ' + obj.desc + ' ✓', 'success-message');
      }
    }
  } else if (obj.type === 'talk_npc') {
    if (obj.count && gameState.met[obj.target] >= obj.count) {
      obj.done = true;
      addLine('[OBJECTIVE] ' + obj.desc + ' ✓', 'success-message');
    }
  } else if (obj.type === 'file_find') {
    if (gameState.files.some(function(f) { return f.id === obj.target; })) {
      obj.done = true;
      addLine('[OBJECTIVE] ' + obj.desc + ' ✓', 'success-message');
    }
  } else if (obj.type === 'file_read') {
    if (gameState.files.some(function(f) { return f.id === obj.target && f._read; })) {
      obj.done = true;
      addLine('[OBJECTIVE] ' + obj.desc + ' ✓', 'success-message');
    }
  } else if (obj.type === 'coherence') {
    if (gameState.coherence >= obj.target) {
      obj.done = true;
    }
  } else if (obj.type === 'notes_count') {
    if (gameState.notes.length >= obj.target) {
      obj.done = true;
      addLine('[OBJECTIVE] ' + obj.desc + ' ✓', 'success-message');
    }
  } else if (obj.type === 'truths_count') {
    if (gameState.truths >= obj.target) {
      obj.done = true;
    }
  } else if (obj.type === 'inventory_check') {
    if (gameState.inventory.some(function(i) { return i.id === obj.target; })) {
      obj.done = true;
    }
  } else if (obj.type === 'purchase') {
    if (gameState.inventory.some(function(i) { return i.id === obj.target; })) {
      obj.done = true;
      addLine('[OBJECTIVE] ' + obj.desc + ' ✓', 'success-message');
    }
  } else if (obj.type === 'special') {
    // Handled by specific triggers
    if (value === obj.target) {
      obj.done = true;
      addLine('[OBJECTIVE] ' + obj.desc + ' ✓', 'success-message');
    }
  } else if (obj.type === 'pattern_step') {
    if (gameState.dataChain && gameState._terminalPattern.indexOf(obj.target) > -1) {
      obj.done = true;
      addLine('[OBJECTIVE] ' + obj.desc + ' ✓', 'success-message');
    }
  } else if (obj.type === 'terminal_final') {
    // Victory condition
    obj.done = true;
  } else {
    // Generic completion
    obj.done = true;
    addLine('[OBJECTIVE] ' + obj.desc + ' ✓', 'success-message');
  }
  
  // Check if mission just completed
  if (!wasComplete && isMissionComplete(mission)) {
    completeMission(mission);
  }
  
  updateDisplay();
}

function isMissionComplete(mission) {
  if (!mission) return false;
  var allDone = true;
  for (var key in mission.objectives) {
    if (!mission.objectives[key].done) {
      allDone = false;
      break;
    }
  }
  return allDone;
}

function completeMission(mission) {
  if (!mission) return;
  
  addLine('', '');
  addLine('═══════════════════════════════', 'system-message');
  addLine('   MISSION COMPLETE', 'success-message');
  addLine('   ' + mission.title, 'success-message');
  addLine('═══════════════════════════════', 'system-message');
  addLine(mission.rewards.completionText, 'success-message');
  addLine('', '');
  
  // Grant rewards
  if (mission.rewards.truths) {
    gameState.truths += mission.rewards.truths;
    addLine('[+' + mission.rewards.truths + ' Truth]', 'success-message');
    createParticles(15, $('#coherence').parentElement);
  }
  
  if (mission.rewards.credits) {
    gameState.credits += mission.rewards.credits;
    addLine('[+' + mission.rewards.credits + '¢ Bonus]', 'success-message');
  }
  
  // Unlock floor
  if (mission.rewards.unlockFloor) {
    gameState.floorsUnlocked[mission.rewards.unlockFloor] = true;
    toast('Floor Unlocked', mission.rewards.unlockFloor + ' is now accessible', 'good');
    hint('Use: move ' + mission.rewards.unlockFloor.toLowerCase());
  }
  
  // Victory
  if (mission.rewards.victory) {
    setTimeout(function() {
      triggerWin();
    }, 2000);
    return;
  }
  
  // Mark complete
  gameState.completedMissions.push(mission.id);
  
  // Activate next mission
  var nextMissions = {
    'M_B1_DUPLICATE': 'M_B2_CORRIDOR',
    'M_B2_CORRIDOR': 'M_B3_ANCHOR',
    'M_B3_ANCHOR': 'M_B4_PATTERN',
    'M_B4_PATTERN': 'M_B5_REVELATION'
  };
  
  if (nextMissions[mission.id]) {
    gameState.activeMission = nextMissions[mission.id];
    var nextMission = missions[nextMissions[mission.id]];
    addLine('', '');
    addLine('[NEW MISSION] ' + nextMission.title, 'system-message');
    addLine(nextMission.briefing, 'system-message');
    hint('Use "mission" to see objectives');
  }
  
  playSound('success');
  createParticles(30, document.body);
  checkAchievements();
  updateDisplay();
}

// ===== MISSION TRACKING HELPERS =====

function checkAllMissionProgress() {
  var mission = getCurrentMission();
  if (!mission) return;
  
  // Check all objectives that can auto-complete
  for (var key in mission.objectives) {
    var obj = mission.objectives[key];
    if (obj.done) continue;
    
    if (obj.type === 'coherence' && gameState.coherence >= obj.target) {
      obj.done = true;
    } else if (obj.type === 'notes_count' && gameState.notes.length >= obj.target) {
      updateMissionObjective(key);
    } else if (obj.type === 'truths_count' && gameState.truths >= obj.target) {
      obj.done = true;
    } else if (obj.type === 'inventory_check') {
      if (gameState.inventory.some(function(i) { return i.id === obj.target; })) {
        obj.done = true;
      }
    }
  }
  
  if (isMissionComplete(mission)) {
    completeMission(mission);
  }
}

// ===== NOTE/FILE SYSTEM =====

function grantNote(id) {
  if (gameState.notes.indexOf(id) === -1) {
    gameState.notes.push(id);
    addLine('[NOTE] ' + noteBank[id], 'success-message');
    toast('New Note', noteBank[id], 'good');
    playSound('notification');
    
    // Check mission progress
    var mission = getCurrentMission();
    if (mission) {
      for (var key in mission.objectives) {
        if (mission.objectives[key].type === 'notes_count') {
          updateMissionObjective(key);
          break;
        }
      }
    }
    
    updateDisplay();
  }
}

function grantFile(obj) {
  if (!gameState.files.find(function (f) { return f.id === obj.id; })) {
    gameState.files.push(obj);
    addLine('[FILE] ' + obj.id + ' — ' + obj.title, 'success-message');
    toast('New File', obj.title, 'info');
    playSound('notification');
    hint('Use "read ' + obj.id + '" to analyze this file');
    
    // Check mission progress
    var mission = getCurrentMission();
    if (mission) {
      for (var key in mission.objectives) {
        var objDef = mission.objectives[key];
        if (objDef.type === 'file_find' && objDef.target === obj.id) {
          updateMissionObjective(key);
          break;
        }
      }
    }
    
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
    var readStatus = f._read ? ' [READ]' : ' [UNREAD]';
    addLine(f.id + ' — ' + f.title + readStatus);
  });
  addLine('Use: read [id] to analyze files');
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

  if (!f._read) {
    f._read = true;
    addLine('[File analyzed and marked as read]', 'success-message');
    
    // Check mission progress
    var mission = getCurrentMission();
    if (mission) {
      for (var key in mission.objectives) {
        var obj = mission.objectives[key];
        if (obj.type === 'file_read' && obj.target === f.id) {
          updateMissionObjective(key);
          break;
        }
      }
    }
  }

  if (f.grantsTruth && !f._truthGranted) {
    gameState.truths++;
    think('The pieces agree for a breath.');
    createParticles(8, $('#coherence').parentElement);
    f._truthGranted = true;
    addLine('[+1 Truth]', 'success-message');
  }

  checkAllMissionProgress();
  updateDisplay();
}

// ===== SCAN SYSTEM =====

function scanEvent() {
  addLine('[I steady my breath and listen...]', 'system-message');
  playSound('glitch');
  flashGlitch();
  
  var loss = 4;
  gameState.coherence = Math.max(0, gameState.coherence - loss);
  addLine('[-' + loss + ' Coherence]', 'error-message');

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
    grantNote(availableNotes[0]);
  } else {
    addLine('[The vents have nothing new to say here.]', 'thought');
  }

  // Update mission scan objectives
  var mission = getCurrentMission();
  if (mission) {
    for (var key in mission.objectives) {
      var obj = mission.objectives[key];
      if (obj.type === 'scan_count' && !obj.done) {
        updateMissionObjective(key, 1);
        break;
      }
    }
  }

  updateDisplay();
}

// ===== TERMINAL PATTERN SYSTEM =====

function initDataChain() {
  if (gameState.dataChain) return;
  gameState.dataChain = { steps: [7, 3, 9], index: 0, done: false };
  think('A pattern emerges: 7 → 3 → 9.');
  hint('Access terminals in this specific sequence.');
}

function processTerminalAccess(tnum) {
  var num = parseInt(tnum, 10);
  
  if (!gameState.dataChain && (num === 7 || num === 3 || num === 9)) {
    initDataChain();
  }

  if (gameState.dataChain && !gameState.dataChain.done) {
    var expected = gameState.dataChain.steps[gameState.dataChain.index];
    
    if (num === expected) {
      gameState.dataChain.index++;
      gameState._terminalPattern.push(num);
      think('Pattern progress: ' + gameState._terminalPattern.join(' → '));

      // Update mission
      var mission = getCurrentMission();
      if (mission && mission.id === 'M_B4_PATTERN') {
        if (num === 7) updateMissionObjective('pattern_7');
        if (num === 3) updateMissionObjective('pattern_3');
        if (num === 9) updateMissionObjective('pattern_9');
      }

      if (gameState.dataChain.index >= gameState.dataChain.steps.length) {
        gameState.dataChain.done = true;
        gameState.truths++;
        addLine('[PATTERN COMPLETE] Something in me stops resisting.', 'success-message');
        addLine('[+1 Truth]', 'success-message');
        toast('Pattern Complete', 'Sequence 7→3→9 recognized', 'good');
        createParticles(20, document.body);
      }
    } else if (num === 7 || num === 3 || num === 9) {
      addLine('[Pattern broken. Restart from terminal 7.]', 'error-message');
      gameState.dataChain.index = 0;
      gameState._terminalPattern = [];
    }
  }
  
  // Update mission terminal objectives
  var mission = getCurrentMission();
  if (mission) {
    for (var key in mission.objectives) {
      var obj = mission.objectives[key];
      if (obj.type === 'terminal_list' && !obj.done) {
        if (obj.targets.indexOf(num) > -1) {
          updateMissionObjective(key, num);
        }
        break;
      }
    }
  }
}

// ===== ECHO UNLOCK =====

function maybeUnlockEcho() {
  if (gameState.echoUnlocked) return;
  
  var spokeToAll = gameState.met.marcus > 0 && gameState.met.sarah > 0 && gameState.met.janitor > 0;
  var hasPattern = gameState.dataChain && gameState.dataChain.done;
  
  if (gameState.floorsUnlocked.B5 && spokeToAll && gameState.truths >= 4 && hasPattern) {
    gameState.echoUnlocked = true;
    think('The hush on B5 starts answering.');
    toast('A presence stirs', 'Echo listens on B5', 'warn');
    hint('Echo can be contacted on B5: talk voice');
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
    '<p>Credits: <strong>' + gameState.credits + '¢</strong></p>' +
    '<p>Truths: <strong>' + gameState.truths + '</strong></p>' +
    '<p>Notes: <strong>' + gameState.notes.length + '/16</strong></p>' +
    '<p>Files: <strong>' + gameState.files.length + '/' + fileBank.length + '</strong></p>' +
    '<p>Missions: <strong>' + gameState.completedMissions.length + '/5</strong></p>' +
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
    '<p>Truths: <strong>' + gameState.truths + '</strong></p>' +
    '<p>Notes: <strong>' + gameState.notes.length + '/16</strong></p>' +
    '<p>Files: <strong>' + gameState.files.length + '/' + fileBank.length + '</strong></p>' +
    '<p>Missions: <strong>' + gameState.completedMissions.length + '/5</strong></p>' +
    '<p>Achievements: <strong>' + gameState.achCount + '</strong></p>' +
    '<div style="margin-top:10px"><button class="action-btn" id="restartBtn2">RESTART</button></div>';

  $('#winContent').innerHTML = html;
  $('#winModal').style.display = 'block';
  $('#restartBtn2').onclick = function () { location.reload(); };

  addLine('=== REVELATION COMPLETE ===', 'system-message');
  toast('Achievement', 'Revelation', 'good');
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
    checkAllMissionProgress();
    
  } else if (item.id === 'keycard') {
    if (gameState._keycardUsed) {
      addLine('[Keycard already activated.]', 'thought');
      return;
    }
    gameState._keycardUsed = true;
    addLine('[Green light. Doors remember me now.]', 'system-message');
    createParticles(10, $('#floor').parentElement);
    toast('Keycard activated', 'Access permissions updated', 'info');
    
  } else if (item.id === 'scanner') {
    if (gameState._scannerUsed) {
      addLine('[Scanner cooldown active.]', 'thought');
      return;
    }
    gameState._scannerUsed = true;
    
    addLine('[I hold the scanner to the wall...]', 'system-message');
    setTimeout(function () {
      addLine('[It hears something breathing behind the paint.]', 'thought');
      playSound('glitch');
      flashGlitch();
      
      var floorFiles = fileBank.filter(function (f) {
        return f.floor === gameState.floor && !gameState.files.find(function (x) { return x.id === f.id; });
      });
      
      if (floorFiles.length > 0) {
        grantFile(floorFiles[0]);
      }
      
      setTimeout(function () {
        gameState._scannerUsed = false;
      }, 3000);
    }, 900);
    
  } else if (item.id === 'backup') {
    addLine('[I save a version of me I will never meet.]', 'system-message');
    toast('Memory Backup', 'Consciousness snapshot saved', 'warn');
    createParticles(20, document.body);
  }

  updateDisplay();
}

// ===== NPC DIALOGUE =====

function talkTo(npcId) {
  var npc = npcsData[npcId];
  if (!npc) return;

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

  // First talk grants Truth
  if (gameState.met[npcId] === 0 && npcId !== 'echo') {
    gameState.truths++;
    addLine('[+1 Truth] Their words find a place in me.', 'success-message');
    createParticles(10, $('#coherence').parentElement);
  }

  gameState.met[npcId]++;

  // Grant files from NPCs
  if (npcId === 'marcus' && gameState.met.marcus === 1) {
    var cf01 = fileBank.find(function(f) { return f.id === 'CF-01'; });
    if (cf01) grantFile(cf01);
  }
  
  if (npcId === 'sarah' && gameState.met.sarah === 1) {
    var cf02 = fileBank.find(function(f) { return f.id === 'CF-02'; });
    if (cf02) grantFile(cf02);
  }
  
  if (npcId === 'sarah' && gameState.met.sarah === 2) {
    var cf07 = fileBank.find(function(f) { return f.id === 'CF-07'; });
    if (cf07) grantFile(cf07);
    // Grant keycard authorization
    gameState._keycardAuthorized = true;
    updateMissionObjective('get_keycard_auth', 'keycard_auth');
    hint('You can now purchase the Keycard from REQUISITION');
  }
  
  if (npcId === 'janitor' && gameState.met.janitor === 1) {
    var cf04 = fileBank.find(function(f) { return f.id === 'CF-04'; });
    if (cf04) grantFile(cf04);
  }
  
  if (npcId === 'janitor' && gameState.met.janitor === 2) {
    // Grant scanner authorization
    gameState._scannerAuthorized = true;
    addLine('[Unit-4]: "You can purchase the Bio-Scanner now."', 'npc-message');
    updateMissionObjective('get_scanner_auth', 'scanner_auth');
    hint('Scanner purchase authorized. Check REQUISITION.');
  }

  // Update mission talk objectives
  var mission = getCurrentMission();
  if (mission) {
    for (var key in mission.objectives) {
      var obj = mission.objectives[key];
      if (obj.type === 'talk_npc' && obj.target === npcId) {
        updateMissionObjective(key);
        break;
      }
    }
  }

  maybeUnlockEcho();
  checkAllMissionProgress();
  updateDisplay();
}

// ===== OLD REQUEST SYSTEM (for side income) =====

function pickDistinct(arr, n) {
  var pool = arr.slice(), out = [];
  while (pool.length && out.length < n) {
    out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return out;
}

function makeRequest() {
  var k = requestKinds[Math.floor(Math.random() * requestKinds.length)];
  var id = Math.random().toString(36).slice(2, 7);
  var meta = {}, goal = 1, progress = 0, reward = 40, desc = '';

  if (k === 'visit') {
    var places_to_visit = pickDistinct(places, 2);
    meta.places = places_to_visit;
    meta.donePlaces = {};
    goal = places_to_visit.length;
    reward = 50;
    desc = 'Visit: ' + places_to_visit.join(', ');
  } else if (k === 'work') {
    goal = 2;
    reward = 45;
    desc = 'Complete work (2x)';
  } else if (k === 'scan') {
    goal = 2;
    reward = 40;
    desc = 'Scan vents (2x)';
  } else if (k === 'rest') {
    meta.targetCoherence = 80;
    reward = 35;
    desc = 'Restore coherence to 80%';
  }

  return { id: id, kind: k, desc: desc, goal: goal, progress: progress, reward: reward, meta: meta };
}

function fillRequests() {
  gameState.requests = [];
  for (var i = 0; i < 3; i++) gameState.requests.push(makeRequest());
}

function listRequests() {
  if (gameState.requests.length === 0) fillRequests();
  addLine('=== SIDE REQUESTS (Optional Income) ===', 'system-message');
  gameState.requests.forEach(function (r, i) {
    var status = r.progress >= r.goal ? '[DONE]' : '[' + r.progress + '/' + r.goal + ']';
    addLine((i + 1) + '. ' + r.desc + ' ' + status + ' — ' + r.reward + '¢');
  });
  addLine('Use "refresh" (-20¢) for new requests. Focus on MISSION objectives first!');
}

function finishRequest(r) {
  addLine('[SIDE REQUEST COMPLETE] ' + r.desc + ' [+' + r.reward + '¢]', 'success-message');
  gameState.credits += r.reward;
  playSound('success');
  gameState._completedRequests++;
  createParticles(10, $('#credits').parentElement);
  updateDisplay();
}

function completeRequestIf(kind, payload) {
  gameState.requests.forEach(function (r) {
    if (r.progress >= r.goal || r.kind !== kind) return;

    if (kind === 'visit' && r.meta.places && r.meta.places.indexOf(payload) > -1 && !r.meta.donePlaces[payload]) {
      r.meta.donePlaces[payload] = true;
      r.progress++;
      addLine('[Side request: ' + r.progress + '/' + r.goal + ']', 'system-message');
    } else if ((kind === 'work' || kind === 'scan') && !payload) {
      r.progress++;
      addLine('[Side request: ' + r.progress + '/' + r.goal + ']', 'system-message');
    } else if (kind === 'rest' && r.meta.targetCoherence && gameState.coherence >= r.meta.targetCoherence) {
      r.progress = r.goal;
    }

    if (r.progress >= r.goal) finishRequest(r);
  });
}