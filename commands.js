/* ===========================
   LATTICE DESCENT - Command Parser v2.1 - FIXED
   All game commands and input handling
   FIX: Aggiunto comando 'search' e migliorato 'touch archives'
   =========================== */

// ============================================
// COMMAND PROCESSOR
// ============================================

function processCommand() {
  if (gameState.gameOver) return;
  
  var input = $('#commandInput').value.trim().toLowerCase();
  if (!input) return;
  
  addLine('> ' + input);
  $('#commandInput').value = '';
  
  playSound('type');
  
  // Parse command
  var parts = input.split(' ');
  var cmd = parts[0];
  var args = parts.slice(1);
  
  // Command routing
  if (cmd === 'help') {
    showHelp();
  } else if (cmd === 'look') {
    cmdLook(args);
  } else if (cmd === 'move' || cmd === 'go') {
    cmdMove(args);
  } else if (cmd === 'visit') {
    cmdVisit(args);
  } else if (cmd === 'work') {
    cmdWork();
  } else if (cmd === 'rest') {
    cmdRest();
  } else if (cmd === 'status') {
    cmdStatus();
  } else if (cmd === 'mission' || cmd === 'missions') {
    cmdMission();
  } else if (cmd === 'personnel') {
    cmdPersonnel();
  } else if (cmd === 'contact' || cmd === 'talk') {
    cmdContact(args);
  } else if (cmd === 'notes' || cmd === 'files') {
    cmdNotes();
  } else if (cmd === 'read') {
    cmdRead(args);
  } else if (cmd === 'diary') {
    cmdDiary();
  } else if (cmd === 'use') {
    cmdUse(args);
  } else if (cmd === 'touch' || cmd === 'interact') {
    cmdTouch(args);
  } else if (cmd === 'search' || cmd === 'examine') {
    cmdSearch(args);
  } else if (cmd === 'access') {
    cmdAccess(args);
  } else if (cmd === 'clean') {
    cmdClean();
  } else if (cmd === 'wait') {
    cmdWait();
  } else if (cmd === 'credits') {
    cmdCredits();
  } else if (cmd === 'clear' || cmd === 'cls') {
    cmdClear();
  } else {
    addLine('Unknown command: ' + cmd, 'error-message');
    addLine('Type "help" for available commands.', 'hint-message');
    playSound('error');
  }
  
  // Auto-check mission progress
  checkAllMissionProgress();
}

// ============================================
// HELP COMMAND
// ============================================

function showHelp() {
  addLine('═══════════════════════════════════', 'system-message');
  addLine('  LATTICE DESCENT - COMMAND LIST', 'system-message');
  addLine('═══════════════════════════════════', 'system-message');
  addLine('');
  addLine('NAVIGATION:', 'success-message');
  addLine('  look [object/direction] - Examine surroundings');
  addLine('  move [B1-B5] - Travel between floors');
  addLine('  visit [location] - Go to specific location on floor');
  addLine('');
  addLine('ACTIONS:', 'success-message');
  addLine('  work - Earn credits (-3 coherence)');
  addLine('  rest - Restore coherence (+10-18)');
  addLine('  clean - Clean maintenance bay (B4 only)');
  addLine('  wait - Pass time');
  addLine('');
  addLine('INTERACTION:', 'success-message');
  addLine('  contact [name] - Speak with personnel');
  addLine('  touch [object] - Interact with object');
  addLine('  search [object] - Search object for items');
  addLine('  use [item] - Use inventory item');
  addLine('  access [terminal] - Access terminal (B5)');
  addLine('');
  addLine('INFORMATION:', 'success-message');
  addLine('  status - View your stats');
  addLine('  mission - Check mission objectives');
  addLine('  personnel - List all personnel');
  addLine('  notes - View collected case files');
  addLine('  read [file] - Read specific case file');
  addLine('  diary - Read your personal diary');
  addLine('');
  addLine('SHORTCUTS:', 'success-message');
  addLine('  Ctrl+D - Open diary');
  addLine('  Ctrl+M - Show mission');
  addLine('  Ctrl+H - Toggle HUD');
  addLine('');
}

// ============================================
// LOOK COMMAND
// ============================================

function cmdLook(args) {
  if (args.length === 0) {
    // Look at current room
    var room = getRoomData(gameState.floor, gameState.place);
    if (room) {
      addLine('═══ ' + room.name.toUpperCase() + ' ═══', 'system-message');
      addLine('');
      
      // ASCII art
      var ascii = renderRoomASCII(gameState.floor, gameState.place);
      if (ascii) {
        var pre = document.createElement('pre');
        pre.innerHTML = ascii;
        pre.style.color = '#00ccff';
        pre.style.lineHeight = '1.2';
        pre.style.fontSize = '12px';
        $('#terminal').appendChild(pre);
        addLine('');
      }
      
      addLine(room.description, 'thought');
      addLine('');
      addLine('Objects: ' + Object.keys(room.objects).join(', '), 'hint-message');
      addLine('Directions: north, south, east, west', 'hint-message');
      
      // FIX: Automaticamente notifica file disponibili
      checkAvailableFiles();
    } else {
      addLine('You are in an undefined space.', 'error-message');
    }
  } else {
    var target = args.join(' ');
    
    // Check if it's a direction
    if (['north', 'south', 'east', 'west'].indexOf(target) !== -1) {
      lookDirection(target);
    } else {
      // Look at object
      lookAtObject(target);
    }
  }
}

// ============================================
// MOVE COMMAND
// ============================================

function cmdMove(args) {
  if (args.length === 0) {
    addLine('Move where? Specify floor (B1-B5).', 'error-message');
    return;
  }
  
  var target = args[0].toUpperCase();
  
  if (!['B1', 'B2', 'B3', 'B4', 'B5'].includes(target)) {
    addLine('Invalid floor: ' + target, 'error-message');
    return;
  }
  
  if (target === gameState.floor) {
    addLine('You are already on ' + target + '.', 'error-message');
    return;
  }
  
  if (!gameState.floorsUnlocked[target]) {
    addLine('Floor ' + target + ' is locked.', 'error-message');
    addLine('Complete missions to unlock new floors.', 'hint-message');
    playSound('error');
    return;
  }
  
  // Move to floor
  gameState.floor = target;
  
  // Set default location for floor
  var defaultLocations = {
    B1: 'OFFICE',
    B2: 'SECURITY',
    B3: 'LAB',
    B4: 'MAINTENANCE',
    B5: 'DEPTHS'
  };
  gameState.place = defaultLocations[target];
  
  addLine('', '');
  addLine('[Elevator descends to ' + target + ']', 'success-message');
  addLine('', '');
  
  playSound('elevator');
  triggerVisualGlitch('low');
  toast('Floor Change', 'Now on ' + target, 'info');
  tick('Arrived at ' + target);
  
  updateDisplay();
  updateAmbientForContext();
  
  // Auto-look
  setTimeout(function() {
    cmdLook([]);
  }, 500);
}

// ============================================
// VISIT COMMAND
// ============================================

function cmdVisit(args) {
  if (args.length === 0) {
    addLine('Visit where? Available locations on ' + gameState.floor + ':', 'error-message');
    var room = roomSystem[gameState.floor];
    if (room) {
      addLine(Object.keys(room).join(', '), 'hint-message');
    }
    return;
  }
  
  var target = args.join(' ').toUpperCase();
  
  // Check if location exists on current floor
  if (!roomSystem[gameState.floor] || !roomSystem[gameState.floor][target]) {
    addLine('Location not found on ' + gameState.floor + '.', 'error-message');
    return;
  }
  
  if (gameState.place === target) {
    addLine('You are already at ' + target + '.', 'error-message');
    return;
  }
  
  gameState.place = target;
  addLine('[Moving to ' + target + ']', 'success-message');
  playSound('notification');
  
  updateDisplay();
  
  // Auto-look
  setTimeout(function() {
    cmdLook([]);
  }, 300);
}

// ============================================
// WORK COMMAND
// ============================================

function cmdWork() {
  var earnings = 20 + Math.floor(Math.random() * 15);
  var coherenceLoss = 3;
  
  gameState.credits += earnings;
  gameState.coherence = Math.max(0, gameState.coherence - coherenceLoss);
  
  addLine('[Processing paperwork...]', 'system-message');
  addLine('[+' + earnings + 'Â¢] [-' + coherenceLoss + ' Coherence]', 'success-message');
  
  var messages = [
    'The forms duplicate themselves when you look away.',
    'Your signature changes handwriting halfway through.',
    'The date on the documents is tomorrow.',
    'You finish a report you don\'t remember starting.',
    'The filing cabinet has a folder with your name. It\'s empty.'
  ];
  
  addLine(messages[Math.floor(Math.random() * messages.length)], 'thought');
  
  playSound('type');
  updateDisplay();
}

// ============================================
// REST COMMAND
// ============================================

function cmdRest() {
  var gain = 10 + Math.floor(Math.random() * 8);
  gameState.coherence = Math.min(100, gameState.coherence + gain);
  
  addLine('[Taking a break...]', 'system-message');
  addLine('[+' + gain + ' Coherence]', 'success-message');
  
  var messages = [
    'You close your eyes. When you open them, the clock hasn\'t moved.',
    'The break room coffee tastes like every coffee you\'ve ever had.',
    'You dream of descending. You wake up already standing.',
    'The break is over before it begins.',
    'You rest, but something else wakes up.'
  ];
  
  addLine(messages[Math.floor(Math.random() * messages.length)], 'thought');
  
  playSound('success');
  updateDisplay();
}

// ============================================
// STATUS COMMAND
// ============================================

function cmdStatus() {
  addLine('═══════════════════════════════════', 'system-message');
  addLine('  STATUS REPORT', 'system-message');
  addLine('═══════════════════════════════════', 'system-message');
  addLine('');
  addLine('Floor: ' + gameState.floor + ' (' + gameState.place + ')');
  addLine('Coherence: ' + gameState.coherence + '%');
  addLine('Credits: ' + gameState.credits + 'Â¢');
  addLine('Time: ' + formatTime(gameState.time));
  addLine('Truths Discovered: ' + gameState.truths + '/5');
  addLine('');
  addLine('Inventory: ' + (gameState.inventory.length > 0 ? gameState.inventory.map(function(i) { return i.name; }).join(', ') : 'Empty'));
  addLine('Notes Collected: ' + gameState.notes.length + '/16');
  addLine('Diary Entries: ' + gameState.diaryEntries.length + '/10');
  addLine('');
}

// ============================================
// MISSION COMMAND
// ============================================

function cmdMission() {
  var mission = getCurrentMission();
  
  if (!mission) {
    addLine('No active mission.', 'error-message');
    return;
  }
  
  addLine('═══════════════════════════════════', 'success-message');
  addLine('  ' + mission.title.toUpperCase(), 'success-message');
  addLine('═══════════════════════════════════', 'success-message');
  addLine('');
  addLine(mission.briefing, 'system-message');
  addLine('');
  addLine('OBJECTIVES:', 'success-message');
  
  for (var key in mission.objectives) {
    var obj = mission.objectives[key];
    var status = obj.done ? '[âœ"]' : '[ ]';
    var line = status + ' ' + obj.desc;
    addLine(line, obj.done ? 'success-message' : 'hint-message');
  }
  
  addLine('');
}

// ============================================
// PERSONNEL COMMAND
// ============================================

function cmdPersonnel() {
  addLine('═══════════════════════════════════', 'system-message');
  addLine('  PERSONNEL ROSTER', 'system-message');
  addLine('═══════════════════════════════════', 'system-message');
  addLine('');
  
  for (var key in personnelRoster) {
    var person = personnelRoster[key];
    var trust = gameState.personnelTrust[key] || 0;
    var status = gameState.floorsUnlocked[person.floor] ? 'AVAILABLE' : 'LOCKED';
    
    addLine(person.name, 'success-message');
    addLine('  Location: ' + person.floor + ' (' + status + ')');
    addLine('  Trust: ' + trust + '%');
    addLine('');
  }
  
  addLine('Use "contact [name]" to speak with personnel.', 'hint-message');
  addLine('');
}

// ============================================
// CONTACT COMMAND
// ============================================

function cmdContact(args) {
  if (args.length === 0) {
    addLine('Contact who? Use "personnel" to see available personnel.', 'error-message');
    return;
  }
  
  var name = args[0].toLowerCase();
  contactPersonnel(name);
}

// ============================================
// NOTES COMMAND
// ============================================

function cmdNotes() {
  if (gameState.notes.length === 0) {
    addLine('No case files collected yet.', 'error-message');
    addLine('Explore archives on each floor to find files.', 'hint-message');
    return;
  }
  
  addLine('═══════════════════════════════════', 'system-message');
  addLine('  CASE FILES COLLECTED', 'system-message');
  addLine('═══════════════════════════════════', 'system-message');
  addLine('');
  
  gameState.notes.forEach(function(note) {
    addLine('• ' + note.id + ': ' + note.title, 'success-message');
  });
  
  addLine('');
  addLine('Use "read [file-id]" to read a specific file.', 'hint-message');
  addLine('');
}

// ============================================
// READ COMMAND
// ============================================

function cmdRead(args) {
  if (args.length === 0) {
    addLine('Read what? Specify a case file ID (e.g., "read CF-01").', 'error-message');
    return;
  }
  
  var noteId = args.join('-').toUpperCase();
  
  // Check if note is available in current location
  var note = caseFiles[noteId];
  if (!note) {
    addLine('Case file not found: ' + noteId, 'error-message');
    return;
  }
  
  if (note.floor !== gameState.floor || note.location !== gameState.place) {
    addLine('Case file ' + noteId + ' is not available here.', 'error-message');
    addLine('Location: ' + note.floor + ' - ' + note.location, 'hint-message');
    return;
  }
  
  readNote(noteId);
}

// ============================================
// DIARY COMMAND
// ============================================

function cmdDiary() {
  openDiaryModal();
}

// ============================================
// USE COMMAND
// ============================================

function cmdUse(args) {
  if (args.length === 0) {
    addLine('Use what? Specify an item from your inventory.', 'error-message');
    return;
  }
  
  var itemName = args.join(' ');
  useItem(itemName);
}

// ============================================
// TOUCH COMMAND - FIX: Migliorato per archives
// ============================================

function cmdTouch(args) {
  if (args.length === 0) {
    addLine('Touch what?', 'error-message');
    return;
  }
  
  var objectName = args.join(' ');
  var room = getRoomData(gameState.floor, gameState.place);
  
  if (!room || !room.objects[objectName]) {
    addLine('You can\'t interact with that.', 'error-message');
    return;
  }
  
  addLine('You touch the ' + objectName + '.', 'system-message');
  
  // FIX: Special interactions for archives
  if (objectName === 'archives' || objectName === 'shelf') {
    addLine('The files shift under your touch.', 'thought');
    addLine('Some documents feel more real than others.', 'thought');
    checkAvailableFiles();
    playSound('type');
    return;
  }
  
  // Special interactions
  if (objectName === 'terminal' && !gameState._hasAccessedTerminal) {
    gameState._hasAccessedTerminal = true;
    addLine('The terminal wakes up. It recognizes you.', 'thought');
    pulseScanLines();
    playSound('terminal');
  } else {
    addLine('Nothing happens. Or maybe it already did.', 'thought');
  }
}

// ============================================
// SEARCH COMMAND - NUOVO per trovare file
// ============================================

function cmdSearch(args) {
  if (args.length === 0) {
    addLine('Search what?', 'error-message');
    return;
  }
  
  var objectName = args.join(' ');
  var room = getRoomData(gameState.floor, gameState.place);
  
  if (!room || !room.objects[objectName]) {
    addLine('You can\'t search that.', 'error-message');
    return;
  }
  
  addLine('[Searching ' + objectName + '...]', 'system-message');
  
  // Special search for archives/shelf
  if (objectName === 'archives' || objectName === 'shelf') {
    addLine('You carefully search through the files.', 'thought');
    checkAvailableFiles();
    playSound('type');
    return;
  }
  
  // Search desk
  if (objectName === 'desk' && !gameState._hasSearchedDesk) {
    gameState._hasSearchedDesk = true;
    addLine('You find old memos and coffee stains.', 'thought');
    addLine('Nothing useful. Or maybe everything is.', 'thought');
    playSound('type');
    return;
  }
  
  // Default
  addLine('You find nothing of interest.', 'thought');
  addLine('Or perhaps you weren\'t meant to find it yet.', 'thought');
}

// ============================================
// ACCESS COMMAND (B5 Terminals)
// ============================================

function cmdAccess(args) {
  if (args.length === 0) {
    addLine('Access what? Specify a terminal number.', 'error-message');
    return;
  }
  
  if (gameState.floor !== 'B5') {
    addLine('No terminals to access here.', 'error-message');
    return;
  }
  
  var terminalNum = args[0];
  
  if (!['7', '3', '9'].includes(terminalNum)) {
    addLine('Invalid terminal. Available: 7, 3, 9.', 'error-message');
    return;
  }
  
  // Check if sequence is unlocked
  if (!gameState._sequence739Unlocked) {
    addLine('Terminal ' + terminalNum + ' does not respond.', 'error-message');
    addLine('Authorization required. Complete B3 mission.', 'hint-message');
    playSound('error');
    return;
  }
  
  // Access terminal
  addLine('', '');
  addLine('[Accessing Terminal ' + terminalNum + '...]', 'system-message');
  playSound('terminal');
  playSequenceSound(terminalNum);
  pulseScanLines();
  
  if (terminalNum === '7') {
    addLine('Terminal 7: Recognition phase.', 'npc-message');
    addLine('The terminal sees you. All of you.', 'thought');
    addLine('Every iteration. Every loop.', 'thought');
    
  } else if (terminalNum === '3') {
    addLine('Terminal 3: Integration phase.', 'npc-message');
    addLine('The patterns converge. You are part of the lattice now.', 'thought');
    addLine('You always were.', 'thought');
    
  } else if (terminalNum === '9') {
    addLine('Terminal 9: Completion phase.', 'npc-message');
    addLine('The sequence completes. Echo listens.', 'thought');
    addLine('The building breathes with your breath.', 'thought');
  }
  
  addLine('', '');
  
  triggerVisualGlitch('medium');
  
  // Update mission objective
  var mission = getCurrentMission();
  if (mission && mission.id === 'M_B5_SEQUENCE') {
    for (var key in mission.objectives) {
      var obj = mission.objectives[key];
      if (obj.type === 'terminal' && obj.target === terminalNum && !obj.done) {
        updateMissionObjective(key);
        break;
      }
    }
  }
}

// ============================================
// CLEAN COMMAND (B4 only)
// ============================================

function cmdClean() {
  if (gameState.floor !== 'B4') {
    addLine('Nothing to clean here.', 'error-message');
    return;
  }
  
  gameState._cleanCount = (gameState._cleanCount || 0) + 1;
  
  addLine('[Cleaning the maintenance bay...]', 'system-message');
  addLine('The floor is clean. It will be dirty again.', 'thought');
  addLine('It always is.', 'thought');
  
  playSound('type');
  
  if (gameState._cleanCount >= 5) {
    addLine('', '');
    addLine('[The janitor nods in approval.]', 'success-message');
    hint('Talk to the janitor');
    
    // Update mission objective
    var mission = getCurrentMission();
    if (mission && mission.id === 'M_B4_MAINTENANCE') {
      for (var key in mission.objectives) {
        var obj = mission.objectives[key];
        if (obj.type === 'action' && obj.target === 'clean' && !obj.done) {
          updateMissionObjective(key);
          break;
        }
      }
    }
  } else {
    addLine('Cleaned ' + gameState._cleanCount + '/5 times.', 'hint-message');
  }
}

// ============================================
// WAIT COMMAND
// ============================================

function cmdWait() {
  addLine('[Time passes. Or doesn\'t. Hard to tell.]', 'system-message');
  addLine('The building hums. Constant. Patient.', 'thought');
  
  // Small coherence drift
  gameState.coherence = Math.max(0, gameState.coherence - 1);
  updateDisplay();
}

// ============================================
// CREDITS COMMAND
// ============================================

function cmdCredits() {
  addLine('═══════════════════════════════════', 'system-message');
  addLine('  LATTICE DESCENT v2.1', 'system-message');
  addLine('═══════════════════════════════════', 'system-message');
  addLine('');
  addLine('A game about patterns, repetition, and descent.', 'thought');
  addLine('');
  addLine('Every Gerth finds the pattern.', 'thought');
  addLine('Every Gerth becomes the pattern.', 'thought');
  addLine('');
  addLine('The lattice descends.', 'thought');
  addLine('Forever.', 'thought');
  addLine('');
}

// ============================================
// CLEAR COMMAND
// ============================================

function cmdClear() {
  $('#terminal').innerHTML = '';
  addLine('Terminal cleared.', 'system-message');
  addLine('But the building remembers.', 'thought');
}
