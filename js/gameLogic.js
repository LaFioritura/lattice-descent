/* ===========================
   NEXUS PROTOCOL - Game Logic (Balanced)
   =========================== */

function grantAchievement(id) {
  if (gameState.achievements[id]) return;
  var rule = achRules.find(function (a) {
    return a.id === id;
  });
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
      if (
        npc.location === gameState.floor &&
        gameState.floorsUnlocked[gameState.floor] &&
        npc !== npcsData.echo
      )
        addLine(npc.name + ' is here.', 'success-message');
    });
    if (gameState.floor === 'B5' && gameState.floorsUnlocked.B5) {
      addLine(
        gameState.echoUnlocked
          ? 'Something answers your breathing.'
          : 'Silence learns your outlines.',
        'thought'
      );
    }
  }
}

function canUnlockFloor(floor) {
  if (floor === 'B2') {
    return gameState._completedRequests >= 2 && gameState.truths >= 1;
  }
  if (floor === 'B3') {
    return gameState.floorsUnlocked.B2 && gameState.met.marcus > 0 && gameState.truths >= 2;
  }
  if (floor === 'B4') {
    return (
      gameState.floorsUnlocked.B3 &&
      gameState.met.sarah > 0 &&
      gameState.inventory.some(function (i) {
        return i.id === 'keycard';
      }) &&
      gameState.truths >= 3
    );
  }
  if (floor === 'B5') {
    return (
      gameState.floorsUnlocked.B4 &&
      gameState.inventory.some(function (i) {
        return i.id === 'keycard';
      }) &&
      gameState.inventory.some(function (i) {
        return i.id === 'scanner';
      }) &&
      gameState.truths >= 4 &&
      gameState.dataChain &&
      gameState.dataChain.done
    );
  }
  return false;
}

function tryUnlockB2() {
  if (!gameState.floorsUnlocked.B2 && canUnlockFloor('B2')) {
    gameState.floorsUnlocked.B2 = true;
    think('The elevator remembers the way to B2.');
    toast('Access expanded', 'B2 is now reachable.', 'info');
    hint('Security level unlocked. Try: move b2');
  }
}

function tryUnlockB3() {
  if (!gameState.floorsUnlocked.B3 && canUnlockFloor('B3')) {
    gameState.floorsUnlocked.B3 = true;
    think('Research starts taking my calls.');
    toast('Access expanded', 'B3 is now reachable.', 'info');
    hint('Research level unlocked. Try: move b3');
  }
}

function tryUnlockB4() {
  if (!gameState.floorsUnlocked.B4 && canUnlockFloor('B4')) {
    gameState.floorsUnlocked.B4 = true;
    think('Maintenance signs my permission with a wet glove.');
    toast('Access expanded', 'B4 is now reachable.', 'info');
    hint('Maintenance level unlocked. Try: move b4');
  }
}

function tryUnlockB5() {
  if (!gameState.floorsUnlocked.B5 && canUnlockFloor('B5')) {
    gameState.floorsUnlocked.B5 = true;
    think('The bottom floor exhales.');
    toast('Access expanded', 'B5 is now reachable.', 'warn');
    hint('WARNING: B5 drains coherence rapidly. Complete the pattern sequence first.');
  }
}

function pickDistinct(arr, n) {
  var pool = arr.slice(),
    out = [];
  while (pool.length && out.length < n) {
    out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return out;
}

function makeRequest() {
  var k = requestKinds[Math.floor(Math.random() * requestKinds.length)];
  var id = Math.random().toString(36).slice(2, 7);
  var meta = {},
    goal = 1,
    progress = 0,
    reward = 55 + Math.floor(Math.random() * 85),
    desc = '';
  function setMulti(g) {
    goal = g;
    reward += (g - 1) * 12;
  }
  if (k === 'visit') {
    var g = 2 + Math.floor(Math.random() * 3);
    var list = pickDistinct(places, g);
    meta.places = list;
    meta.donePlaces = {};
    setMulti(g);
    desc = 'Visit locations: ' + list.join(', ');
  } else if (k === 'speak') {
    var who = ['researcher', 'guard', 'custodian'];
    var g = 2 + Math.floor(Math.random() * 2);
    var list = pickDistinct(who, g);
    meta.who = list;
    meta.done = {};
    setMulti(g);
    desc = 'Speak with: ' + list.join(' & ');
  } else if (k === 'fetch') {
    var nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    var g = 2 + Math.floor(Math.random() * 3);
    var list = pickDistinct(nums, g);
    meta.terminals = list;
    meta.done = {};
    setMulti(g);
    desc = 'Access terminals: ' + list.join(', ');
  } else if (k === 'scan') {
    var g = 2 + Math.floor(Math.random() * 2);
    setMulti(g);
    desc = 'Scan vents (' + goal + 'x)';
  } else if (k === 'fix') {
    var g = 2 + Math.floor(Math.random() * 3);
    setMulti(g);
    desc = 'Work on admin tasks (' + goal + 'x)';
  } else if (k === 'clean') {
    var g = 2 + Math.floor(Math.random() * 2);
    setMulti(g);
    desc = 'Help maintenance (' + goal + ' corridors)';
  } else if (k === 'report') {
    var g = 2 + Math.floor(Math.random() * 2);
    setMulti(g);
    desc = 'Complete shift reports (' + goal + 'x)';
  } else if (k === 'sample') {
    desc = 'Use bio-scanner on environment';
    meta.needScanner = true;
  } else if (k === 'compose') {
    desc = 'Restore coherence above 85%';
    meta.targetCoherence = 85;
  } else if (k === 'threshold') {
    desc = 'Visit B5 and maintain coherence';
  } else if (k === 'restore') {
    desc = 'Scan anomalies on B2';
    meta.floor = 'B2';
  } else if (k === 'investigate') {
    var g = 2 + Math.floor(Math.random() * 3);
    setMulti(g);
    desc = 'Read ' + goal + ' files';
    meta.needRead = true;
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
    addLine(i + 1 + '. ' + r.desc + ' ' + status + ' — ' + r.reward + '¢');
  });
  addLine('Use "accept [n]" to focus. "refresh" (-20¢) for new requests.');
}

function finishRequest(r) {
  addLine('[COMPLETED] ' + r.desc + ' [+' + r.reward + '¢]', 'success-message');
  gameState.credits += r.reward;
  playSound('success');
  gameState._completedRequests++;
  createParticles(15, $('#credits').parentElement);

  // Progression gates
  if (!gameState.floorsUnlocked.B2 && gameState._completedRequests >= 2) {
    tryUnlockB2();
  }
  if (!gameState.floorsUnlocked.B3 && gameState.met.marcus > 0) {
    tryUnlockB3();
  }
  if (!gameState.floorsUnlocked.B4 && gameState.met.sarah > 0) {
    tryUnlockB4();
  }

  // Reduced note drop rate
  if (Math.random() < 0.25) {
    var pool = Object.keys(noteBank).filter(function (id) {
      return gameState.notes.indexOf(id) === -1;
    });
    if (pool.length) {
      var pick = pool[Math.floor(Math.random() * pool.length)];
      grantNote(pick);
    }
  }
  
  // Reduced truth gain
  if (Math.random() < 0.2) {
    gameState.truths++;
    think('I understand a little more.');
    createParticles(10, $('#coherence').parentElement);
  }

  maybeUnlockB5ByWisdom();
  updateDisplay();
}

function completeRequestIf(kind, payload) {
  gameState.requests.forEach(function (r) {
    if (r.progress >= r.goal || r.kind !== kind) return;
    if (kind === 'visit' && r.meta.places) {
      if (r.meta.places.indexOf(payload) > -1 && !r.meta.donePlaces[payload]) {
        r.meta.donePlaces[payload] = true;
        r.progress++;
        addLine('[Request progress: ' + r.progress + '/' + r.goal + ']', 'success-message');
      }
    } else if (kind === 'speak' && r.meta.who) {
      for (var i = 0; i < r.meta.who.length; i++) {
        if (payload.indexOf(r.meta.who[i]) > -1 && !r.meta.done[r.meta.who[i]]) {
          r.meta.done[r.meta.who[i]] = true;
          r.progress++;
          addLine('[Request progress: ' + r.progress + '/' + r.goal + ']', 'success-message');
          break;
        }
      }
    } else if (kind === 'fetch' && r.meta.terminals) {
      if (r.meta.terminals.indexOf(Number(payload)) > -1 && !r.meta.done[payload]) {
        r.meta.done[payload] = true;
        r.progress++;
        addLine('[Request progress: ' + r.progress + '/' + r.goal + ']', 'success-message');
      }
    } else if (kind === 'scan' || kind === 'clean' || kind === 'fix' || kind === 'report') {
      r.progress++;
      addLine('[Request progress: ' + r.progress + '/' + r.goal + ']', 'success-message');
    } else if (kind === 'threshold' && payload === 'b5_ok') {
      r.progress = 1;
    } else if (kind === 'restore' && payload === 'b2_scan_ok') {
      r.progress = 1;
    } else if (kind === 'sample' && payload === 'scanner_ok') {
      r.progress = 1;
    } else if (kind === 'compose' && payload === 'calm_ok') {
      r.progress = 1;
    } else if (kind === 'investigate' && payload && payload.readFile) {
      r.progress++;
    }

    if (r.progress >= r.goal) finishRequest(r);
  });
}

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
  if (
    !gameState.files.find(function (f) {
      return f.id === obj.id;
    })
  ) {
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
    addLine('Read what? Use file ID or title keywords.', 'error-message');
    return;
  }
  var s = arg.toLowerCase();
  var f = gameState.files.find(function (x) {
    return x.id.toLowerCase() === s || x.title.toLowerCase().indexOf(s) > -1;
  });
  if (!f) {
    addLine('No such file in your collection.', 'error-message');
    return;
  }
  addLine('=== ' + f.id + ' — ' + f.title + ' ===', 'system-message');
  f.body.forEach(function (p) {
    addLine(p);
  });
  
  // Truth gain only from special files
  if ((f.id === 'CF-05' || f.id === 'CF-07') && !f.readBefore) {
    gameState.truths++;
    think('The pieces agree for a breath.');
    createParticles(8, $('#coherence').parentElement);
    f.readBefore = true;
  }
  
  completeRequestIf('investigate', { readFile: true });
  updateDisplay();
}

function scanEvent() {
  // Limit scan usage
  if (!gameState._scanCount) gameState._scanCount = 0;
  if (gameState._scanCount >= 8) {
    addLine('[The vents have nothing left to say.]', 'thought');
    return;
  }
  gameState._scanCount++;
  
  var res = [
    'Something lives in the vents.',
    'The corridor forgets its angles.',
    'The air counts backward.'
  ];
  addLine(res[Math.floor(Math.random() * res.length)], 'error-message');
  playSound('glitch');
  flashGlitch();
  gameState.coherence = Math.max(0, gameState.coherence - 3);
  addLine('[-3 Coherence]', 'error-message');

  // Only first 3 scans can give notes
  if (gameState._scanCount <= 3 && Math.random() < 0.4) {
    var pool = Object.keys(noteBank).filter(function (id) {
      return gameState.notes.indexOf(id) === -1;
    });
    if (pool.length) {
      grantNote(pool[Math.floor(Math.random() * pool.length)]);
    }
  }
  
  if (gameState.floor === 'B2') completeRequestIf('restore', 'b2_scan_ok');
  completeRequestIf('scan');
  updateDisplay();
}

function initDataChain() {
  if (gameState.dataChain) return; // Prevent re-initialization
  gameState.dataChain = { steps: [7, 3, 9], index: 0, done: false };
  think('A pattern emerges from the terminal logs: 7 → 3 → 9.');
  hint('Access terminals in this specific sequence to unlock deeper access.');
}

function maybeUnlockEcho() {
  var spoke = gameState.met.marcus > 0 && gameState.met.sarah > 0;
  if (
    !gameState.echoUnlocked &&
    spoke &&
    gameState.dataChain &&
    gameState.dataChain.done &&
    gameState.truths >= 4
  ) {
    gameState.echoUnlocked = true;
    think('The hush on B5 starts answering the outline of my breath.');
    toast('A presence stirs', 'B5 begins to listen.', 'warn');
    hint('Echo can now be contacted on B5 using: talk voice');
  }
}

function maybeUnlockB5ByWisdom() {
  if (!gameState.floorsUnlocked.B5 && canUnlockFloor('B5')) {
    tryUnlockB5();
  }
}

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

  var html =
    '<p class="error-message"><strong>' +
    reason +
    '</strong></p>' +
    '<p>Time survived: <strong>' +
    mins +
    ':' +
    secs +
    '</strong></p>' +
    '<p>Credits earned: <strong>' +
    gameState.credits +
    '¢</strong></p>' +
    '<p>Truths gathered: <strong>' +
    gameState.truths +
    '</strong></p>' +
    '<p>Notes found: <strong>' +
    gameState.notes.length +
    '/16</strong></p>' +
    '<p>Files collected: <strong>' +
    gameState.files.length +
    '/' +
    fileBank.length +
    '</strong></p>' +
    '<div style="margin-top:10px"><button class="action-btn" id="restartBtn">RESTART</button></div>';

  $('#gameOverContent').innerHTML = html;
  $('#gameOverModal').style.display = 'block';
  $('#restartBtn').onclick = function () {
    location.reload();
  };

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

  var html =
    '<p class="success-message"><strong>YOU REMEMBER YOUR NAME</strong></p>' +
    '<p>Time to revelation: <strong>' +
    mins +
    ':' +
    secs +
    '</strong></p>' +
    '<p>Final Coherence: <strong>' +
    gameState.coherence +
    '%</strong></p>' +
    '<p>Truths gathered: <strong>' +
    gameState.truths +
    '</strong></p>' +
    '<p>Notes found: <strong>' +
    gameState.notes.length +
    '/16</strong></p>' +
    '<p>Files collected: <strong>' +
    gameState.files.length +
    '/' +
    fileBank.length +
    '</strong></p>' +
    '<p>Achievements: <strong>' +
    gameState.achCount +
    '</strong></p>' +
    '<div style="margin-top:10px"><button class="action-btn" id="restartBtn2">RESTART</button></div>';

  $('#winContent').innerHTML = html;
  $('#winModal').style.display = 'block';
  $('#restartBtn2').onclick = function () {
    location.reload();
  };

  addLine('=== REVELATION COMPLETE ===', 'system-message');
  toast('Achievement unlocked', 'Revelation', 'good');
  grantAchievement('ACH_WIN');
  playSound('success');
  createParticles(30, document.body);
}

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
    gameState.inventory = gameState.inventory.filter(function (i) {
      return i !== item;
    });
    completeRequestIf('compose', 'calm_ok');
  } else if (item.id === 'keycard') {
    addLine('[Green light. Doors remember me now.]', 'system-message');
    createParticles(10, $('#floor').parentElement);
    toast('Keycard activated', 'Access permissions updated', 'info');
    tryUnlockB4();
  } else if (item.id === 'scanner') {
    // Limit scanner usage
    if (!gameState._scannerUses) gameState._scannerUses = 0;
    if (gameState._scannerUses >= 5) {
      addLine('[The scanner battery is depleted.]', 'error-message');
      return;
    }
    gameState._scannerUses++;
    
    addLine('[I hold the scanner to the wall...]', 'system-message');
    setTimeout(function () {
      addLine('[It hears something breathing behind the paint.]', 'thought');
      playSound('glitch');
      flashGlitch();
      if (gameState._scannerUses <= 3 && Math.random() < 0.4) {
        var pool = Object.keys(noteBank).filter(function (id) {
          return gameState.notes.indexOf(id) === -1;
        });
        if (pool.length) {
          grantNote(pool[Math.floor(Math.random() * pool.length)]);
        }
      }
      completeRequestIf('sample', 'scanner_ok');
      maybeUnlockB5ByWisdom();
    }, 900);
  } else if (item.id === 'backup') {
    addLine('[I save a version of me I will never meet.]', 'system-message');
    addLine('(This place files everyone.)', 'thought');
    toast('Memory Backup', 'Consciousness snapshot saved', 'warn');
    createParticles(20, document.body);
  }

  updateDisplay();
}

function talkTo(npcId) {
  var npc = npcsData[npcId];
  if (!npc) return;
  
  // Limit conversation depth
  if (gameState.met[npcId] >= 3) {
    addLine('[' + npc.name + ' has nothing more to say right now.]', 'thought');
    return;
  }
  
  var bank = tierLines[npcId] || [['...', '...']];
  var i = Math.min(gameState.met[npcId] || 0, bank.length - 1);
  var pair = bank[i];
  var line = pair[Math.floor(Math.random() * pair.length)];

  addLine('[' + npc.name + ']:', 'npc-message');
  addLine(line, 'npc-message');

  // Only first conversation gives notes
  if (gameState.met[npcId] === 0 && Math.random() < 0.5) {
    var pool = Object.keys(noteBank).filter(function (id) {
      return gameState.notes.indexOf(id) === -1;
    });
    if (pool.length) {
      grantNote(pool[Math.floor(Math.random() * pool.length)]);
    }
  }
  
  // Only some conversations give files
  if (gameState.met[npcId] === 1 && Math.random() < 0.3) {
    var fpool = fileBank.filter(function (f) {
      return !gameState.files.find(function (x) {
        return x.id === f.id;
      });
    });
    if (fpool.length) {
      grantFile(fpool[Math.floor(Math.random() * fpool.length)]);
    }
  }
  
  // Truth gain only on meaningful conversations
  if (gameState.met[npcId] <= 1 && npcId !== 'echo') {
    gameState.truths++;
    think('Their words find a place to sit in me.');
  }

  gameState.met[npcId] = (gameState.met[npcId] || 0) + 1;

  // Conversation choices (only on first meeting)
  if (npcId === 'marcus' && gameState.met.marcus === 1) {
    makeChoices([
      {
        label: 'Tell Marcus about the delayed mirror',
        outcome:
          'He nods once, as if that was a password. "Then Security likes you. Use that."',
        effects: { truths: 1, credits: 25 }
      },
      {
        label: 'Say nothing',
        outcome: 'Silence accepts the blame for you. Marcus looks relieved.',
        effects: {}
      }
    ]);
  }
  if (npcId === 'sarah' && gameState.met.sarah === 2) {
    makeChoices([
      {
        label: 'Offer raw logs (terminal data you found)',
        outcome: '"Good. You watched without forcing. Keep doing that."',
        effects: { truths: 1 }
      },
      {
        label: 'Ask for direct answers',
        outcome: '"Answers are maintenance. You need architecture."',
        effects: { coherence: 5 }
      }
    ]);
  }
  if (npcId === 'janitor' && gameState.met.janitor === 1) {
    makeChoices([
      {
        label: 'Help clean a corridor',
        outcome: '"It complains less when you listen." The mop sounds like a clarinet.',
        effects: { trustJanitor: 10, credits: 20 }
      },
      {
        label: 'Decline politely',
        outcome: '"Floors complain anyway." The corridor sulks a while.',
        effects: {}
      }
    ]);
  }
  if (npcId === 'echo' && gameState.truths >= 4) {
    makeChoices([
      {
        label: 'Admit you arrived by deciding to be here',
        outcome: '"Good. Keep both of you." The hush warms.',
        effects: { truths: 1 }
      },
      {
        label: 'Insist on being singular',
        outcome: '"You can be, but you will be lonely." The hush cools.',
        effects: {}
      }
    ]);
  }
  updateDisplay();
}