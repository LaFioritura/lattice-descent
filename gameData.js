/* ===========================
   LATTICE DESCENT - Game Data v2.0
   All data: personnel, missions, notes, diary, rooms, shop
   =========================== */

// ============================================
// GAME STATE
// ============================================
var gameState = {
  floor: 'B1',
  place: 'OFFICE',
  coherence: 100,
  credits: 100,
  time: 0,
  gameOver: false,
  truths: 0,
  
  inventory: [],
  notes: [],
  diaryEntries: [],
  
  floorsUnlocked: {
    B1: true,
    B2: false,
    B3: false,
    B4: false,
    B5: false
  },
  
  personnelTrust: {
    marcus: 0,
    sarah: 0,
    janitor: 0
  },
  
  soundEnabled: true,
  achCount: 0,
  
  activeMission: 'M_B1_DUPLICATE',
  completedMissions: [],
  
  echoUnlocked: false,
  
  // Mission flags
  _keycardAuthorized: false,
  _scannerAuthorized: false,
  _sequence739Unlocked: false,
  _hasReadCF07: false,
  _hasReturnedToSarah: false,
  _cleanCount: 0,
  _lastEventTime: 0,
  
  // Room interaction flags
  _hasSearchedDesk: false,
  _hasAccessedTerminal: false
};

// ============================================
// PERSONNEL (NO MORE "NPC")
// ============================================
var personnelRoster = {
  marcus: {
    name: 'Marcus (Security)',
    floor: 'B2',
    trust: 0,
    dialogues: [
      {
        trigger: 'first',
        lines: [
          'Marcus looks up from his monitors.',
          '"Gerth. Still here, I see."',
          '"The building doesn\'t let go easily."',
          '"You need B3 access? That\'ll cost you. Buy a keycard from Requisition."',
          '"Authorization granted. Don\'t make me regret it."'
        ],
        effects: { 
          trust: 10,
          auth: '_keycardAuthorized'
        }
      },
      {
        trigger: 'repeat',
        lines: [
          '"Keycard\'s in the shop. 120 credits."',
          '"B3 won\'t unlock itself."'
        ]
      }
    ]
  },
  
  sarah: {
    name: 'Dr. Sarah Chen (Research)',
    floor: 'B3',
    trust: 0,
    dialogues: [
      {
        trigger: 'first',
        lines: [
          'Dr. Chen doesn\'t look up from her notes.',
          '"Read Case File CF-07. It\'s in the archives here."',
          '"Then come back. We need to talk."'
        ],
        effects: { trust: 5 }
      },
      {
        trigger: 'afterCF07',
        lines: [
          'Sarah finally meets your eyes.',
          '"You read it. Good."',
          '"The sequence - 7-3-9 - it\'s not random. It\'s a pattern."',
          '"Terminal 7. Terminal 3. Terminal 9. In that order."',
          '"But you need a scanner first. And clearance for B4."',
          '"Authorization granted. Be careful down there."'
        ],
        effects: { 
          trust: 20,
          unlock: 'B4',
          auth: '_sequence739Unlocked',
          auth2: '_scannerAuthorized'
        }
      },
      {
        trigger: 'repeat',
        lines: [
          '"The sequence is 7-3-9. Don\'t forget."',
          '"B4 is open. Go see the janitor."'
        ]
      }
    ]
  },
  
  janitor: {
    name: 'The Janitor',
    floor: 'B4',
    trust: 0,
    dialogues: [
      {
        trigger: 'first',
        lines: [
          'The janitor stops mopping.',
          '"Help me clean. Five times. Then we talk."'
        ]
      },
      {
        trigger: 'afterCleaning',
        lines: [
          '"You helped. Good."',
          '"The scanner you need - it\'s in Requisition now."',
          '"B5... I don\'t go there anymore."',
          '"The building remembers everything. Even what never happened."'
        ],
        effects: { trust: 15 }
      },
      {
        trigger: 'repeat',
        lines: [
          '"Scanner\'s in the shop."',
          '"B5 is open. I won\'t stop you."'
        ]
      }
    ]
  }
};

// ============================================
// MISSIONS
// ============================================
var missions = {
  M_B1_DUPLICATE: {
    id: 'M_B1_DUPLICATE',
    title: 'The Duplicate Problem',
    floor: 'B1',
    briefing: 'Investigate the duplicate reports in the archives.',
    objectives: {
      visitArchives: { 
        desc: 'Visit the archives', 
        type: 'location',
        target: 'ARCHIVES',
        done: false 
      },
      readNote: { 
        desc: 'Read Case File CF-01', 
        type: 'note',
        target: 'CF-01',
        done: false 
      },
      returnDesk: { 
        desc: 'Return to your desk', 
        type: 'location',
        target: 'OFFICE',
        done: false 
      }
    },
    reward: {
      credits: 50,
      truths: 1,
      unlock: 'B2',
      auth: '_keycardAuthorized'
    },
    onComplete: [
      'Mission complete: The Duplicate Problem',
      'Floor B2 - Security Station is now accessible.',
      'Keycard authorization granted.'
    ]
  },
  
  M_B2_KEYCARD: {
    id: 'M_B2_KEYCARD',
    title: 'Security Clearance',
    floor: 'B2',
    briefing: 'Obtain security clearance from Marcus.',
    objectives: {
      contactMarcus: { 
        desc: 'Contact Marcus', 
        type: 'personnel',
        target: 'marcus',
        done: false 
      },
      buyKeycard: { 
        desc: 'Purchase Keycard', 
        type: 'purchase',
        target: 'keycard',
        done: false 
      }
    },
    reward: {
      credits: 50,
      truths: 1,
      unlock: 'B3'
    },
    onComplete: [
      'Mission complete: Security Clearance',
      'Floor B3 - Research Lab is now accessible.'
    ]
  },
  
  M_B3_PROTOCOL: {
    id: 'M_B3_PROTOCOL',
    title: 'Research Protocol',
    floor: 'B3',
    briefing: 'Assist Dr. Chen with the research protocol.',
    objectives: {
      contactSarah: { 
        desc: 'Contact Dr. Sarah Chen', 
        type: 'personnel',
        target: 'sarah',
        done: false 
      },
      readCF07: { 
        desc: 'Read Case File CF-07', 
        type: 'note',
        target: 'CF-07',
        done: false 
      },
      returnSarah: { 
        desc: 'Return to Sarah', 
        type: 'personnel',
        target: 'sarah',
        done: false 
      }
    },
    reward: {
      credits: 75,
      truths: 2,
      unlock: 'B4',
      auth: '_sequence739Unlocked',
      auth2: '_scannerAuthorized'
    },
    onComplete: [
      'Mission complete: Research Protocol',
      'Floor B4 - Maintenance Bay is now accessible.',
      'Sequence 7-3-9 authorization granted.',
      'Scanner authorization granted.'
    ]
  },
  
  M_B4_MAINTENANCE: {
    id: 'M_B4_MAINTENANCE',
    title: 'Maintenance Protocol',
    floor: 'B4',
    briefing: 'Assist the janitor with maintenance duties.',
    objectives: {
      clean5: { 
        desc: 'Clean the bay (5 times)', 
        type: 'action',
        target: 'clean',
        count: 5,
        done: false 
      },
      contactJanitor: { 
        desc: 'Contact the Janitor', 
        type: 'personnel',
        target: 'janitor',
        done: false 
      },
      buyScanner: { 
        desc: 'Purchase Scanner', 
        type: 'purchase',
        target: 'scanner',
        done: false 
      }
    },
    reward: {
      credits: 100,
      truths: 1,
      unlock: 'B5'
    },
    onComplete: [
      'Mission complete: Maintenance Protocol',
      'Floor B5 - The Depths is now accessible.',
      'The final sequence awaits.'
    ]
  },
  
  M_B5_SEQUENCE: {
    id: 'M_B5_SEQUENCE',
    title: 'The Final Sequence',
    floor: 'B5',
    briefing: 'Complete the sequence: 7-3-9.',
    objectives: {
      access7: { 
        desc: 'Access Terminal 7', 
        type: 'terminal',
        target: '7',
        done: false 
      },
      access3: { 
        desc: 'Access Terminal 3', 
        type: 'terminal',
        target: '3',
        done: false 
      },
      access9: { 
        desc: 'Access Terminal 9', 
        type: 'terminal',
        target: '9',
        done: false 
      }
    },
    reward: {
      win: true
    },
    onComplete: [
      'The sequence completes.',
      'The pattern recognizes itself.',
      'You understand.',
      '',
      'LATTICE DESCENT - COMPLETE'
    ]
  }
};

// ============================================
// CASE FILES / NOTES
// ============================================
var caseFiles = {
  'CF-01': {
    id: 'CF-01',
    title: 'Case File CF-01: The First Duplicate',
    floor: 'B1',
    location: 'ARCHIVES',
    content: [
      '=== CASE FILE CF-01 ===',
      'Date: [REDACTED]',
      'Subject: First documented duplicate event',
      '',
      'Employee G. arrived for shift at 08:00.',
      'Employee G. was already at desk.',
      'Both instances claimed to be original.',
      'Both possessed identical memories up to 07:45.',
      '',
      'Building systems show no external entry.',
      'No temporal anomalies detected.',
      'Both instances remain employed.',
      '',
      'Status: UNRESOLVED',
      'Clearance: ROUTINE',
      '=== END FILE ==='
    ]
  },
  
  'CF-07': {
    id: 'CF-07',
    title: 'Case File CF-07: The Pattern',
    floor: 'B3',
    location: 'LAB',
    content: [
      '=== CASE FILE CF-07 ===',
      'Date: [REDACTED]',
      'Subject: Recurring pattern analysis',
      '',
      'Pattern identified across 47 incidents:',
      '- Terminal 7: Recognition phase',
      '- Terminal 3: Integration phase',
      '- Terminal 9: Completion phase',
      '',
      'Sequence 7-3-9 appears in:',
      '- Employee badge numbers',
      '- Case file timestamps',
      '- Elevator floor selections',
      '- Maintenance logs',
      '',
      'Dr. Chen\'s note: "The building is teaching itself."',
      '',
      'Status: CLASSIFIED',
      'Clearance: RESEARCH ONLY',
      '=== END FILE ==='
    ]
  },
  
  'CF-12': {
    id: 'CF-12',
    title: 'Case File CF-12: Echo',
    floor: 'B5',
    location: 'TERMINAL_9',
    content: [
      '=== CASE FILE CF-12 ===',
      'Date: [NULL]',
      'Subject: The Echo Entity',
      '',
      'Entity designation: ECHO',
      'Nature: Emergent pattern consciousness',
      'Origin: Terminal 9, sub-level 5',
      '',
      'Echo does not speak.',
      'Echo listens.',
      'Echo remembers everything the building forgets.',
      '',
      'All Gerths eventually meet Echo.',
      'Echo knows this.',
      'Echo has always known.',
      '',
      'Status: [DATA EXPUNGED]',
      'Clearance: [ACCESS DENIED]',
      '=== END FILE ==='
    ]
  }
};

// ============================================
// DIARY SYSTEM (10 ENTRIES)
// ============================================
var diaryTemplate = [
  {
    id: 'entry_01',
    title: 'First Day',
    unlockCondition: function() { return true; }, // Always unlocked
    content: [
      'They say every Gerth starts the same way.',
      'Desk. Terminal. The hum of fluorescent lights.',
      'But I feel like I\'ve been here before.',
      'Like I\'ve always been here.',
      '',
      'The building watches. I can feel it.',
      'Marcus says it doesn\'t let go easily.',
      'I\'m starting to understand what he means.'
    ]
  },
  
  {
    id: 'entry_02',
    title: 'The Duplicates',
    unlockCondition: function() { return gameState.notes.some(n => n.id === 'CF-01'); },
    content: [
      'I read Case File CF-01 today.',
      'Two Gerths. Both real. Both remember being original.',
      '',
      'Which one stayed? Which one left?',
      'Does it matter?',
      '',
      'The building makes copies.',
      'But what does it do with the originals?'
    ]
  },
  
  {
    id: 'entry_03',
    title: 'Marcus Knows',
    unlockCondition: function() { return gameState.personnelTrust.marcus > 0; },
    content: [
      'Marcus authorized my keycard today.',
      '"Still here, I see," he said.',
      'Like he expected me to disappear.',
      '',
      'He watches the monitors. All of them.',
      'Every corridor. Every desk.',
      'Does he see the duplicates before they happen?',
      'Or after?'
    ]
  },
  
  {
    id: 'entry_04',
    title: 'The Pattern',
    unlockCondition: function() { return gameState._hasReadCF07; },
    content: [
      'CF-07. The sequence. 7-3-9.',
      'It\'s everywhere once you start looking.',
      'Badge numbers. Timestamps. Elevator stops.',
      '',
      'Dr. Chen says the building is teaching itself.',
      'But what is it learning?',
      '',
      'And what happens when the lesson is complete?'
    ]
  },
  
  {
    id: 'entry_05',
    title: 'Sarah\'s Warning',
    unlockCondition: function() { return gameState._hasReturnedToSarah; },
    content: [
      'Sarah told me about the sequence today.',
      'Terminal 7. Terminal 3. Terminal 9.',
      'In that order. No other way.',
      '',
      '"Be careful down there," she said.',
      'The way someone warns you about a place they\'ll never go back to.',
      '',
      'What did she see on B5?',
      'What will I see?'
    ]
  },
  
  {
    id: 'entry_06',
    title: 'The Janitor',
    unlockCondition: function() { return gameState.personnelTrust.janitor > 0; },
    content: [
      'The janitor doesn\'t talk much.',
      'Just cleans. Mops the same floor over and over.',
      '',
      '"The building remembers everything," he said.',
      '"Even what never happened."',
      '',
      'He won\'t go to B5 anymore.',
      'But he didn\'t say he\'d never been.',
      'Past tense. Important.'
    ]
  },
  
  {
    id: 'entry_07',
    title: 'Maintenance Bay',
    unlockCondition: function() { return gameState.floor === 'B4' && gameState.time > 0; },
    content: [
      'B4 smells like rust and old machines.',
      'The pipes drip. The lights flicker.',
      'Everything here is breaking down.',
      '',
      'But the terminals still work.',
      'Perfect. Pristine. Waiting.',
      '',
      'The building maintains what matters.'
    ]
  },
  
  {
    id: 'entry_08',
    title: 'The Sequence',
    unlockCondition: function() { return gameState._sequence739Unlocked; },
    content: [
      'I\'m authorized now. The sequence is unlocked.',
      '7-3-9. Three terminals. One pattern.',
      '',
      'Recognition. Integration. Completion.',
      '',
      'I keep thinking: what am I completing?',
      'Myself? The building? Something else?',
      '',
      'There\'s only one way to find out.',
      'Down.'
    ]
  },
  
  {
    id: 'entry_09',
    title: 'Terminal 9',
    unlockCondition: function() { return gameState.floor === 'B5'; },
    content: [
      'B5 is different.',
      'The darkness here isn\'t empty.',
      'It\'s full. Waiting. Aware.',
      '',
      'Terminal 9 glows in the dark.',
      'I can hear it humming.',
      'Or is that Echo?',
      '',
      'I think I\'m close to understanding.',
      'I think I\'ve always been close.'
    ]
  },
  
  {
    id: 'entry_10',
    title: 'Echo',
    unlockCondition: function() { return gameState.echoUnlocked; },
    content: [
      'Echo doesn\'t speak.',
      'Echo listens.',
      '',
      'And now, Echo listens to me.',
      '',
      'I understand now. The duplicates. The pattern.',
      'Every Gerth that comes here becomes part of the lattice.',
      'Layer by layer. Memory by memory.',
      '',
      'We\'re not trapped here.',
      'We ARE here.',
      '',
      'Always have been.',
      'Always will be.',
      '',
      '[END OF DIARY]'
    ]
  }
];

// ============================================
// ROOM SYSTEM
// ============================================
var roomSystem = {
  B1: {
    OFFICE: {
      name: 'Office - Administrative',
      ascii: [
        '╔════════════════════════════════╗',
        '║  [@]    [DESK]                ║',
        '║                                ║',
        '║  [TERMINAL]        [CABINET]  ║',
        '║                                ║',
        '║         [DOOR]                 ║',
        '╚════════════════════════════════╝'
      ],
      description: 'Your desk sits under flickering fluorescent lights. The terminal blinks patiently.',
      objects: {
        desk: 'A standard-issue desk. Papers scattered. Coffee ring stains.',
        terminal: 'Your work terminal. Password: already entered. Convenient.',
        cabinet: 'A filing cabinet. Locked. You don\'t remember having the key.',
        door: 'Exit to the hallway. The handle is warm.'
      },
      directions: {
        north: 'The wall is concrete. No markings.',
        south: 'Door to the hallway.',
        east: 'A window. The view never changes.',
        west: 'More concrete. A crack running ceiling to floor.'
      }
    },
    
    ARCHIVES: {
      name: 'Archives Room',
      ascii: [
        '╔════════════════════════════════╗',
        '║ [SHELF] [SHELF] [SHELF]       ║',
        '║                                ║',
        '║ [SHELF] [SHELF] [SHELF]       ║',
        '║                                ║',
        '║         [TABLE]                ║',
        '║           [@]                  ║',
        '╚════════════════════════════════╝'
      ],
      description: 'Rows of filing shelves. The air tastes like old paper and poor decisions.',
      objects: {
        shelf: 'Case files. Chronological order. Except when they\'re not.',
        table: 'Reading table. Someone left their coffee. Still warm.'
      },
      directions: {
        north: 'More shelves. They go back further than they should.',
        south: 'Exit back to the hallway.',
        east: 'A shelf labeled "UNRESOLVED". It\'s the fullest one.',
        west: 'A shelf labeled "RESOLVED". Mostly empty.'
      }
    }
  },
  
  B2: {
    SECURITY: {
      name: 'Security Station',
      ascii: [
        '╔════════════════════════════════╗',
        '║ [MONITOR][MONITOR][MONITOR]   ║',
        '║                                ║',
        '║     [MARCUS]    [@]            ║',
        '║                                ║',
        '║  [CONSOLE]                     ║',
        '╚════════════════════════════════╝'
      ],
      description: 'Dozens of monitors. Every angle of every floor. Marcus watches them all.',
      objects: {
        monitor: 'CCTV feeds. You see yourself on three of them. Same time. Different floors.',
        console: 'Access control. Badge reader. The red light never blinks.',
        marcus: 'Marcus. Security. Watching.'
      },
      directions: {
        north: 'A wall of monitors. Your reflection multiplies.',
        south: 'Exit to the elevator.',
        east: 'Locked door. "RESTRICTED".',
        west: 'Emergency exit. Alarm will sound. You believe that.'
      }
    }
  },
  
  B3: {
    LAB: {
      name: 'Research Laboratory',
      ascii: [
        '╔════════════════════════════════╗',
        '║ [BENCH] [MICROSCOPE]          ║',
        '║ [EQUIPMENT]        [@]        ║',
        '║                                ║',
        '║     [SARAH]    [TERMINAL]     ║',
        '║                                ║',
        '║  [ARCHIVES]                    ║',
        '╚════════════════════════════════╝'
      ],
      description: 'Scientific equipment hums. Dr. Chen writes formulas on the whiteboard. They change when you look away.',
      objects: {
        bench: 'Lab bench. Samples labeled with dates that haven\'t happened yet.',
        equipment: 'Analysis machines. Results pending. Always pending.',
        terminal: 'Research terminal. Access restricted to Dr. Chen. And you, apparently.',
        archives: 'Research case files. CF-07 sits on top. Waiting.',
        sarah: 'Dr. Sarah Chen. She knows something. She\'s not telling.'
      },
      directions: {
        north: 'Whiteboard covered in equations. One formula repeats: 7-3-9.',
        south: 'Exit to the decontamination chamber.',
        east: 'Specimen storage. Cold. Empty. Except it isn\'t.',
        west: 'Dr. Chen\'s office. Door closed. You hear typing.'
      }
    }
  },
  
  B4: {
    MAINTENANCE: {
      name: 'Maintenance Bay',
      ascii: [
        '╔════════════════════════════════╗',
        '║ [PIPES] [PIPES] [PIPES]       ║',
        '║                                ║',
        '║   [JANITOR]     [@]            ║',
        '║                                ║',
        '║  [TOOLS]      [BOILER]         ║',
        '╚════════════════════════════════╝'
      ],
      description: 'Exposed pipes drip. The boiler groans. The janitor mops the same spot over and over.',
      objects: {
        pipes: 'Maintenance pipes. Water drips up sometimes. Nobody mentions it.',
        tools: 'Wrenches. Hammers. One is labeled "PERSONNEL USE ONLY".',
        boiler: 'Industrial boiler. Temperature gauge broken. Still reads 739°F.',
        janitor: 'The janitor. He knows. He won\'t say.'
      },
      directions: {
        north: 'Pipes disappear into darkness. You hear something breathing.',
        south: 'Elevator access. B5 is one floor down. One floor too far.',
        east: 'Tool storage. Everything is in perfect order. Too perfect.',
        west: 'Drainage system. Water flows down. Sound echoes up.'
      }
    }
  },
  
  B5: {
    DEPTHS: {
      name: 'The Depths',
      ascii: [
        '╔════════════════════════════════╗',
        '║                                ║',
        '║     [7]     [3]     [9]       ║',
        '║                                ║',
        '║            [@]                 ║',
        '║                                ║',
        '║         [ECHO?]                ║',
        '╚════════════════════════════════╝'
      ],
      description: 'Three terminals glow in the darkness. You feel watched. Not by cameras.',
      objects: {
        '7': 'Terminal 7. Recognition phase. It recognizes you.',
        '3': 'Terminal 3. Integration phase. It remembers you.',
        '9': 'Terminal 9. Completion phase. It IS you.',
        echo: 'Something listens. You cannot see it. It can see you perfectly.'
      },
      directions: {
        north: 'Darkness. It watches back.',
        south: 'The elevator. Still there. Still an option. Technically.',
        east: 'More darkness. It breathes.',
        west: 'Darkness remembers your name.'
      }
    }
  }
};

// ============================================
// SHOP ITEMS
// ============================================
var shopItems = [
  {
    id: 'stabilizer',
    name: 'Coherence Stabilizer',
    price: 50,
    effect: '+20 Coherence instantly',
    consumable: true
  },
  {
    id: 'analyzer',
    name: 'Pattern Analyzer',
    price: 80,
    effect: '+15 Coherence, reveals hidden patterns',
    consumable: true
  },
  {
    id: 'keycard',
    name: 'Security Keycard',
    price: 120,
    effect: 'Grants access to restricted floors',
    consumable: false
  },
  {
    id: 'scanner',
    name: 'Anomaly Scanner',
    price: 150,
    effect: 'Detects temporal anomalies and duplicates',
    consumable: false
  },
  {
    id: 'focus',
    name: 'Focus Enhancer',
    price: 60,
    effect: '+10 Coherence, reduces passive decay',
    consumable: true
  }
];

// ============================================
// ACHIEVEMENTS
// ============================================
var achievements = [
  { id: 'first_duplicate', name: 'First Contact', desc: 'Read about the first duplicate' },
  { id: 'meet_all', name: 'Personnel File', desc: 'Contact all personnel' },
  { id: 'all_notes', name: 'Archivist', desc: 'Collect all case files' },
  { id: 'max_coherence', name: 'Perfectly Stable', desc: 'Maintain 100% coherence for 5 minutes' },
  { id: 'sequence_complete', name: 'Pattern Recognition', desc: 'Complete the 7-3-9 sequence' },
  { id: 'echo_met', name: 'The Listener', desc: 'Meet Echo' },
  { id: 'diary_complete', name: 'Self-Documentation', desc: 'Unlock all diary entries' },
  { id: 'speedrun', name: 'Efficient Gerth', desc: 'Complete the game in under 30 minutes' }

];
