/* ===========================
   NEXUS PROTOCOL - Game Data (FIXED)
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
  storyProgress: 0,
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
  _tutorialStep: 0,
  _hintsShown: {},
  _lastEventTime: 0,
  _visitedPlaces: {},
  _terminalPattern: [],
  _keycardUsed: false,
  _scannerUsed: false
};

// NPCs Data
var npcsData = {
  sarah: {
    name: 'Dr. Sarah Chen',
    role: ['researcher', 'doctor', 'sarah'],
    location: 'B3',
    aliases: ['sarah', 'dr', 'researcher', 'doctor', 'chen'],
    maxTalks: 3
  },
  marcus: {
    name: 'Marcus Webb',
    role: ['guard', 'officer', 'security', 'marcus'],
    location: 'B2',
    aliases: ['marcus', 'guard', 'officer', 'security', 'webb'],
    maxTalks: 3
  },
  echo: {
    name: 'Echo',
    role: ['voice', 'echo'],
    location: 'B5',
    aliases: ['echo', 'voice'],
    maxTalks: 3
  },
  janitor: {
    name: 'Maintenance Unit 4',
    role: ['custodian', 'janitor', 'maintenance'],
    location: 'B4',
    aliases: ['janitor', 'maintenance', 'custodian', 'unit'],
    maxTalks: 3
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
  '1': ['CR drift report: 0.71 → 0.66 (pending)', 'Badge duplicate warning: GERTH/—'],
  '2': ['Shift-change anomaly detected (west corridor)', 'Door 22 wants a witness.'],
  '3': ['Memory lattice checksum: PARTIAL', 'Echo signature: weak but present.'],
  '4': ['SUBJECT GERTH INTEGRATION: 63% COMPLETE', 'Administrative loop quarantined.'],
  '5': ['ERROR: EMPLOYEE GERTH NOT FOUND', 'Security mirror delay: 2.0s confirmed.'],
  '6': ['Request: consciousness anchor (volunteer: echo/gerth)', 'Stairs pretend to be doors.'],
  '7': ['Pattern orchestrator active. Need raw logs.', 'Dr. Chen access level overridden.'],
  '8': ['Reality coherence drops near B5 entrance.', 'Multiple consciousness detected.'],
  '9': ['REVELATION: Memory lattice aligns on demand.', 'Protocol key accepted.']
};

// Shop Items
var shopItems = [
  { id: 'stim', name: 'Cognitive Stabilizer', price: 50, effect: '+20 Coherence', consumable: true },
  { id: 'keycard', name: 'Access Keycard', price: 120, effect: 'Unlocks B4/B5', consumable: false },
  { id: 'scanner', name: 'Bio-Scanner', price: 150, effect: 'Detects patterns, required for B5', consumable: false },
  { id: 'backup', name: 'Memory Backup', price: 500, effect: 'Consciousness snapshot', consumable: false }
];

// Note Bank - Fixed progression
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
      'Security log excerpt. Time stamps drift by ±7 seconds across cameras 2—6.',
      'Witness statement (M. Webb): It was not a person. It was a decision wearing a person.',
      'Action: Corridor sealed. Door 22 demands a witness code to unlock.'
    ],
    floor: 'B2',
    grantsTruth: false
  },
  {
    id: 'CF-02',
    title: 'Memo: Anchoring Protocol',
    body: [
      'Draft from Research (S. Chen): An anchor does not force truth; it incentivizes consistency.',
      'Notes: Subject G. displays partial alignment when exposed to personal artifacts.'
    ],
    floor: 'B3',
    grantsTruth: true
  },
  {
    id: 'CF-03',
    title: 'Inventory: Lost & Found',
    body: [
      'List includes: one badge with two birthdays; a key that unlocks only locked keys.'
    ],
    floor: 'B1',
    grantsTruth: false
  },
  {
    id: 'CF-04',
    title: 'Maintenance: Spill Log',
    body: [
      'Observed substance: saline with trace iron, smell classified as coastal.',
      'Unit-4 note: The corridor cries sometimes. I mop until it forgets.'
    ],
    floor: 'B4',
    grantsTruth: false
  },
  {
    id: 'CF-05',
    title: 'Research: Echo Signature',
    body: [
      'Echo is not a ghost; it is an available shape awaiting a story.',
      'Coupling increases near B5 when a subject stops insisting on singularity.'
    ],
    floor: 'B5',
    grantsTruth: true
  },
  {
    id: 'CF-06',
    title: 'Admin: Duplicate Personnel',
    body: [
      'Flagged: GERTH (records disagree).',
      'Mitigation: loop administrative tasks until the name tires and reveals a seam.'
    ],
    floor: 'B1',
    grantsTruth: false
  },
  {
    id: 'CF-07',
    title: 'Spec: Memory Lattice',
    body: [
      'A lattice accepts more than it proves. It aligns when the witness withdraws pressure.',
      'Test vector: 7 → 3 → 9 (non-linear compliance)'
    ],
    floor: 'B3',
    grantsTruth: true
  },
  {
    id: 'CF-08',
    title: 'After-Action: B5 Pressure',
    body: [
      'Subjects report chest-tightening and auditory pareidolia.',
      'Recommendation: arrive rested; bring scanner; listen more than speak.'
    ],
    floor: 'B5',
    grantsTruth: false
  }
];

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
  { id: 'ACH_TASK10', name: 'Taskmaster', test: function () { return gameState._completedRequests >= 10; } },
  { id: 'ACH_WIN', name: 'Revelation', test: function () { return gameState._won === true; } }
];

// NPC Dialogue Tiers
var tierLines = {
  sarah: [
    [
      'Patterns are not random; they are polite until asked the wrong way.',
      'Anchors do not enforce truth; they reward the building when it behaves.'
    ],
    [
      'Your file has two birthdays because two people vouched for you at different times.',
      'When you stop insisting on being singular, the lattice aligns.'
    ],
    [
      'If you follow 7 → 3 → 9, do it without demanding results.',
      'Take these notes. Read them like a tone to hum along with.'
    ]
  ],
  marcus: [
    [
      'Authorization looks smudged. Keep your hands visible when you speak to doors.',
      'If static bends inward, you look away. If it follows you, speak your name twice.'
    ],
    [
      'You did not take the elevator to get here. You arrived the way rumors do.',
      'Mirrors report slower at night. If yours is delayed, security finds you interesting.'
    ],
    [
      'I have seen your name twice on a roster once. It corrected itself after I stopped reading.',
      'If you want a door open, act like you forgot you needed it.'
    ]
  ],
  janitor: [
    [
      'Must clean. Stains keep returning because the building dreams in liquids.',
      'Spill log says ocean. We do not have oceans. We have practice.'
    ],
    [
      'Pipes learn people. Yours makes a fluted sound. That means you are new.',
      'B5 drops things it cannot carry. Pick up what you cannot see.'
    ],
    [
      'I remember sky. Before the walls. The floor does not remember weight.',
      'If you help me clean, the corridor stops complaining.'
    ]
  ],
  echo: [
    [
      'Hello, Gerth. You arrived by deciding to be here. That makes two of you.',
      'Name three things you cannot prove. I am not separate from you.'
    ],
    [
      'You left yourself a note. You dislike it because it is precise.',
      'The building learned to dream you. When you breathe evenly, it remembers.'
    ],
    [
      'The lattice aligns when pressure falls away. Do not bully truth.',
      'Now breathe, and listen for your outline. Your edges will finish themselves.'
    ]
  ]
};

// Request Types
var requestKinds = [
  'visit',
  'scan',
  'clean',
  'speak',
  'work',
  'terminals',
  'rest',
  'files'
];