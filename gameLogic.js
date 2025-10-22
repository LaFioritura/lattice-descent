/* ===========================
   LATTICE DESCENT - Game Logic v2.0
   Mission system, diary unlocking, win/lose conditions
   =========================== */

// ============================================
// MISSION MANAGEMENT
// ============================================

function getCurrentMission() {
  if (!gameState.activeMission) return null;
  return missions[gameState.activeMission];
}

function updateMissionObjective(objectiveKey) {
  var mission = getCurrentMission();
  if (!mission) return;
  
  var obj = mission.objectives[objectiveKey];
  if (!obj || obj.done) return;
  
  obj.done = true;
  addLine('[Objective Complete: ' + obj.desc + ']', 'success-message');
  playSound('success');
  toast('Progress', obj.desc, 'good');
  
  checkMissionComplete();
}

function checkMissionComplete() {
  var mission = getCurrentMission();
  if (!mission) return;
  
  var allDone = true;
  for (var key in mission.objectives) {
    if (!mission.objectives[key].done) {
      allDone = false;
      break;
    }
  }
  
  if (allDone) {
    completeMission(mission.id);
  }
}

function completeMission(missionId) {
  var mission = missions[missionId];
  if (!mission) return;
  
  gameState.completedMissions.push(missionId);
  
  addLine('', '');
  addLine('╔═══════════════════════════════╗', 'success-message');
  addLine('  MISSION COMPLETE', 'success-message');
  addLine('╚═══════════════════════════════╝', 'success-message');
  addLine('');
  
  mission.onComplete.forEach(function(line) {
    addLine(line, 'system-message');
  });
  addLine('');
  
  // Apply rewards
  if (mission.reward.credits) {
    gameState.credits += mission.reward.credits;
    addLine('[+' + mission.reward.credits + '¢]', 'success-message');
  }
  
  if (mission.reward.truths) {
    gameState.truths += mission.reward.truths;
    addLine('[+' + mission.reward.truths + ' Truth]', 'success-message');
  }
  
  if (mission.reward.unlock) {
    gameState.floorsUnlocked[mission.reward.unlock] = true;
    addLine('[Floor ' + mission.reward.unlock + ' unlocked]', 'success-message');
  }
  
  if (mission.reward.auth) {
    gameState[mission.reward.auth] = true;
  }
  
  if (mission.reward.auth2) {
    gameState[mission.reward.auth2] = true;
  }
  
  if (mission.reward.win) {
    setTimeout(function() {
      winGame();
    }, 2000);
    return;
  }
  
  playSound('success');
  createParticles(20);
  
  // Set next mission
  var nextMission = getNextMission(missionId);
  if (nextMission) {
    setTimeout(function() {
      gameState.activeMission = nextMission;
      var m = missions[nextMission];
      addLine('', '');
      addLine('╔═══ NEW MISSION ASSIGNED ═══╗', 'success-message');
      addLine('  ' + m.title, 'success-message');
      addLine('╚═════════════════════════════╝', 'system-message');
      addLine('');
      addLine(m.briefing, 'system-message');
      addLine('');
      hint('Type "mission" to see objectives');
      toast('New Mission', m.title, 'info');
    }, 1500);
  }
  
  updateDisplay();
  checkDiaryUnlocks();
}

function getNextMission(currentId) {
  var missionOrder = [
    'M_B1_DUPLICATE',
    'M_B2_KEYCARD',
    'M_B3_PROTOCOL',
    'M_B4_MAINTENANCE',
    'M_B5_SEQUENCE'
  ];
  
  var idx = missionOrder.indexOf(currentId);
  if (idx !== -1 && idx < missionOrder.length - 1) {
    return missionOrder[idx + 1];
  }
  return null;
}

function checkAllMissionProgress() {
  var mission = getCurrentMission();
  if (!mission) return;
  
  // Auto-check location objectives
  for (var key in mission.objectives) {
    var obj = mission.objectives[key];
    if (obj.done) continue;
    
    if (obj.type === 'location' && obj.target === gameState.place) {
      updateMissionObjective(key);
    }
  }
}

// ============================================
// DIARY SYSTEM
// ============================================

function checkDiaryUnlocks() {
  diaryTemplate.forEach(function(entry) {
    // Skip if already unlocked
    if (gameState.diaryEntries.some(function(e) { return e.id === entry.id; })) {
      return;
    }
    
    // Check unlock condition
    if (entry.unlockCondition()) {
      unlockDiaryEntry(entry);
    }
  });
}

function unlockDiaryEntry(entry) {
  var unlockedEntry = {
    id: entry.id,
    title: entry.title,
    content: entry.content,
    unlockedAt: gameState.time
  };
  
  gameState.diaryEntries.push(unlockedEntry);
  
  addLine('', '');
  addLine('[New Diary Entry: ' + entry.title + ']', 'hint-message');
  addLine('Type "diary" to read your thoughts.', 'hint-message');
  
  toast('Diary Updated', entry.title, 'info');
  playSound('notification');
  
  updateDisplay();
}

// ============================================
// WIN/LOSE CONDITIONS
// ============================================

function checkLose() {
  if (gameState.coherence <= 0 && !gameState.gameOver) {
    gameState.gameOver = true;
    loseGame();
  }
}

function loseGame() {
  addLine('', '');
  addLine('═══════════════════════════════════', 'error-message');
  addLine('  COHERENCE FAILURE', 'error-message');
  addLine('═══════════════════════════════════', 'error-message');
  addLine('', '');
  addLine('The pattern dissolves.', 'thought');
  addLine('You forget which Gerth you were.', 'thought');
  addLine('The building will try again.', 'thought');
  addLine('It always does.', 'thought');
  addLine('', '');
  addLine('Time survived: ' + formatTime(gameState.time), 'system-message');
  addLine('Truths discovered: ' + gameState.truths, 'system-message');
  addLine('Notes collected: ' + gameState.notes.length, 'system-message');
  addLine('', '');
  
  document.body.classList.add('extreme-glitch');
  stopAmbient();
  playSound('glitch');
  
  setTimeout(function() {
    if (confirm('Coherence lost. Try again?')) {
      location.reload();
    }
  }, 3000);
}

function winGame() {
  gameState.gameOver = true;
  gameState.echoUnlocked = true;
  
  addLine('', '');
  addLine('═══════════════════════════════════', 'success-message');
  addLine('  PATTERN COMPLETE', 'success-message');
  addLine('═══════════════════════════════════', 'success-message');
  addLine('', '');
  
  addLine('The sequence completes.', 'npc-message');
  addLine('Terminal 7 recognizes.', 'npc-message');
  addLine('Terminal 3 integrates.', 'npc-message');
  addLine('Terminal 9 becomes.', 'npc-message');
  addLine('', '');
  
  addLine('Echo speaks. Or listens. Or always was.', 'thought');
  addLine('', '');
  addLine('"Every Gerth finds the pattern."', 'npc-message');
  addLine('"Every Gerth becomes the pattern."', 'npc-message');
  addLine('"You are not the first."', 'npc-message');
  addLine('"You will not be the last."', 'npc-message');
  addLine('"The lattice descends."', 'npc-message');
  addLine('"Forever."', 'npc-message');
  addLine('', '');
  
  addLine('You understand now.', 'thought');
  addLine('You always understood.', 'thought');
  addLine('', '');
  
  addLine('╔═══════════════════════════════╗', 'system-message');
  addLine('  LATTICE DESCENT - COMPLETE', 'system-message');
  addLine('╚═══════════════════════════════╝', 'system-message');
  addLine('', '');
  addLine('Time: ' + formatTime(gameState.time), 'system-message');
  addLine('Truths: ' + gameState.truths + '/5', 'system-message');
  addLine('Notes: ' + gameState.notes.length + '/16', 'system-message');
  addLine('Diary: ' + gameState.diaryEntries.length + '/10', 'system-message');
  addLine('Coherence: ' + gameState.coherence + '%', 'system-message');
  
  checkDiaryUnlocks(); // Unlock final diary entry
  
  createParticles(50);
  playSound('success');
  
  document.body.classList.remove('glitch-mode');
  document.body.classList.remove('extreme-glitch');
  
  setTimeout(function() {
    toast('Pattern Complete', 'You are the lattice', 'good');
  }, 1000);
}

// ============================================
// PERSONNEL INTERACTIONS
// ============================================

function contactPersonnel(name) {
  var person = personnelRoster[name];
  if (!person) {
    addLine('Personnel not found.', 'error-message');
    return;
  }
  
  if (person.floor !== gameState.floor) {
    addLine(person.name + ' is on floor ' + person.floor + '.', 'error-message');
    return;
  }
  
  var dialogue = getPersonnelDialogue(name);
  if (!dialogue) {
    addLine(person.name + ' has nothing more to say.', 'thought');
    return;
  }
  
  addLine('', '');
  dialogue.lines.forEach(function(line) {
    addLine(line, 'npc-message');
  });
  addLine('', '');
  
  // Apply effects
  if (dialogue.effects) {
    if (dialogue.effects.trust) {
      gameState.personnelTrust[name] = Math.min(100, gameState.personnelTrust[name] + dialogue.effects.trust);
      addLine('[Trust with ' + person.name + ': +' + dialogue.effects.trust + ']', 'success-message');
    }
    
    if (dialogue.effects.auth) {
      gameState[dialogue.effects.auth] = true;
    }
    
    if (dialogue.effects.unlock) {
      gameState.floorsUnlocked[dialogue.effects.unlock] = true;
      addLine('[Floor ' + dialogue.effects.unlock + ' unlocked]', 'success-message');
    }
    
    if (dialogue.effects.auth2) {
      gameState[dialogue.effects.auth2] = true;
    }
  }
  
  playSound('notification');
  updateDisplay();
  checkDiaryUnlocks();
  
  // Update mission objectives
  var mission = getCurrentMission();
  if (mission) {
    for (var key in mission.objectives) {
      var obj = mission.objectives[key];
      if (obj.type === 'personnel' && obj.target === name && !obj.done) {
        updateMissionObjective(key);
        break;
      }
    }
  }
}

function getPersonnelDialogue(name) {
  var person = personnelRoster[name];
  if (!person || !person.dialogues) return null;
  
  // Special logic for Sarah (CF-07 check)
  if (name === 'sarah') {
    if (gameState._hasReturnedToSarah) {
      return person.dialogues.find(function(d) { return d.trigger === 'repeat'; });
    } else if (gameState._hasReadCF07 && gameState.personnelTrust.sarah > 0) {
      gameState._hasReturnedToSarah = true;
      return person.dialogues.find(function(d) { return d.trigger === 'afterCF07'; });
    } else if (gameState.personnelTrust.sarah === 0) {
      return person.dialogues.find(function(d) { return d.trigger === 'first'; });
    }
  }
  
  // Special logic for Janitor (cleaning check)
  if (name === 'janitor') {
    if (gameState.personnelTrust.janitor > 0) {
      return person.dialogues.find(function(d) { return d.trigger === 'repeat'; });
    } else if (gameState._cleanCount >= 5) {
      return person.dialogues.find(function(d) { return d.trigger === 'afterCleaning'; });
    } else {
      return person.dialogues.find(function(d) { return d.trigger === 'first'; });
    }
  }
  
  // Marcus and others
  if (gameState.personnelTrust[name] > 0) {
    return person.dialogues.find(function(d) { return d.trigger === 'repeat'; });
  } else {
    return person.dialogues.find(function(d) { return d.trigger === 'first'; });
  }
}

// ============================================
// ROOM INTERACTIONS
// ============================================

function getRoomData(floor, place) {
  if (!roomSystem[floor] || !roomSystem[floor][place]) {
    return null;
  }
  return roomSystem[floor][place];
}

function lookAtObject(objectName) {
  var room = getRoomData(gameState.floor, gameState.place);
  if (!room) {
    addLine('You are nowhere.', 'error-message');
    return;
  }
  
  var obj = room.objects[objectName];
  if (obj) {
    addLine(obj, 'thought');
    
    // Special interactions
    if (objectName === 'desk' && !gameState._hasSearchedDesk) {
      gameState._hasSearchedDesk = true;
      addLine('You find a note in the drawer.', 'hint-message');
      hint('Type "notes" to read it');
    }
  } else {
    addLine('You don\'t see that here.', 'error-message');
  }
}

function lookDirection(direction) {
  var room = getRoomData(gameState.floor, gameState.place);
  if (!room) return;
  
  var desc = room.directions[direction];
  if (desc) {
    addLine(desc, 'thought');
  } else {
    addLine('Nothing interesting in that direction.', 'thought');
  }
}

// ============================================
// NOTE MANAGEMENT
// ============================================

function readNote(noteId) {
  var note = caseFiles[noteId];
  if (!note) {
    addLine('Note not found.', 'error-message');
    return;
  }
  
  // Check if already read
  var alreadyRead = gameState.notes.some(function(n) { return n.id === noteId; });
  
  if (!alreadyRead) {
    gameState.notes.push(note);
    addLine('[Case File added to notes]', 'success-message');
  }
  
  addLine('', '');
  note.content.forEach(function(line) {
    addLine(line, 'npc-message');
  });
  addLine('', '');
  
  // Special flags
  if (noteId === 'CF-07') {
    gameState._hasReadCF07 = true;
    hint('Return to Dr. Chen');
  }
  
  playSound('notification');
  updateDisplay();
  checkDiaryUnlocks();
  
  // Update mission objectives
  var mission = getCurrentMission();
  if (mission) {
    for (var key in mission.objectives) {
      var obj = mission.objectives[key];
      if (obj.type === 'note' && obj.target === noteId && !obj.done) {
        updateMissionObjective(key);
        break;
      }
    }
  }
}

// ============================================
// ITEM USAGE
// ============================================

function useItem(itemName) {
  var item = gameState.inventory.find(function(i) { 
    return i.name.toLowerCase() === itemName.toLowerCase(); 
  });
  
  if (!item) {
    addLine('You don\'t have that item.', 'error-message');
    return;
  }
  
  addLine('[Using: ' + item.name + ']', 'system-message');
  
  if (item.id === 'stabilizer') {
    gameState.coherence = Math.min(100, gameState.coherence + 20);
    addLine('[+20 Coherence]', 'success-message');
    removeItem(item.id);
  } else if (item.id === 'analyzer') {
    gameState.coherence = Math.min(100, gameState.coherence + 15);
    addLine('[+15 Coherence]', 'success-message');
    addLine('The analyzer reveals hidden patterns in the walls.', 'thought');
    removeItem(item.id);
  } else if (item.id === 'focus') {
    gameState.coherence = Math.min(100, gameState.coherence + 10);
    addLine('[+10 Coherence]', 'success-message');
    removeItem(item.id);
  } else if (item.id === 'keycard') {
    addLine('Keycard already active. Access granted to restricted floors.', 'system-message');
  } else if (item.id === 'scanner') {
    addLine('Scanner active. Detecting anomalies...', 'system-message');
    addLine('Pattern detected: 7-3-9 recurring across all systems.', 'thought');
  }
  
  playSound('success');
  updateDisplay();
}

function removeItem(itemId) {
  var idx = gameState.inventory.findIndex(function(i) { return i.id === itemId; });
  if (idx !== -1) {
    gameState.inventory.splice(idx, 1);
  }
}

// ============================================
// ACHIEVEMENTS
// ============================================

function checkAchievements() {
  // Implementation for achievement checking
  // (keeping it simple for now)
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatTime(seconds) {
  var mins = Math.floor(seconds / 60);
  var secs = seconds % 60;
  return ('0' + mins).slice(-2) + ':' + ('0' + secs).slice(-2);
}