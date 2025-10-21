/* ===========================
   NEXUS PROTOCOL - Commands (INVESTIGATIVE SYSTEM)
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
    addLine('look - Examine current floor');
    addLine('move [B1-B5] - Travel between floors');
    addLine('talk [guard/researcher/custodian/voice] - Speak with NPCs');
    addLine('');
    addLine('=== INVESTIGATION ===', 'system-message');
    addLine('scan - Listen to vents (find notes by floor)');
    addLine('files - List collected files');
    addLine('read [id] - Read and analyze a file (REQUIRED for unlocks)');
    addLine('notes - View collected notes');
    addLine('progress - Show detailed unlock requirements');
    addLine('');
    addLine('=== ACTIONS ===', 'system-message');
    addLine('work - Earn credits (lose coherence)');
    addLine('rest - Restore coherence (REQUIRED for unlocks)');
    addLine('access [1-9] - Use terminals (pattern: 7→3→9)');
    addLine('visit [place] - Explore: archives/chapel/loading bay/canteen');
    addLine('clean - Help maintenance (B4 only)');
    addLine('');
    addLine('=== MANAGEMENT ===', 'system-message');
    addLine('requests - View active tasks');
    addLine('accept [1-3] - Focus on a request');
    addLine('refresh - Get new requests (-20¢)');
    addLine('use [item] - Use inventory item');
    addLine('');
    addLine('=== INFO ===', 'system-message');
    addLine('status - Full character status');
    addLine('who - List NPCs by floor');
    addLine('achievements - View progress');
    return;
  }

  if (cmdw === 'progress') {
    addLine('=== INVESTIGATIVE PROGRESSION ===', 'system-message');
    addLine('');
    
    // B1 (always unlocked)
    addLine('█ B1 (Admin): [UNLOCKED] Starting floor');
    addLine('');
    
    // B2 Requirements
    var b2Reqs = gameState._completedRequests + '/3 requests, ' + 
                 gameState.coherence + '/60 coherence, ' +
                 gameState.notes.length + '/2 notes';
    var b2File = gameState.files.some(function (f) { 
      return (f.id === 'CF-03' || f.id === 'CF-06') && f._read; 
    });
    b2Reqs += ', ' + (b2File ? '✓' : '○') + ' file read';
    
    addLine('█ B2 (Security): ' + (gameState.floorsUnlocked.B2 ? '[UNLOCKED]' : '[LOCKED]'));
    addLine('  Requirements:');
    addLine('    • Complete 3 requests: ' + gameState._completedRequests + '/3');
    addLine('    • Coherence ≥ 60%: ' + gameState.coherence + '%');
    addLine('    • Collect 2 notes: ' + gameState.notes.length + '/2');
    addLine('    • Read CF-03 or CF-06: ' + (b2File ? '✓' : '○ (visit archives/canteen)'));
    addLine('');
    
    // B3 Requirements
    if (gameState.floorsUnlocked.B2 || gameState._completedRequests >= 3) {
      var b3File = gameState.files.some(function (f) { return f.id === 'CF-01' && f._read; });
      addLine('█ B3 (Research): ' + (gameState.floorsUnlocked.B3 ? '[UNLOCKED]' : '[LOCKED]'));
      addLine('  Requirements:');
      addLine('    • B2 unlocked: ' + (gameState.floorsUnlocked.B2 ? '✓' : '○'));
      addLine('    • Complete 5 total requests: ' + gameState._completedRequests + '/5');
      addLine('    • Talk to Marcus: ' + (gameState.met.marcus > 0 ? '✓' : '○ (move b2, talk guard)'));
      addLine('    • Coherence ≥ 50%: ' + gameState.coherence + '%');
      addLine('    • Collect 4 notes: ' + gameState.notes.length + '/4');
      addLine('    • Read CF-01: ' + (b3File ? '✓' : '○ (from Marcus)'));
      addLine('');
    }
    
    // B4 Requirements
    if (gameState.floorsUnlocked.B3 || gameState._completedRequests >= 5) {
      var b4File1 = gameState.files.some(function (f) { return f.id === 'CF-02' && f._read; });
      var b4File2 = gameState.files.some(function (f) { return f.id === 'CF-07' && f._read; });
      var hasKeycard = gameState.inventory.some(function (i) { return i.id === 'keycard'; });
      addLine('█ B4 (Maintenance): ' + (gameState.floorsUnlocked.B4 ? '[UNLOCKED]' : '[LOCKED]'));
      addLine('  Requirements:');
      addLine('    • B3 unlocked: ' + (gameState.floorsUnlocked.B3 ? '✓' : '○'));
      addLine('    • Complete 8 total requests: ' + gameState._completedRequests + '/8');
      addLine('    • Talk to Sarah: ' + (gameState.met.sarah > 0 ? '✓' : '○ (move b3, talk researcher)'));
      addLine('    • Purchase Keycard (120¢): ' + (hasKeycard ? '✓' : '○'));
      addLine('    • Collect 7 notes: ' + gameState.notes.length + '/7');
      addLine('    • Gain 2 Truths: ' + gameState.truths + '/2');
      addLine('    • Read CF-02: ' + (b4File1 ? '✓' : '○ (from Sarah)'));
      addLine('    • Read CF-07: ' + (b4File2 ? '✓' : '○ (from Sarah)'));
      addLine('');
    }
    
    // B5 Requirements
    if (gameState.floorsUnlocked.B4 || gameState._completedRequests >= 8) {
      var b5File = gameState.files.some(function (f) { return f.id === 'CF-04' && f._read; });
      var hasScanner = gameState.inventory.some(function (i) { return i.id === 'scanner'; });
      var patternDone = gameState.dataChain && gameState.dataChain.done;
      addLine('█ B5 (Depths): ' + (gameState.floorsUnlocked.B5 ? '[UNLOCKED]' : '[LOCKED]'));
      addLine('  Requirements:');
      addLine('    • B4 unlocked: ' + (gameState.floorsUnlocked.B4 ? '✓' : '○'));
      addLine('    • Complete 12 total requests: ' + gameState._completedRequests + '/12');
      addLine('    • Talk to Janitor: ' + (gameState.met.janitor > 0 ? '✓' : '○ (move b4, talk custodian)'));
      addLine('    • Purchase Scanner (150¢): ' + (hasScanner ? '✓' : '○'));
      addLine('    • Complete Pattern (7→3→9): ' + (patternDone ? '✓' : '○'));
      addLine('    • Coherence ≥ 40%: ' + gameState.coherence + '%');
      addLine('    • Collect 10 notes: ' + gameState.notes.length + '/10');
      addLine('    • Gain 3 Truths: ' + gameState.truths + '/3');
      addLine('    • Read CF-04: ' + (b5File ? '✓' : '○ (from Janitor)'));
      addLine('');
    }
    
    addLine('=== VICTORY CONDITION ===', 'system-message');
    addLine('Access terminal 9 on B5 with Scanner + 4 Truths');
    addLine('');
    addLine('💡 Tip: Use "scan" on each floor to collect notes');
    addLine('💡 Tip: Always "read" files after collecting them');
    addLine('💡 Tip: Use "rest" frequently to maintain coherence');
    return;
  }

  if (cmdw === 'achievements') {
    addLine('=== RECOGNITIONS ===', 'system-message');
    achRules.forEach(function (r) {
      addLine((gameState.achievements[r.id] ? '[◆] ' : '[ ] ') + r.name);
    });
    return;
  }

  if (cmdw === 'who') {
    addLine('=== PERSONNEL ROSTER ===', 'system-message');
    addLine('B1: [No personnel assigned]');
    addLine('B2: ' + (gameState.floorsUnlocked.B2 ? 'Marcus Webb (Security) - ' + gameState.met.marcus + '/3 talks' : '[LOCKED]'));
    addLine('B3: ' + (gameState.floorsUnlocked.B3 ? 'Dr. Sarah Chen (Research) - ' + gameState.met.sarah + '/3 talks' : '[LOCKED]'));
    addLine('B4: ' + (gameState.floorsUnlocked.B4 ? 'Maintenance Unit 4 (Custodian) - ' + gameState.met.janitor + '/3 talks' : '[LOCKED]'));
    addLine('B5: ' + (gameState.floorsUnlocked.B5 ? (gameState.echoUnlocked ? 'Echo (Presence) - ' + gameState.met.echo + '/3 talks' : '[SILENT - Complete requirements]') : '[LOCKED]'));
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
      addLine('Unknown location. Options: archives, chapel, loading bay, canteen', 'error-message');
      return;
    }

    if (gameState._visitedPlaces[key]) {
      addLine('You have already explored ' + key + ' thoroughly.', 'thought');
      gameState.place = key;
      return;
    }

    gameState.place = key;
    gameState._visitedPlaces[key] = true;
    var lines = placesDesc[key];
    addLine('— ' + key.toUpperCase() + ' —', 'system-message');
    addLine(lines[Math.floor(Math.random() * lines.length)]);

    // Deterministic file drops by location
    var locationFiles = {
      'archives': ['CF-03', 'CF-06'],
      'chapel': [],
      'loading bay': [],
      'canteen': ['CF-06']
    };

    var fileIds = locationFiles[key] || [];
    fileIds.forEach(function (fid) {
      var fileObj = fileBank.find(function (f) { return f.id === fid; });
      if (fileObj && !gameState.files.find(function (x) { return x.id === fid; })) {
        grantFile(fileObj);
      }
    });

    // Notes from locations
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
      addLine('No notes yet. Use "scan" to find them on each floor.');
    } else {
      gameState.notes.forEach(function (id) {
        addLine('• ' + noteBank[id]);
      });
    }
    addLine('Notes collected: ' + gameState.notes.length + '/16');
    return;
  }

  if (cmdw === 'requests') {
    listRequests();
    return;
  }

  if (cmdw === 'accept') {
    var n = parseInt(arg, 10) - 1;
    if (isNaN(n) || n < 0 || n >= gameState.requests.length) {
      addLine('Which one? Use: accept 1, accept 2, or accept 3', 'error-message');
      return;
    }
    addLine('[FOCUSED] ' + gameState.requests[n].desc, 'success-message');
    return;
  }

  if (cmdw === 'refresh') {
    if (gameState.credits < 20) {
      addLine('You need 20¢ for that.', 'error-message');
      return;
    }
    gameState.credits -= 20;
    fillRequests();
    addLine('[Seeking alternative directives...]', 'thought');
    listRequests();
    updateDisplay();
    return;
  }

  if (cmdw === 'use') {
    if (!arg) {
      addLine('Use what? Check inventory with EFFECTS button.', 'error-message');
    } else {
      useItem(arg);
    }
    return;
  }

  if (cmdw === 'move' || cmdw === 'go') {
    var target = arg.toUpperCase();
    if (['B1', 'B2', 'B3', 'B4', 'B5'].indexOf(target) === -1) {
      addLine('Invalid floor. Use: B1, B2, B3, B4, or B5', 'error-message');
      return;
    }

    if (target === gameState.floor) {
      addLine('You are already on ' + target + '.', 'thought');
      return;
    }

    // Check unlock with detailed feedback
    if (!gameState.floorsUnlocked[target]) {
      if (target === 'B2') {
        addLine('[ELEVATOR HESITATES] Investigation incomplete.', 'error-message');
        var hasFile = gameState.files.some(function (f) { 
          return (f.id === 'CF-03' || f.id === 'CF-06') && f._read; 
        });
        if (gameState._completedRequests < 3) hint('Complete ' + (3 - gameState._completedRequests) + ' more requests.');
        if (gameState.coherence < 60) hint('Coherence too low. Rest to ≥ 60% (currently ' + gameState.coherence + '%)');
        if (gameState.notes.length < 2) hint('Need ' + (2 - gameState.notes.length) + ' more notes. Use "scan" command.');
        if (!hasFile) hint('Read CF-03 or CF-06. Visit archives or canteen to find files.');
        hint('Use "progress" to see all requirements.');
        return;
      }
      if (target === 'B3') {
        addLine('[ELEVATOR HESITATES] Research clearance requires investigation.', 'error-message');
        if (!gameState.floorsUnlocked.B2) hint('Unlock B2 first.');
        if (gameState._completedRequests < 5) hint('Complete ' + (5 - gameState._completedRequests) + ' more requests.');
        if (gameState.met.marcus === 0) hint('Talk to Marcus Webb on B2.');
        if (gameState.coherence < 50) hint('Coherence too low. Rest to ≥ 50%.');
        if (gameState.notes.length < 4) hint('Need ' + (4 - gameState.notes.length) + ' more notes.');
        var hasCF01 = gameState.files.some(function (f) { return f.id === 'CF-01' && f._read; });
        if (!hasCF01) hint('Read CF-01 (from Marcus on B2).');
        hint('Use "progress" for details.');
        return;
      }
      if (target === 'B4') {
        addLine('[ELEVATOR HESITATES] Maintenance clearance requires thorough investigation.', 'error-message');
        if (!gameState.floorsUnlocked.B3) hint('Unlock B3 first.');
        if (gameState._completedRequests < 8) hint('Complete ' + (8 - gameState._completedRequests) + ' more requests.');
        if (gameState.met.sarah === 0) hint('Talk to Dr. Sarah Chen on B3.');
        var hasKeycard = gameState.inventory.some(function (i) { return i.id === 'keycard'; });
        if (!hasKeycard) hint('Purchase Keycard (120¢) from REQUISITION.');
        if (gameState.notes.length < 7) hint('Need ' + (7 - gameState.notes.length) + ' more notes.');
        if (gameState.truths < 2) hint('Need ' + (2 - gameState.truths) + ' more Truths.');
        var hasCF02 = gameState.files.some(function (f) { return f.id === 'CF-02' && f._read; });
        var hasCF07 = gameState.files.some(function (f) { return f.id === 'CF-07' && f._read; });
        if (!hasCF02) hint('Read CF-02 (from Sarah).');
        if (!hasCF07) hint('Read CF-07 (from Sarah).');
        hint('Use "progress" for all requirements.');
        return;
      }
      if (target === 'B5') {
        addLine('[ELEVATOR HESITATES] Maximum clearance requires complete investigation.', 'error-message');
        if (!gameState.floorsUnlocked.B4) hint('Unlock B4 first.');
        if (gameState._completedRequests < 12) hint('Complete ' + (12 - gameState._completedRequests) + ' more requests.');
        if (gameState.met.janitor === 0) hint('Talk to Maintenance Unit 4 on B4.');
        var hasScanner = gameState.inventory.some(function (i) { return i.id === 'scanner'; });
        if (!hasScanner) hint('Purchase Bio-Scanner (150¢).');
        var patternDone = gameState.dataChain && gameState.dataChain.done;
        if (!patternDone) hint('Complete terminal pattern: access 7, 3, 9.');
        if (gameState.coherence < 40) hint('Coherence too low. Rest to ≥ 40%.');
        if (gameState.notes.length < 10) hint('Need ' + (10 - gameState.notes.length) + ' more notes.');
        if (gameState.truths < 3) hint('Need ' + (3 - gameState.truths) + ' more Truths.');
        var hasCF04 = gameState.files.some(function (f) { return f.id === 'CF-04' && f._read; });
        if (!hasCF04) hint('Read CF-04 (from Janitor).');
        hint('Use "progress" for complete checklist.');
        return;
      }
    }

    // Physical keycard check for B4/B5
    var hasKeycard = gameState.inventory.some(function (i) { return i.id === 'keycard'; });
    if ((target === 'B4' || target === 'B5') && !hasKeycard) {
      addLine('[ACCESS DENIED] Physical keycard required.', 'error-message');
      hint('Purchase Access Keycard from REQUISITION for 120¢');
      return;
    }

    if (target === 'B5') {
      var hasScanner = gameState.inventory.some(function (i) { return i.id === 'scanner'; });
      if (!hasScanner) {
        addLine('[ACCESS DENIED] Bio-Scanner required for B5.', 'error-message');
        hint('Purchase Bio-Scanner from REQUISITION for 150¢');
        return;
      }
    }

    // Move successful
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
        addLine('[The pressure is overwhelming...] -' + loss + ' Coherence', 'error-message');
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
      addLine('Talk to who?', 'hint-message');
      addLine('Options: guard, researcher, custodian, voice', 'hint-message');
      return;
    }

    var a = arg.toLowerCase();
    var npc = Object.values(npcsData).find(function (n) {
      return n.name.toLowerCase().indexOf(a) > -1 ||
        (n.aliases && n.aliases.some(function (x) { return a.indexOf(x) > -1; })) ||
        (n.role && n.role.some(function (x) { return a.indexOf(x) > -1; }));
    });

    if (!npc) {
      addLine('[No one answers to that name.]', 'error-message');
      return;
    }

    // Echo special case
    if (npc === npcsData.echo) {
      if (!gameState.echoUnlocked) {
        addLine('(Silence. It is waiting for understanding, not insistence.)', 'thought');
        hint('Echo requires: B5 unlocked + all NPCs contacted + Pattern complete + 4 Truths');
        return;
      }
      if (gameState.floor !== 'B5') {
        addLine('[It will not reach across floors.]', 'thought');
        return;
      }
      talkTo('echo');
      return;
    }

    // Regular NPC
    if (gameState.place) {
      addLine('If someone is here, they do not answer me in places like this.', 'thought');
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
      addLine('Access which terminal? Specify 1-9.', 'error-message');
      return;
    }
    var tnum = String(parseInt(arg, 10));
    if (isNaN(parseInt(tnum)) || parseInt(tnum) < 1 || parseInt(tnum) > 9) {
      addLine('Invalid terminal number. Use 1-9.', 'error-message');
      return;
    }

    addLine('[Terminal ' + tnum + ' accepts my hands...]', 'system-message');

    setTimeout(function () {
      var pool = terminalLore[tnum] || ['The screen refuses to agree with itself.'];
      addLine(pool[Math.floor(Math.random() * pool.length)], 'system-message');
      playSound('error');

      var loss = 5;
      gameState.coherence = Math.max(0, gameState.coherence - loss);
      addLine('[-' + loss + ' Coherence]', 'error-message');

      processTerminalAccess(tnum);
      completeRequestIf('terminals', tnum);

      // WIN CONDITION
      if (gameState.floorsUnlocked.B5 && 
          gameState.floor === 'B5' && 
          tnum === '9' && 
          gameState.truths >= 4 && 
          gameState.inventory.some(function (i) { return i.id === 'scanner'; })) {
        triggerWin();
        return;
      }

      updateDisplay();
    }, 700);
    return;
  }

  if (cmdw === 'status') {
    addLine('=== PERSONAL STATUS ===', 'system-message');
    addLine('Name: Gerth');
    addLine('Floor: ' + gameState.floor + (gameState.place ? ' (' + gameState.place + ')' : ''));
    addLine('Coherence: ' + gameState.coherence + '%');
    addLine('Credits: ' + gameState.credits + '¢');
    addLine('Truths: ' + gameState.truths);
    addLine('Notes: ' + gameState.notes.length + '/16');
    addLine('Files collected: ' + gameState.files.length + '/' + fileBank.length);
    var filesRead = gameState.files.filter(function (f) { return f._read; }).length;
    addLine('Files read: ' + filesRead + '/' + gameState.files.length);
    addLine('Inventory: ' + gameState.inventory.length + ' items');
    gameState.inventory.forEach(function (item) {
      addLine('  • ' + item.name);
    });
    addLine('Completed Requests: ' + gameState._completedRequests);
    var unlocked = Object.keys(gameState.floorsUnlocked).filter(function (f) {
      return gameState.floorsUnlocked[f];
    });
    addLine('Floor Access: ' + unlocked.join(', '));
    if (gameState.dataChain) {
      var pattern = gameState._terminalPattern.length > 0 ? gameState._terminalPattern.join('→') : 'Not started';
      addLine('Pattern Progress: ' + pattern + (gameState.dataChain.done ? ' [COMPLETE]' : ' (need: 7→3→9)'));
    }
    return;
  }

  if (cmdw === 'work') {
    var pay = 25 + Math.floor(Math.random() * 20);
    var loss = 3;
    addLine('[Paper bites my fingers...]', 'system-message');
    gameState.credits += pay;
    gameState.coherence = Math.max(0, gameState.coherence - loss);
    addLine('[+' + pay + '¢] [-' + loss + ' Coherence]', 'success-message');
    completeRequestIf('work');
    updateDisplay();
    return;
  }

  if (cmdw === 'rest') {
    var gain = 12 + Math.floor(Math.random() * 6);
    gameState.coherence = Math.min(100, gameState.coherence + gain);
    addLine('[I count breaths until the walls agree with me] +' + gain + ' Coherence', 'success-message');
    createParticles(10, $('#coherence').parentElement);
    
    gameState.requests.forEach(function (r) {
      if (r.kind === 'rest' && r.meta.targetCoherence && gameState.coherence >= r.meta.targetCoherence) {
        if (r.progress < r.goal) {
          r.progress = r.goal;
          finishRequest(r);
        }
      }
    });
    
    // Check unlocks after resting
    tryUnlockB2();
    tryUnlockB3();
    tryUnlockB5();
    
    updateDisplay();
    return;
  }

  if (cmdw === 'clean') {
    if (gameState.floor !== 'B4') {
      addLine('Mops do not follow me to other floors.', 'error-message');
      return;
    }
    if (!gameState.floorsUnlocked.B4) {
      addLine('Maintenance level is not accessible yet.', 'error-message');
      return;
    }
    var tip = 18 + Math.floor(Math.random() * 15);
    gameState.credits += tip;
    addLine('[I push the bucket until the corridor stops complaining] +' + tip + '¢', 'success-message');
    gameState.janitorTrust = Math.min(100, gameState.janitorTrust + 10);
    completeRequestIf('clean');
    updateDisplay();
    return;
  }

  addLine('Command not recognized. Type "help" for available commands.', 'error-message');
}