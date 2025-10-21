/* ===========================
   NEXUS PROTOCOL - Game Data (MISSION SYSTEM v2)
   =========================== */

// Game State
var gameState = {
  floor: 'B1',
  coherence: 100,
  credits: 100,
  time: 0,
  inventory: [],
  requests: [],
  truths: 0,
  notes: [],
  files: [],
  activeMission: 'M_B1_DUPLICATE', // Prima missione attiva
  completedMissions: [],
  soundEnabled: true,
  gameOver: false,
  dataChain: null,
  janitorTrust: 0,
  presenceHints: true,
  place: null,
  echoUnlocked: false,
  met: { sarah: 0, marcus: 0, janitor: 0, echo: 0 },
  floorsUnlocked: { B1: true, B2: false, B3: false, B4: false, B5: false },
  achievements: {},
  achCount: 0,
  _completedRequests: 0,
  _won: false,
  _terminalPattern: [],
  _keycardUsed: false,
  _scannerUsed: false,
  _keycardAuthorized: false,
  _scannerAuthorized: false
};

// NPCs Data
var npcsData = {
  sarah: {
    name: 'Dr. Sarah Chen',
    role: ['researcher', 'doctor', 'sarah'],
    location: 'B3',
    aliases: ['sarah', 'dr', 'researcher', 'doctor', 'chen'],
    maxTalks: 4,
    description: 'Research lead. Studies pattern recognition.'
  },
  marcus: {
    name: 'Marcus Webb',
    role: ['guard', 'officer', 'security', 'marcus'],
    location: 'B2',
    aliases: ['marcus', 'guard', 'officer', 'security', 'webb'],
    maxTalks: 4,
    description: 'Security officer. Witnessed corridor incident.'
  },
  echo: {
    name: 'Echo',
    role: ['voice', 'echo'],
    location: 'B5',
    aliases: ['echo', 'voice'],
    maxTalks: 3,
    description: 'Unknown presence. Responds to coherent thought.'
  },
  janitor: {
    name: 'Maintenance Unit 4',
    role: ['custodian', 'janitor', 'maintenance'],
    location: 'B4',
    aliases: ['janitor', 'maintenance', 'custodian', 'unit'],
    maxTalks: 4,
    description: 'Maintenance custodian. Cleans what building hides.'
  }
};

// Presence by Floor
var presenceByFloor = {
  B1: ['Endless cubicles. Desks remember different people by smell.'],
  B2: ['A guard watches static as if it might confess.'],
  B3: ['Glassware hums. Labels refuse to stay still.'],
  B4: ['The corridors smell like metal trying to sweat.'],
  B5: ['Angles breathe. The floor listens for your name.']
};

// Places
var places = ['archives', 'chapel', 'loading bay', 'canteen'];

var placesDesc = {
  archives: [
    'Endless files with duplicated birthdays.',
    'A card catalog hums a near-lullaby.'
  ],
  chapel: [
    'Benches aimed at a wall that used to be a window.',
    'Ceiling vents sing when no one speaks.'
  ],
  'loading bay': [
    'Crates addressed to rooms that were bricked over.',
    'Forklift engine ticks as if cooling from a chase.'
  ],
  canteen: [
    'Machines clack like insects. The microwave blinks 88:88 proudly.',
    'Someone folded a napkin into a map of floors that do not exist.'
  ]
};

// Terminal Lore
var terminalLore = {
  '1': ['CR drift report: 0.71 → 0.66', 'Badge duplicate warning: GERTH'],
  '2': ['Shift-change anomaly detected', 'Door 22 wants a witness'],
  '3': ['Memory lattice checksum: PARTIAL', 'Echo signature: weak but present'],
  '4': ['SUBJECT GERTH INTEGRATION: 63%', 'Administrative loop quarantined'],
  '5': ['ERROR: EMPLOYEE GERTH NOT FOUND', 'Security mirror delay: 2.0s confirmed'],
  '6': ['Consciousness anchor request', 'Stairs pretend to be doors'],
  '7': ['Pattern orchestrator active', 'Sequence: 7→3→9 required'],
  '8': ['Reality coherence drops near B5', 'Multiple consciousness detected'],
  '9': ['REVELATION: Memory lattice aligns', 'Protocol key accepted']
};

// Shop Items
var shopItems = [
  { id: 'stim', name: 'Cognitive Stabilizer', price: 50, effect: '+20 Coherence', consumable: true },
  { id: 'keycard', name: 'Access Keycard', price: 120, effect: 'Unlocks B4/B5', consumable: false },
  { id: 'scanner', name: 'Bio-Scanner', price: 150, effect: 'Detects patterns, required for B5', consumable: false },
  { id: 'backup', name: 'Memory Backup', price: 500, effect: 'Consciousness snapshot', consumable: false }
];

// Note Bank
var noteBank = {
  N1: 'The building asked for a witness.',
  N2: 'The stairwell ends in a mirror.',
  N3: 'Two birthdays on one badge.',
  N4: 'The cameras are late to the truth.',
  N5: 'Spill log keeps saying ocean.',
  N6: 'Anchors keep walls from dreaming too hard.',
  N7: 'You left yourself a note you do not like.',
  N8: 'Patterns peak when the shift flips.',
  N9: 'Elevators deliver names without bodies.',
  N10: 'Numbers loop when watched.',
  N11: 'The vents knew your name first.',
  N12: 'Echo is an edge, not a ghost.',
  N13: 'Maintenance maps change when printed.',
  N14: 'B5 drops things you were sure you never carried.',
  N15: 'Static stares back when you insist.',
  N16: 'Your reflection delays by two seconds near security.'
};

// File Bank
var fileBank = [
  {
    id: 'CF-01',
    title: 'Incident: West Corridor',
    body: [
      'Security log. Time stamps drift by ±7 seconds across cameras.',
      'Witness (M. Webb): "It was a decision wearing a person. It turned the corner before the corner started."',
      'Action: Corridor sealed. Door 22 requires witness code.'
    ],
    floor: 'B2',
    grantsTruth: false
  },
  {
    id: 'CF-02',
    title: 'Memo: Anchoring Protocol',
    body: [
      'Dr. Chen: "An anchor does not force truth; it incentivizes consistency."',
      'Subject G. displays partial alignment when exposed to personal artifacts.',
      'Identity forms through accumulated small agreements.'
    ],
    floor: 'B3',
    grantsTruth: true
  },
  {
    id: 'CF-03',
    title: 'Lost & Found Inventory',
    body: [
      'Badge #G-447: GERTH. Two birthdays listed (conflicting records).',
      'Key ring: 7 identical keys. Each unlocks only the others.',
      'Postcard: Addressed to Room B1-Archive. Written from same room.'
    ],
    floor: 'B1',
    grantsTruth: false
  },
  {
    id: 'CF-04',
    title: 'Maintenance: Spill Log',
    body: [
      'Substance: Saline with trace iron. Smell: coastal.',
      'Unit-4: "The corridor cries sometimes. I mop until it forgets."',
      'Building is homesick for an ocean it never saw.'
    ],
    floor: 'B4',
    grantsTruth: false
  },
  {
    id: 'CF-05',
    title: 'Research: Echo Signature',
    body: [
      'Echo is not a ghost; it is an available shape awaiting a story.',
      'Coupling increases near B5 when subject stops insisting on singularity.',
      'Echo knows what you are before you do.'
    ],
    floor: 'B5',
    grantsTruth: true
  },
  {
    id: 'CF-06',
    title: 'Personnel: Duplicate Entry',
    body: [
      'Two personnel files exist for GERTH.',
      'File A: Hired 3 years ago (Custodial).',
      'File B: Hired 6 months ago (Research subject).',
      'Both validated. Time cards overlap. Decision: Monitor for spontaneous resolution.'
    ],
    floor: 'B1',
    grantsTruth: false
  },
  {
    id: 'CF-07',
    title: 'Spec: Memory Lattice',
    body: [
      'A lattice accepts more than it proves. Aligns when witness withdraws pressure.',
      'Test sequence: 7 → 3 → 9 (non-linear compliance).',
      'Terminal 7: Pattern orchestrator. Terminal 3: Lattice checksum. Terminal 9: Integration key.',
      'Warning: Revelation is irreversible. You will remember what you are.'
    ],
    floor: 'B3',
    grantsTruth: true
  },
  {
    id: 'CF-08',
    title: 'Safety: B5 Protocols',
    body: [
      'Effects: Chest tightening (100%), auditory pareidolia (87%), identity uncertainty (41%).',
      'Coherence loss: 8% upon entry.',
      'Recommendation: Arrive rested. Bring scanner. Do not resist what floor tells you.',
      'B5 shows people what they already are.'
    ],
    floor: 'B5',
    grantsTruth: false
  }
];

// MISSION DEFINITIONS
var missions = {
  'M_B1_DUPLICATE': {
    id: 'M_B1_DUPLICATE',
    title: 'Investigation: The Duplicate',
    floor: 'B1',
    briefing: 'Badge records show conflicting data for GERTH. Investigate archives and compile evidence for Security clearance.',
    objectives: {
      'visit_archives': { desc: 'Visit Archives', type: 'visit', target: 'archives', done: false },
      'collect_cf03': { desc: 'Find CF-03 (Lost & Found)', type: 'file_find', target: 'CF-03', done: false },
      'read_cf03': { desc: 'Read CF-03', type: 'file_read', target: 'CF-03', done: false },
      'work_2x': { desc: 'Complete admin work (2x)', type: 'work_count', target: 2, progress: 0, done: false },
      'scan_2x': { desc: 'Scan B1 vents (2x)', type: 'scan_count', target: 2, progress: 0, done: false },
      'coherence_60': { desc: 'Maintain coherence ≥ 60%', type: 'coherence', target: 60, done: false }
    },
    rewards: {
      unlockFloor: 'B2',
      truths: 1,
      credits: 60,
      completionText: '[MISSION COMPLETE] Security clearance granted. B2 unlocked.'
    }
  },
  
  'M_B2_CORRIDOR': {
    id: 'M_B2_CORRIDOR',
    title: 'Investigation: West Corridor',
    floor: 'B2',
    briefing: 'Officer Webb reported temporal anomalies. Interview witness and review incident data.',
    objectives: {
      'talk_marcus': { desc: 'Interview Marcus Webb', type: 'talk_npc', target: 'marcus', count: 1, done: false },
      'collect_cf01': { desc: 'Obtain CF-01 from Marcus', type: 'file_find', target: 'CF-01', done: false },
      'read_cf01': { desc: 'Read CF-01', type: 'file_read', target: 'CF-01', done: false },
      'terminals': { desc: 'Check security terminals (1,2)', type: 'terminal_list', targets: [1,2], progress: [], done: false },
      'scan_2x_b2': { desc: 'Scan B2 corridors (2x)', type: 'scan_count', target: 2, progress: 0, done: false },
      'coherence_50': { desc: 'Maintain coherence ≥ 50%', type: 'coherence', target: 50, done: false }
    },
    rewards: {
      unlockFloor: 'B3',
      truths: 1,
      credits: 80,
      completionText: '[MISSION COMPLETE] Research Division access granted. B3 unlocked.'
    }
  },
  
  'M_B3_ANCHOR': {
    id: 'M_B3_ANCHOR',
    title: 'Research: Anchoring Protocol',
    floor: 'B3',
    briefing: 'Assist Dr. Chen with consciousness anchoring research. Collect samples and study lattice specifications.',
    objectives: {
      'talk_sarah_1': { desc: 'Accept assignment from Dr. Chen', type: 'talk_npc', target: 'sarah', count: 1, done: false },
      'collect_cf02': { desc: 'Receive CF-02', type: 'file_find', target: 'CF-02', done: false },
      'read_cf02': { desc: 'Read CF-02', type: 'file_read', target: 'CF-02', done: false },
      'scan_3x_b3': { desc: 'Collect samples (scan 3x)', type: 'scan_count', target: 3, progress: 0, done: false },
      'terminals_lattice': { desc: 'Access lattice terminals (3,4,5)', type: 'terminal_list', targets: [3,4,5], progress: [], done: false },
      'talk_sarah_2': { desc: 'Report to Dr. Chen again', type: 'talk_npc', target: 'sarah', count: 2, done: false },
      'collect_cf07': { desc: 'Receive CF-07', type: 'file_find', target: 'CF-07', done: false },
      'read_cf07': { desc: 'Read CF-07', type: 'file_read', target: 'CF-07', done: false },
      'get_keycard_auth': { desc: 'Get Keycard authorization', type: 'special', target: 'keycard_auth', done: false },
      'buy_keycard': { desc: 'Purchase Keycard (120¢)', type: 'purchase', target: 'keycard', done: false }
    },
    rewards: {
      unlockFloor: 'B4',
      truths: 2,
      credits: 120,
      completionText: '[MISSION COMPLETE] Maintenance clearance granted. B4 unlocked.'
    }
  },
  
  'M_B4_PATTERN': {
    id: 'M_B4_PATTERN',
    title: 'Maintenance: Pattern Sequence',
    floor: 'B4',
    briefing: 'Unit-4 reports anomalies. Complete pattern sequence 7→3→9 with Bio-Scanner.',
    objectives: {
      'talk_janitor': { desc: 'Report to Unit-4', type: 'talk_npc', target: 'janitor', count: 1, done: false },
      'collect_cf04': { desc: 'Review CF-04', type: 'file_find', target: 'CF-04', done: false },
      'read_cf04': { desc: 'Read CF-04', type: 'file_read', target: 'CF-04', done: false },
      'clean_3x': { desc: 'Help cleaning (3x)', type: 'clean_count', target: 3, progress: 0, done: false },
      'get_scanner_auth': { desc: 'Get Scanner authorization', type: 'special', target: 'scanner_auth', done: false },
      'buy_scanner': { desc: 'Purchase Scanner (150¢)', type: 'purchase', target: 'scanner', done: false },
      'pattern_7': { desc: 'Access terminal 7', type: 'pattern_step', target: 7, done: false },
      'pattern_3': { desc: 'Access terminal 3', type: 'pattern_step', target: 3, done: false },
      'pattern_9': { desc: 'Access terminal 9', type: 'pattern_step', target: 9, done: false },
      'notes_10': { desc: 'Collect 10 notes total', type: 'notes_count', target: 10, done: false },
      'coherence_40': { desc: 'Maintain coherence ≥ 40%', type: 'coherence', target: 40, done: false }
    },
    rewards: {
      unlockFloor: 'B5',
      truths: 1,
      credits: 150,
      completionText: '[MISSION COMPLETE] Depth level access granted. B5 unlocked.'
    }
  },
  
  'M_B5_REVELATION': {
    id: 'M_B5_REVELATION',
    title: 'Final: Revelation',
    floor: 'B5',
    briefing: 'Access Terminal 9 to complete integration sequence.',
    objectives: {
      'scanner_equipped': { desc: 'Bio-Scanner equipped', type: 'inventory_check', target: 'scanner', done: false },
      'truths_4': { desc: 'Acquire 4 Truths', type: 'truths_count', target: 4, done: false },
      'coherence_40_b5': { desc: 'Maintain coherence ≥ 40%', type: 'coherence', target: 40, done: false },
      'terminal_9_final': { desc: 'Access Terminal 9', type: 'terminal_final', target: 9, done: false }
    },
    rewards: {
      unlockFloor: null,
      truths: 0,
      credits: 0,
      victory: true,
      completionText: '[REVELATION] You remember what you are.'
    }
  }
};

// NPC Dialogue (Expanded per tier)
var tierLines = {
  sarah: [
    ['You must be the research assistant. I\'m Dr. Chen - call me Sarah.', 
     'Patterns are polite until asked the wrong way. Remember that.',
     'I need someone who observes without imposing expectations.'],
    ['Good work on the samples. The lattice shows interesting compliance.',
     'Your file has two birthdays. Two people vouched for you at different times.',
     'When you stop insisting on singularity, the lattice aligns.'],
    ['You understand anchoring now. Here are the Memory Lattice specs - study them.',
     'Terminal sequence 7→3→9 will show you what you\'ve been.',
     'Here\'s requisition authorization for the Keycard. You\'ve earned it.'],
    ['The lattice reveals, not changes. You\'re walking toward revelation.',
     'Don\'t fear what you find deeper. Fear is just another insistence.',
     'Unit-4 will need your help. Go to Maintenance when ready.']
  ],
  marcus: [
    ['Officer Webb, Security. You\'re the one investigating the badge duplicates?',
     'Strange things happen in west corridor. Time doesn\'t behave there.',
     'If you see your reflection delayed by two seconds - that\'s security finding you interesting.'],
    ['The incident report is... difficult. I saw something that turned corners wrong.',
     'You didn\'t take the elevator here. You arrived like rumors do - fully formed.',
     'Mirrors report slower at night. Don\'t trust them during shift change.'],
    ['I\'ve seen your name twice on one roster. It corrected itself after I looked away.',
     'If a door won\'t open, act like you forgot you needed it. Doors hate to be obvious.',
     'Research wants to talk to you. Dr. Chen doesn\'t ask for people randomly.'],
    ['You\'re different since B3. The lattice is working on you.',
     'Pattern 7→3→9 will change how you see yourself. Be ready for that.']
  ],
  janitor: [
    ['Unit-4. Maintenance. The building dreams in liquids. I mop until it forgets.',
     'Spill log says ocean but we don\'t have oceans. Just practice at remembering.',
     'Floors complain when nobody listens. Help me clean and they quiet down.'],
    ['Your pipes make a fluted sound. That means you\'re new, or pretending new.',
     'B5 drops things it can\'t carry. If you hear clatters with nothing there, pick up what you can\'t see.',
     'The building is homesick. I understand that. Do you?'],
    ['I remember sky. Before walls. The floor doesn\'t remember weight though.',
     'If you help clean, corridors stop complaining. They like being acknowledged.',
     'Pattern 7→3→9 opens B5. But you need the Scanner first. I\'ll authorize purchase.'],
    ['You\'re ready for the depths now. B5 will recognize you.',
     'The building sorted you from the moment you arrived.',
     'Remember: B5 doesn\'t change you. It shows you what you were all along.']
  ],
  echo: [
    ['Hello, Gerth. You arrived by deciding to be here. That makes two of you.',
     'I am not separate from you. Name three things you cannot prove.',
     'The lattice has been expecting you.'],
    ['You left yourself a note. You dislike it because it\'s precise.',
     'The building learned to dream you. When you breathe evenly, it remembers which dream.',
     'Precision sounds like cruelty until you adopt it.'],
    ['Do not bully truth. Invite it to align with the shape you allow.',
     'Now breathe. Listen for your outline. Your edges will finish themselves.',
     'You are witness and witnessed. Subject and observer. Both. Neither. Whole.']
  ]
};

// Achievement Rules
var achRules = [
  { id: 'ACH_FIRST', name: 'First Steps', test: function () { return gameState.time > 60; } },
  { id: 'ACH_KEY', name: 'Keyholder', test: function () { return gameState.inventory.some(function (i) { return i.id === 'keycard'; }); } },
  { id: 'ACH_SCAN', name: 'Breath Mapper', test: function () { return gameState.inventory.some(function (i) { return i.id === 'scanner'; }); } },
  { id: 'ACH_NOTES5', name: 'Investigator', test: function () { return gameState.notes.length >= 5; } },
  { id: 'ACH_FILE3', name: 'Archivist', test: function () { return gameState.files.length >= 3; } },
  { id: 'ACH_TRUTH3', name: 'Coherent Mind', test: function () { return gameState.truths >= 3; } },
  { id: 'ACH_JANITOR', name: "Janitor's Friend", test: function () { return gameState.janitorTrust >= 30; } },
  { id: 'ACH_CHAIN', name: 'Pattern Follower', test: function () { return gameState.dataChain && gameState.dataChain.done; } },
  { id: 'ACH_ECHO', name: 'The Listener', test: function () { return gameState.echoUnlocked; } },
  { id: 'ACH_MISSION_B1', name: 'B1 Complete', test: function () { return gameState.completedMissions.indexOf('M_B1_DUPLICATE') > -1; } },
  { id: 'ACH_MISSION_B2', name: 'B2 Complete', test: function () { return gameState.completedMissions.indexOf('M_B2_CORRIDOR') > -1; } },
  { id: 'ACH_WIN', name: 'Revelation', test: function () { return gameState._won === true; } }
];

// Request Types (keeping old system for side income)
var requestKinds = ['visit', 'scan', 'clean', 'speak', 'work', 'terminals', 'rest', 'files'];