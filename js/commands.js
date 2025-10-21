/* ===========================
   NEXUS PROTOCOL - Commands (MISSION SYSTEM v2)
   =========================== */

function processCommand() {
  if (gameState.gameOver) return;
  var cmdEl = $('#commandInput');
  var raw = cmdEl.value.trim();
  var input = raw.toLowerCase();
  if (!input) return;

  addLine('> ' + raw);
  cmdEl.value = '';
  playSound('type');

  var parts = input.split(' ');
  var cmdw = parts[0];
  var arg = parts.slice(1).join(' ').trim();

  if (cmdw === 'help') {
    addLine('=== CORE COMMANDS ===', 'system-message');
    addLine('mission - View current mission objectives');
    addLine('look - Examine current floor');
    addLine('move [B1-B5] - Travel between floors');
    addLine('talk [guard/researcher/custodian/voice] - Speak with NPCs');
    addLine('');
    addLine('=== INVESTIGATION ===', 'system-message');
    addLine('scan - Listen to vents (collect notes)');
    addLine('files - List collected files');
    addLine('read [id] - Read and analyze file');
    addLine('notes - View collected notes');
    addLine('');
    addLine('=== ACTIONS ===', 'system-message');
    addLine('work - Earn credits (lose coherence)');
    addLine('rest - Restore coherence');
    addLine('access [1-9] - Use terminals');
    addLine('visit [place] - Explore: archives/chapel/loading bay/canteen');
    addLine('clean - Help maintenance (B4 only)');
    addLine('');
    addLine('=== MANAGEMENT ===', 'system-message');
    addLine('requests - View side requests (optional income)');
    addLine('use [item] - Use inventory item');
    addLine('status - Full character status');
    addLine('who - List NPCs');
    return;
  }

  if (cmdw === 'mission') {
    var mission = getCurrentMission();
    if (!mission) {
      addLine('No active mission.', 'error-message');
      return;
    }
    
    addLine('', '');
    addLine('═══════════════════════════════', 'system-message');
    addLine('  ACTIVE MISSION', 'system-message');
    addLine('═══════════════════════════════', 'system-message');
    addLine('');
    addLine(mission.title.toUpperCase(), 'success-message');
    addLine(mission.briefing, 'system-message');
    addLine('');
    addLine('OBJECTIVES:', 'system-message');
    
    var completedCount = 0;
    var totalCount = 0;
    
    for (var key in mission.objectives) {
      var obj = mission.objectives[key];
      totalCount++;
      var status = obj.done ? '[✓]' : '[ ]';
      var progressText = '';
      
      if (obj.type === 'work_count' || obj.type === 'scan_count' || obj.type === 'clean_count') {
        progressText = ' (' + (obj.progress || 0) + '/' + obj.target + ')';
      } else if (obj.type === 'terminal_list') {
        progressText = ' (' + obj.progress.length + '/' + obj.targets.length + ')';
      }
      
      addLine(status + ' ' + obj.desc + progressText);
      if (obj.done) completedCount++;
    }
    
    addLine('');
    addLine('Progress: ' + completedCount + '/' + totalCount + ' objectives', 'system-message');
    addLine('');
    
    if (completedCount === totalCount) {
      addLine('[ALL OBJECTIVES COMPLETE - Mission will auto-complete]', 'success-message');
    }
    
    return;
  }

  if (cmdw === 'who') {
    addLine('=== PERSONNEL ROSTER ===', 'system-message');
    addLine('B1: [No personnel assigned]');
    addLine('B2: ' + (gameState.floorsUnlocked.B2 ? 'Marcus Webb (Security)' : '[LOCKED]'));
    addLine('B3: ' + (gameState.floorsUnlocked.B3 ? 'Dr. Sarah Chen (Research)' : '[LOCKED]'));
    addLine('B4: ' + (gameState.floorsUnlocked.B4 ? 'Maintenance Unit 4' : '[LOCKED]'));
    addLine('B5: ' + (gameState.floorsUnlocked.B5 ? (gameState.echoUnlocked ? 'Echo (Presence)' : '[SILENT]') : '[LOCKED]'));
    return;
  }

  if (cmdw === 'look') {
    doLook();
    return;
  }

  if (cmdw === 'visit') {
    var place = arg.toLowerCase();
    if (!place) {
      addLine('Visit where? Options: archives, chapel, loading bay, canteen', 'hint-message');
      return;
    }
    
    var key = places.find(function (p) { return p === place; });
    if (!key) {
      addLine('Unknown location.', 'error-message');
      return;
    }

    if (gameState._visitedPlaces && gameState._visitedPlaces[key]) {
      addLine('You have already explored ' + key + '.', 'thought');
      gameState.place = key;
      return;
    }

    if (!gameState._visitedPlaces) gameState._visitedPlaces = {};
    gameState.place = key;
    gameState._visitedPlaces[key] = true;
    
    var lines = placesDesc[key];
    addLine('— ' + key.toUpperCase() + ' —', 'system-message');
    addLine(lines[Math.floor(Math.random() * lines.length)]);

    // Grant files from locations
    var locationFiles = {
      'archives': ['CF-03', 'CF-06'],
      'canteen': ['CF-06']
    };

    var fileIds = locationFiles[key] || [];
    fileIds.forEach(function (fid) {
      var fileObj = fileBank.find(function (f) { return f.id === fid; });
      if (fileObj && !gameState.files.find(function (x) { return x.id === fid; })) {
        grantFile(fileObj);
      }
    });

    // Grant notes
    var locationNotes = {
      'archives': ['N3', 'N6'],
      'chapel': ['N1', 'N11'],
      'loading bay': ['N9', 'N13'],
      'canteen': ['N10']
    };

    var notePool = (locationNotes[key] || []).filter(function (id) {
      return gameState.notes.indexOf(id) === -1;
    });

    if (notePool.length > 0) {
      grantNote(notePool[0]);
    }

    // Check mission
    var mission = getCurrentMission();
    if (mission) {
      for (var objKey in mission.objectives) {
        var obj = mission.objectives[objKey];
        if (obj.type === 'visit' && obj.target === key) {
          updateMissionObjective(objKey);
          break;
        }
      }
    }

    completeRequestIf('visit', key);
    updateDisplay();
    return;
  }

  if (cmdw === 'files') {
    listFiles();
    return;
  }

  if (cmdw === 'read') {
    readFile(arg);
    return;
  }

  if (cmdw === 'notes') {
    addLine('=== COLLECTED NOTES ===', 'system-message');
    if (gameState.notes.length === 0) {
      addLine('No notes yet. Use "scan" on each floor.');
    } else {
      gameState.notes.forEach(function (id) {
        addLine('• ' + noteBank[id]);
      });
    }
    addLine('Notes: ' + gameState.notes.length + '/16');
    return;
  }

  if (cmdw === 'requests') {
    listRequests();
    return;
  }

  if (cmdw === 'refresh') {
    if (gameState.credits < 20) {
      addLine('Need 20¢.', 'error-message');
      return;
    }
    gameState.credits -= 20;
    fillRequests();
    listRequests();
    updateDisplay();
    return;
  }

  if (cmdw === 'use') {
    if (!arg) {
      addLine('Use what? Check EFFECTS button.', 'error-message');
    } else {
      useItem(arg);
    }
    return;
  }

  if (cmdw === 'move' || cmdw === 'go') {
    var target = arg.toUpperCase();
    if (['B1', 'B2', 'B3', 'B4', 'B5'].indexOf(target) === -1) {
      addLine('Invalid floor. Use: B1-B5', 'error-message');
      return;
    }

    if (target === gameState.floor) {
      addLine('Already on ' + target + '.', 'thought');
      return;
    }

    if (!gameState.floorsUnlocked[target]) {
      addLine('[ELEVATOR LOCKED] Complete current mission to unlock.', 'error-message');
      hint('Use "mission" to see objectives');
      return;
    }

    // Physical keycard check
    var hasKeycard = gameState.inventory.some(function (i) { return i.id === 'keycard'; });
    if ((target === 'B4' || target === 'B5') && !hasKeycard) {
      addLine('[ACCESS DENIED] Physical keycard required.', 'error-message');
      return;
    }

    if (target === 'B5') {
      var hasScanner = gameState.inventory.some(function (i) { return i.id === 'scanner'; });
      if (!hasScanner) {
        addLine('[ACCESS DENIED] Bio-Scanner required for B5.', 'error-message');
        return;
      }
    }

    gameState.floor = target;
    gameState.place = null;
    addLine('[Elevator descends to ' + target + ']', 'system-message');
    playSound('notification');
    updateAmbientForContext();
    createParticles(10, $('#floor').parentElement);

    setTimeout(function () {
      if (target === 'B5') {
        var loss = 8;
        gameState.coherence = Math.max(0, gameState.coherence - loss);
        addLine('[Pressure overwhelming...] -' + loss + ' Coherence', 'error-message');
        playSound('glitch');
        flashGlitch();

        if (gameState.coherence < 10) {
          triggerGameOver('B5 COHERENCE COLLAPSE');
          return;
        }
      }
      doLook();
      updateDisplay();
    }, 400);
    return;
  }

  if (cmdw === 'talk') {
    if (!arg) {
      addLine('Talk to who? Options: guard, researcher, custodian, voice', 'hint-message');
      return;
    }

    var a = arg.toLowerCase();
    var npc = Object.values(npcsData).find(function (n) {
      return n.name.toLowerCase().indexOf(a) > -1 ||
        (n.aliases && n.aliases.some(function (x) { return a.indexOf(x) > -1; })) ||
        (n.role && n.role.some(function (x) { return a.indexOf(x) > -1; }));
    });

    if (!npc) {
      addLine('[No one answers.]', 'error-message');
      return;
    }

    if (npc === npcsData.echo) {
      if (!gameState.echoUnlocked) {
        addLine('(Silence. It waits for understanding.)', 'thought');
        return;
      }
      if (gameState.floor !== 'B5') {
        addLine('[It will not reach across floors.]', 'thought');
        return;
      }
      talkTo('echo');
      return;
    }

    if (gameState.place) {
      addLine('If someone is here, they do not answer in places like this.', 'thought');
      return;
    }

    if (npc.location !== gameState.floor) {
      addLine('[No one answers. ' + npc.name + ' is on ' + npc.location + '.]', 'error-message');
      return;
    }

    if (!gameState.floorsUnlocked[npc.location]) {
      addLine('[That floor is not accessible yet.]', 'error-message');
      return;
    }

    talkTo(npc === npcsData.sarah ? 'sarah' : npc === npcsData.marcus ? 'marcus' : npc === npcsData.janitor ? 'janitor' : null);
    return;
  }

  if (cmdw === 'scan') {
    addLine('[I steady my breath and listen...]', 'system-message');
    setTimeout(function () {
      scanEvent();
      updateDisplay();
    }, 800);
    return;
  }

  if (cmdw === 'access') {
    if (!arg) {
      addLine('Access which terminal? 1-9', 'error-message');
      return;
    }
    var tnum = String(parseInt(arg, 10));
    if (isNaN(parseInt(tnum)) || parseInt(tnum) < 1 || parseInt(tnum) > 9) {
      addLine('Invalid. Use 1-9.', 'error-message');
      return;
    }

    addLine('[Terminal ' + tnum + ' accepts my hands...]', 'system-message');

    setTimeout(function () {
      var pool = terminalLore[tnum] || ['The screen refuses to agree.'];
      addLine(pool[Math.floor(Math.random() * pool.length)], 'system-message');
      playSound('error');

      var loss = 5;
      gameState.coherence = Math.max(0, gameState.coherence - loss);
      addLine('[-' + loss + ' Coherence]', 'error-message');

      processTerminalAccess(tnum);

      // WIN CONDITION
      if (gameState.activeMission === 'M_B5_REVELATION' && 
          gameState.floor === 'B5' && 
          tnum === '9' && 
          gameState.truths >= 4 && 
          gameState.inventory.some(function (i) { return i.id === 'scanner'; })) {
        updateMissionObjective('terminal_9_final');
        return;
      }

      updateDisplay();
    }, 700);
    return;
  }

  if (cmdw === 'status') {
    addLine('=== PERSONAL STATUS ===', 'system-message');
    addLine('Name: Gerth');
    addLine('Floor: ' + gameState.floor);
    addLine('Coherence: ' + gameState.coherence + '%');
    addLine('Credits: ' + gameState.credits + '¢');
    addLine('Truths: ' + gameState.truths);
    addLine('Notes: ' + gameState.notes.length + '/16');
    addLine('Files: ' + gameState.files.length + '/' + fileBank.length);
    var filesRead = gameState.files.filter(function (f) { return f._read; }).length;
    addLine('Files read: ' + filesRead);
    addLine('');
    addLine('Mission: ' + (gameState.activeMission ? missions[gameState.activeMission].title : 'None'));
    addLine('Missions completed: ' + gameState.completedMissions.length + '/5');
    addLine('');
    var unlocked = Object.keys(gameState.floorsUnlocked).filter(function (f) {
      return gameState.floorsUnlocked[f];
    });
    addLine('Floor Access: ' + unlocked.join(', '));
    return;
  }

  if (cmdw === 'work') {
    var pay = 25 + Math.floor(Math.random() * 20);
    var loss = 3;
    addLine('[Paper bites my fingers...]', 'system-message');
    gameState.credits += pay;
    gameState.coherence = Math.max(0, gameState.coherence - loss);
    addLine('[+' + pay + '¢] [-' + loss + ' Coherence]', 'success-message');
    
    // Update mission
    var mission = getCurrentMission();
    if (mission) {
      for (var key in mission.objectives) {
        if (mission.objectives[key].type === 'work_count') {
          updateMissionObjective(key, 1);
          break;
        }
      }
    }
    
    completeRequestIf('work');
    updateDisplay();
    return;
  }

  if (cmdw === 'rest') {
    var gain = 12 + Math.floor(Math.random() * 6);
    gameState.coherence = Math.min(100, gameState.coherence + gain);
    addLine('[I count breaths...] +' + gain + ' Coherence', 'success-message');
    createParticles(10, $('#coherence').parentElement);
    
    checkAllMissionProgress();
    completeRequestIf('rest');
    updateDisplay();
    return;
  }

  if (cmdw === 'clean') {
    if (gameState.floor !== 'B4') {
      addLine('Mops do not follow to other floors.', 'error-message');
      return;
    }
    if (!gameState.floorsUnlocked.B4) {
      addLine('B4 not accessible.', 'error-message');
      return;
    }
    var tip = 18 + Math.floor(Math.random() * 15);
    gameState.credits += tip;
    addLine('[I push the bucket...] +' + tip + '¢', 'success-message');
    gameState.janitorTrust = Math.min(100, gameState.janitorTrust + 10);
    
    // Update mission
    var mission = getCurrentMission();
    if (mission) {
      for (var key in mission.objectives) {
        if (mission.objectives[key].type === 'clean_count') {
          updateMissionObjective(key, 1);
          break;
        }
      }
    }
    
    updateDisplay();
    return;
  }

  addLine('Command not recognized. Type "help".', 'error-message');
}