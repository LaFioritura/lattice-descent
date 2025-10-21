# LATTICE DESCENT

A psychological text-based adventure game set in a mysterious underground facility.

## 📁 File Structure

```
lattice-descent/
├── index.html              # Main HTML structure
├── css/
│   ├── main.css           # Core styles and layout
│   ├── components.css     # UI components (buttons, modals, etc.)
│   └── animations.css     # Animations and transitions
├── js/
│   ├── data.js            # Game data (NPCs, items, dialogues, etc.)
│   ├── game-state.js      # State management and systems
│   ├── audio.js           # Audio system (ambient + sound effects)
│   ├── ui.js              # UI rendering and updates
│   ├── items.js           # Inventory and item system
│   ├── npcs.js            # NPC interactions and dialogues
│   ├── commands.js        # Command processing
│   └── main.js            # Game initialization and loop
└── README.md              # This file
```

## 🎮 How to Play

1. **Open `index.html`** in a modern web browser
2. Type **`help`** to see available commands
3. Start with **`look`** and **`requests`**
4. Complete requests to earn credits and unlock floors
5. Manage your **Coherence** (mental clarity) - keep it above 0!

## 🎯 Game Objective

Navigate through floors B1 to B5, gather truths, and uncover the mystery of your identity while maintaining your coherence.

## 🔑 Key Mechanics

- **Coherence**: Your mental stability (0-100%). Loss triggers game over.
- **Credits**: Currency for purchasing items
- **Truths**: Understanding that unlocks deeper layers
- **Notes/Files**: Story clues scattered throughout
- **Requests**: Tasks that earn rewards and unlock progression

## 🏢 Floor Progression

- **B1** (Admin): Starting floor - always accessible
- **B2** (Security): Requires completing 1 request OR 1 Truth
- **B3** (Research): Requires B2 + speaking with Marcus OR 1 Truth
- **B4** (Maintenance): Requires B3 + Access Keycard
- **B5** (Depths): Requires B4 + Keycard + Bio-Scanner + 2 Truths

## 💡 Essential Commands

### Core
- `help` - Show all commands
- `look` - Examine current floor
- `move [B1-B5]` - Travel between floors
- `talk [role]` - Speak with NPCs (guard/researcher/custodian/voice)

### Actions
- `work` - Earn credits (lose coherence)
- `rest` - Restore coherence
- `scan` - Listen to vents (find notes)
- `access [1-9]` - Use terminals
- `visit [location]` - Explore special areas

### Management
- `requests` - View available tasks
- `use [item]` - Use inventory item
- `status` - Check character status
- `notes` - View collected notes
- `files` - View collected files
- `read [id]` - Read a specific file

## 👥 NPCs

- **Marcus Webb** (B2) - Security Officer
- **Dr. Sarah Chen** (B3) - Researcher
- **Maintenance Unit 4** (B4) - Custodian
- **Echo** (B5) - ??? (Requires special unlock)

## 🛒 Shop Items

- **Cognitive Stabilizer** (50¢) - Restore +20 Coherence
- **Access Keycard** (120¢) - Unlock B4/B5
- **Bio-Scanner** (150¢) - Detect patterns, required for B5
- **Memory Backup** (500¢) - Cosmetic item

## 🎵 Audio Features

- Dynamic ambient soundscape adapts to floor and coherence
- Binaural beats change per level
- Sound effects for all major actions
- Toggle with 🔊 button or `soundBtn`

## 🏆 Achievements

- First Steps
- Keyholder
- Breath Mapper
- Investigator (5 notes)
- Archivist (3 files)
- Coherent Mind (3 truths)
- Janitor's Friend
- Pattern Follower (Complete 7→3→9)
- The Listener (Unlock Echo)
- Taskmaster (10 requests)
- Revelation (Win the game)

## 💾 Save System

No built-in save system. Each playthrough is a fresh descent.

## 🔧 Technical Notes

- Requires modern browser (Chrome, Firefox, Edge, Safari)
- Uses Web Audio API for sound
- Fully client-side - no server needed
- Responsive design works on desktop/tablet

## 📜 Credits

**LATTICE DESCENT v1.0**  
A narrative psychological horror text adventure

## 🐛 Troubleshooting

**Audio not working?**
- Click anywhere on the page first (browsers require user interaction)
- Check browser audio permissions
- Try toggling sound off/on

**Commands not working?**
- Check console (F12) for errors
- Ensure all .js files are loaded in correct order
- Verify file paths are correct

**Game feels too hard?**
- Use `rest` frequently to maintain coherence
- Complete simple requests first to build credits
- Read files and notes for hints about progression

## 🎨 Customization

To modify the game:
- **Colors/Theme**: Edit `css/main.css` (`:root` variables)
- **Game Data**: Edit `js/data.js`
- **Mechanics**: Edit `js/game-state.js`
- **Commands**: Edit `js/commands.js`

## 📄 License

Free to use and modify for personal/educational purposes.
Do not redistribute commercially without permission.

---

**Remember**: The building learns. The lattice aligns. You arrived by deciding to be here.

*Good luck, Gerth.*