/* ===========================
   NEXUS PROTOCOL - Commands
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
    addLine('=== ACTIONS ===', 'system-message');
    addLine('work - Earn credits, lose coherence');
    addLine('rest - Restore coherence');
    addLine('scan - Listen to the vents (may find notes)');
    addLine('access [1-9] - Use terminals (lose coherence, gather data)');
    addLine('visit [archives/chapel/loading bay/canteen] - Explore locations');
    addLine('');
    addLine('=== MANAGEMENT ===', 'system-message');
    addLine('requests - View available tasks');
    addLine('accept [1-3] - Focus on a specific request');
    addLine('refresh - Get new requests (-20¢)');
    addLine('use [item] - Use inventory item');
    addLine('');
    addLine('=== INFO ===', 'system-message');
    addLine('status - Full character status');
    addLine('notes - View collected notes');
    addLine('files - View collected files');
    addLine('read [id] - Read a specific file');
    addLine('map - Show floor access');
    addLine('who - List NPCs by floor');
    addLine('achievements - View progress');
    addLine('legend - Game mechanics explanation');
    return;
  }

  if (cmdw === 'legend') {
    addLine('=== GAME MECHANICS ===', 'system-message');
    addLine('COHERENCE: Your mental clarity. Keep above 0 to survive.');
    addLine('CREDITS: Currency for purchasing items.');
    addLine('TRUTHS: Understanding gained. Unlocks deeper layers.');
    addLine('NOTES/FILES: Clues that reveal the story.');
    addLine('');
    addLine('FLOORS: B1→B2→B3→B4→B5. Each requires specific conditions.');
    addLine('NPCS: Talk by role (guard/researcher/custodian/voice).');
    addLine('REQUESTS: Complete tasks to earn credits and unlock areas.');
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
    addLine(
      'B2: ' + (gameState.floorsUnlocked.B2 ? 'Marcus Webb (Security Officer)' : '[LOCKED]')
    );
    addLine('B3: ' + (gameState.floorsUnlocked.B3 ? 'Dr. Sarah Chen (Researcher)' : '[LOCKED]'));
    addLine(
      'B4: ' + (gameState.floorsUnlocked.B4 ? 'Maintenance Unit 4 (Custodian)' : '[LOCKED]')
    );
    addLine(
      'B5: ' +
        (gameState.floorsUnlocked.B5
          ? gameState.echoUnlocked
            ? 'Echo (Presence)'
            : '[SILENT]'
          : '[LOCKED]')
    );
    return;
  }

  if (cmdw === 'hud') {
    var h = $('#hud');
    h.style.display = h.style.display === 'block' ? 'none' : 'block';
    addLine('Monitor ' + (h.style.display === 'block' ? 'enabled' : 'disabled'), 'system-message');
    return;
  }

  if (cmdw === 'map') {
    var floors = ['B5', 'B4', 'B3', 'B2', 'B1'];
    addLine('=== FLOOR MAP ===', 'system-message');
    var roster = rosterByFloor();
    floors.forEach(function (f) {
      var line = (f === gameState.floor ? '> ' : '  ') + f + (f === gameState.floor ? ' <' : '');
      if (!gameState.floorsUnlocked[f]) line += ' [LOCKED]';
      var names = roster[f] && roster[f].length ? ' — ' + roster[f].join(', ') : '';
      addLine(line + names);
    });
    if (gameState.place) addLine('[Current location: ' + gameState.place + ']');
    return;
  }

  if (cmdw === 'look') {
    doLook();
    return;
  }

  if (cmdw === 'visit') {
    var place = arg.toLowerCase();
    var key = places.find(function (p) {
      return p === place;
    });
    if (!key) {
      addLine('Where? Options: archives, chapel, loading bay, canteen', 'hint-message');
      return;
    }
    gameState.place = key;
    var lines = placesDesc[key];
    addLine('— ' + key.toUpperCase() + ' —', 'system-message');
    addLine(lines[Math.floor(Math.random() * lines.length)]);

    if (Math.random() < 0.5) {
      var pool = Object.keys(noteBank).filter(function (id) {
        return gameState.notes.indexOf(id) === -1;
      });
      if (pool.length) {
        grantNote(pool[Math.floor(Math.random() * pool.length)]);
      }
    }
    if (Math.random() < 0.4) {
      var fpool = fileBank.filter(function (f) {
        return !gameState.files.find(function (x) {
          return x.id === f.id;
        });
      });
      if (fpool.length) {
        grantFile(fpool[Math.floor(Math.random() * fpool.length)]);
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
    if (gameState.notes.length === 0) addLine('No notes yet.');
    else
      gameState.notes.forEach(function (id) {
        addLine('• ' + noteBank[id]);
      });
    return;
  }

  if (cmdw === 'requests') {
    listRequests();
    return;
  }

  if (cmdw === 'accept') {
    var n = parseInt(arg, 10) - 1;
    if (isNaN(n) || n < 0 || n >= gameState.requests.length) {
      addLine('Which one? (1-3)', 'error-message');
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
      addLine('Use what? Check inventory.', 'error-message');
    } else useItem(arg);
    return;
  }

  if (cmdw === 'move' || cmdw === 'go') {
    var target = arg.toUpperCase();
    if (['B1', 'B2', 'B3', 'B4', 'B5'].indexOf(target) === -1) {
      addLine('Invalid floor. Use: B1, B2, B3, B4, or B5', 'error-message');
      return;
    }

    if (!gameState.floorsUnlocked[target]) {
      if (target === 'B2') {
        addLine('[ELEVATOR HESITATES] Access denied.', 'error-message');
        hint('Complete a request or access terminals to unlock B2.');
        return;
      }
      if (target === 'B3') {
        addLine('[ELEVATOR HESITATES] Research clearance required.', 'error-message');
        hint('Speak with Marcus on B2 or gain understanding (Truths) to unlock B3.');
        return;
      }
      if (target === 'B4') {
        addLine('[ELEVATOR HESITATES] Keycard required.', 'error-message');
        hint('Purchase a keycard from Requisition to unlock B4.');
        return;
      }
      if (target === 'B5') {
        addLine('[ELEVATOR HESITATES] Insufficient clearance.', 'error-message');
        hint('Requires: Keycard + Bio-Scanner + 2 Truths to access B5.');
        return;
      }
    }

    if (
      (target === 'B4' || target === 'B5') &&
      !gameState.inventory.some(function (i) {
        return i.id === 'keycard';
      })
    ) {
      addLine('[ACCESS DENIED] Keycard required.', 'error-message');
      return;
    }

    if (target === 'B5') {
      if (
        !gameState.inventory.some(function (i) {
          return i.id === 'scanner';
        }) ||
        gameState.truths < 2
      ) {
        addLine('[ACCESS DENIED] Inadequate preparation.', 'error-message');
        hint('B5 requires Bio-Scanner and at least 2 Truths.');
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
        var loss = 7;
        gameState.coherence = Math.max(0, gameState.coherence - loss);
        addLine('[The pressure is overwhelming...] -' + loss + ' Coherence', 'error-message');
        playSound('glitch');
        flashGlitch();

        if (gameState.coherence < 15) {
          completeRequestIf('threshold', 'b5_ok');
          triggerGameOver('B5 COHERENCE COLLAPSE');
          return;
        }
        completeRequestIf('threshold', 'b5_ok');
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
      return (
        n.name.toLowerCase().indexOf(a) > -1 ||
        (n.aliases &&
          n.aliases.some(function (x) {
            return a.indexOf(x) > -1;
          })) ||
        (n.role &&
          n.role.some(function (x) {
            return a.indexOf(x) > -1;
          }))
      );
    });

    if (npc === npcsData.echo) {
      if (!gameState.echoUnlocked) {
        addLine('(Silence. It is waiting for understanding, not insistence.)', 'thought');
        hint('Echo requires deeper connection. Speak with others and gather Truths first.');
        return;
      }
      if (gameState.floor !== 'B5') {
        addLine('[It will not reach across floors.]', 'thought');
        return;
      }
      talkTo('echo');
      return;
    }

    if (npc && !gameState.place && npc.location === gameState.floor) {
      if (npc === npcsData.sarah) talkTo('sarah');
      if (npc === npcsData.marcus) talkTo('marcus');
      if (npc === npcsData.janitor) talkTo('janitor');

      if (gameState.met.marcus > 0) tryUnlockB3();
      completeRequestIf('speak', npc.role[0]);
      maybeUnlockEcho();
      maybeUnlockB5ByWisdom();
    } else if (gameState.place) {
      addLine('If someone is here, they do not answer me in places like this.', 'thought');
    } else {
      addLine('[No one answers to that name here.]', 'error-message');
      hint('Make sure you are on the correct floor and the NPC is present.');
    }
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
      var pool = terminalLore[tnum] || [
        'The screen refuses to agree with itself.',
        'All it gives me is my reflection.'
      ];
      addLine(pool[Math.floor(Math.random() * pool.length)], 'system-message');
      playSound('error');

      var loss = 6;
      gameState.coherence = Math.max(0, gameState.coherence - loss);
      addLine('[-' + loss + ' Coherence]', 'error-message');

      if (!gameState.dataChain) initDataChain();

      if (gameState.dataChain && !gameState.dataChain.done) {
        var exp = gameState.dataChain.steps[gameState.dataChain.index];
        if (Number(tnum) === exp) {
          gameState.dataChain.index++;
          think(
            'One step closer: ' +
              gameState.dataChain.index +
              '/' +
              gameState.dataChain.steps.length +
              '.'
          );

          if (gameState.dataChain.index >= gameState.dataChain.steps.length) {
            gameState.dataChain.done = true;
            gameState.truths++;
            addLine(
              '[PATTERN COMPLETE] Something in me stops resisting.',
              'success-message'
            );
            toast('Data Chain Complete', 'Pattern recognized', 'good');
            createParticles(20, document.body);
          }
        }
      }

      completeRequestIf('fetch', tnum);
      tryUnlockB2();
      maybeUnlockEcho();
      maybeUnlockB5ByWisdom();

      if (
        gameState.floorsUnlocked.B5 &&
        gameState.floor === 'B5' &&
        tnum === '9' &&
        gameState.truths >= 3 &&
        gameState.inventory.some(function (i) {
          return i.id === 'scanner';
        })
      ) {
        triggerWin();
        return;
      }

      updateDisplay();
    }, 700);
    return;
  }

  if (cmdw === 'investigate') {
    var topic = arg || 'anything';
    addLine('[Investigating: ' + topic + ']', 'system-message');

    if (Math.random() < 0.7) {
      var fpool = fileBank.filter(function (f) {
        return !gameState.files.find(function (x) {
          return x.id === f.id;
        });
      });
      if (fpool.length) {
        var f = fpool[Math.floor(Math.random() * fpool.length)];
        grantFile(f);
      } else {
        addLine('All accessible files are already collected.', 'thought');
      }
    } else {
      addLine('Nothing yet, but the air feels generous.', 'thought');
    }
    return;
  }

  if (cmdw === 'forage') {
    var gain = 6 + Math.floor(Math.random() * 8);
    gameState.credits += gain;
    addLine('[Shaking drawers yields forgotten coins] +' + gain + '¢', 'success-message');
    updateDisplay();
    return;
  }

  if (cmdw === 'analyze') {
    if (gameState.notes.length >= 3 || gameState.files.length >= 2) {
      gameState.truths++;
      addLine('[I align notes until a tone emerges] +1 Truth', 'success-message');
      createParticles(12, $('#coherence').parentElement);
    } else {
      addLine('I need more material to analyze.', 'error-message');
    }
    updateDisplay();
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
    addLine('Inventory: ' + gameState.inventory.length + ' items');
    addLine('Completed Requests: ' + gameState._completedRequests);
    var unlocked = Object.keys(gameState.floorsUnlocked).filter(function (f) {
      return gameState.floorsUnlocked[f];
    });
    addLine('Floor Access: ' + unlocked.join(', '));
    return;
  }

  if (cmdw === 'work') {
    var pay = 18 + Math.floor(Math.random() * 19);
    var loss = 2 + Math.floor(Math.random() * 2);
    addLine('[Paper bites my fingers...]', 'system-message');
    gameState.credits += pay;
    gameState.coherence = Math.max(0, gameState.coherence - loss);
    addLine('[+' + pay + '¢] [-' + loss + ' Coherence]', 'success-message');
    completeRequestIf('fix');
    completeRequestIf('report');
    updateDisplay();
    return;
  }

  if (cmdw === 'rest') {
    var gain = 8 + Math.floor(Math.random() * 5);
    gameState.coherence = Math.min(100, gameState.coherence + gain);
    completeRequestIf('compose', 'calm_ok');
    addLine(
      '[I count breaths until the walls agree with me] +' + gain + ' Coherence',
      'success-message'
    );
    createParticles(10, $('#coherence').parentElement);
    updateDisplay();
    return;
  }

  if (cmdw === 'hack') {
    if (gameState.credits < 20) {
      addLine('I need a small stake to risk.', 'error-message');
      return;
    }
    gameState.credits -= 20;
    var p = Math.random();
    if (p < 0.12) {
      gameState.credits += 220;
      addLine('[The machine blushes and pays out] +220¢', 'success-message');
      playSound('success');
    } else if (p < 0.45) {
      gameState.credits += 45;
      addLine('[Loose change in the circuitry] +45¢', 'success-message');
    } else {
      addLine('[The cursor laughs without sound]', 'error-message');
      gameState.coherence = Math.max(0, gameState.coherence - 3);
      addLine('[-3 Coherence]', 'error-message');
    }
    updateDisplay();
    return;
  }

  if (cmdw === 'clean') {
    if (!gameState.floorsUnlocked.B4 || gameState.floor !== 'B4') {
      addLine('Mops do not follow me to other floors.', 'error-message');
      return;
    }
    var tip = 14 + Math.floor(Math.random() * 13);
    gameState.credits += tip;
    addLine(
      '[I push the bucket until the corridor stops complaining] +' + tip + '¢',
      'success-message'
    );
    gameState.janitorTrust = Math.min(100, gameState.janitorTrust + 8);
    completeRequestIf('clean');
    updateDisplay();
    return;
  }

  addLine('Command not recognized. Type "help" for available commands.', 'error-message');

}
if (!validateActionContext("forage")) {
  log("Non puoi foraggiare ora. Contesto non valido.");
  return;
}
