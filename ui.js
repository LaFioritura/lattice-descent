/* ===========================
   LATTICE DESCENT - UI System v2.0
   Terminal rendering, modals, HUD, visual effects
   =========================== */

// ============================================
// DOM HELPERS
// ============================================

function $(sel) {
  return document.querySelector(sel);
}

function $$(sel) {
  return document.querySelectorAll(sel);
}

// ============================================
// TERMINAL OUTPUT
// ============================================

function addLine(text, className) {
  var line = document.createElement('div');
  line.className = 'terminal-line ' + (className || '');
  line.textContent = text;
  $('#terminal').appendChild(line);
  $('#terminal').scrollTop = $('#terminal').scrollHeight;
}

function think(text) {
  addLine('( ' + text + ' )', 'thought');
}

function hint(text) {
  addLine('💡 ' + text, 'hint-message');
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================

function toast(title, body, kind) {
  var toastEl = document.createElement('div');
  toastEl.className = 'toast ' + (kind || 'info');
  
  var titleEl = document.createElement('div');
  titleEl.className = 'title';
  titleEl.textContent = title;
  
  var bodyEl = document.createElement('div');
  bodyEl.textContent = body;
  
  toastEl.appendChild(titleEl);
  toastEl.appendChild(bodyEl);
  
  var wrap = $('#toasts');
  wrap.appendChild(toastEl);
  
  setTimeout(function() {
    toastEl.classList.add('show');
  }, 10);
  
  setTimeout(function() {
    toastEl.classList.remove('show');
    setTimeout(function() {
      try {
        wrap.removeChild(toastEl);
      } catch(e) {}
    }, 400);
  }, 4200);
}

// ============================================
// PARTICLE EFFECTS
// ============================================

function createParticles(count, fromElement) {
  var rect = fromElement ? fromElement.getBoundingClientRect() : null;
  var startX = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
  var startY = rect ? rect.top : 0;
  
  for (var i = 0; i < count; i++) {
    var particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = startX + 'px';
    particle.style.top = startY + 'px';
    document.body.appendChild(particle);
    
    setTimeout(function(p) {
      p.classList.add('active');
      setTimeout(function() {
        try {
          document.body.removeChild(p);
        } catch(e) {}
      }, 2000);
    }, i * 50, particle);
  }
}

// ============================================
// GLITCH EFFECTS
// ============================================

function flashGlitch() {
  var overlay = $('#glitchOverlay');
  overlay.classList.add('active');
  setTimeout(function() {
    overlay.classList.remove('active');
  }, 500);
}

function triggerVisualGlitch(intensity) {
  intensity = intensity || 'medium';
  
  var terminal = $('#terminal');
  var overlay = $('#glitchOverlay');
  
  if (intensity === 'low') {
    terminal.style.animation = 'glitchTerminal 0.1s 2';
    setTimeout(function() {
      terminal.style.animation = '';
    }, 200);
  } else if (intensity === 'medium') {
    overlay.classList.add('active');
    terminal.style.animation = 'glitchTerminal 0.1s 5';
    setTimeout(function() {
      overlay.classList.remove('active');
      terminal.style.animation = '';
    }, 500);
  } else if (intensity === 'high') {
    overlay.classList.add('active');
    terminal.style.animation = 'glitchTerminal 0.05s 10';
    document.body.classList.add('extreme-glitch');
    setTimeout(function() {
      overlay.classList.remove('active');
      terminal.style.animation = '';
      document.body.classList.remove('extreme-glitch');
    }, 1000);
  }
}

function applyChromaticAberration() {
  var terminal = $('#terminal');
  terminal.style.textShadow = '2px 0 0 #ff0000, -2px 0 0 #00ffff';
}

function removeChromaticAberration() {
  var terminal = $('#terminal');
  terminal.style.textShadow = '';
}

function updateVisualEffects() {
  if (gameState.floor === 'B5') {
    applyChromaticAberration();
  } else {
    removeChromaticAberration();
  }
}

function pulseScanLines() {
  var terminal = $('#terminal');
  terminal.classList.add('scan-pulse');
  setTimeout(function() {
    terminal.classList.remove('scan-pulse');
  }, 600);
}

// ============================================
// NUMBER ANIMATIONS
// ============================================

function animateNumber(element, newValue) {
  var oldValue = parseInt(element.textContent) || 0;
  if (oldValue === newValue) return;
  
  element.classList.add('number-change');
  element.textContent = newValue;
  
  setTimeout(function() {
    element.classList.remove('number-change');
  }, 400);
}

// ============================================
// COHERENCE LED
// ============================================

function updateCoherenceLED() {
  var led = $('#coherenceLed');
  var symbol = $('#coherenceSymbol');
  var coh = gameState.coherence;
  
  led.className = 'led';
  if (coh >= 70) {
    led.classList.add('green');
    symbol.textContent = '●';
  } else if (coh >= 40) {
    led.classList.add('yellow');
    symbol.textContent = '●';
  } else if (coh >= 20) {
    led.classList.add('red', 'pulse');
    symbol.textContent = '●';
  } else {
    led.classList.add('red', 'pulse');
    symbol.textContent = '○';
  }
}

// ============================================
// BACKGROUND IMAGE SYSTEM
// ============================================

function updateBackgroundImage() {
  var floor = gameState.floor;
  var terminal = $('#terminal');
  
  // Remove all bg classes
  terminal.className = terminal.className.replace(/bg-b[1-5]/g, '').trim();
  
  // Add new bg class
  terminal.classList.add('bg-' + floor.toLowerCase());
  
  // Adjust opacity based on coherence
  var opacity = 0.15;
  if (gameState.coherence < 30) {
    opacity = 0.25;
  }
  if (floor === 'B5') {
    opacity = 0.3;
  }
  
  terminal.style.setProperty('--bg-opacity', opacity);
}

// ============================================
// MAIN DISPLAY UPDATE
// ============================================

function updateDisplay() {
  $('#floor').textContent = gameState.floor;
  animateNumber($('#coherence'), Math.max(0, Math.min(100, Math.round(gameState.coherence))));
  animateNumber($('#credits'), gameState.credits);
  
  var mins = ('0' + Math.floor(gameState.time / 60)).slice(-2);
  var secs = ('0' + (gameState.time % 60)).slice(-2);
  $('#gameTime').textContent = mins + ':' + secs;
  
  updateCoherenceLED();
  updateBackgroundImage();
  
  // Glitch mode
  if (gameState.coherence < 30) {
    document.body.classList.add('glitch-mode');
  } else {
    document.body.classList.remove('glitch-mode');
  }
  
  // Extreme glitch on B5 low coherence
  if (gameState.floor === 'B5' && gameState.coherence < 20) {
    document.body.classList.add('extreme-glitch');
  } else {
    document.body.classList.remove('extreme-glitch');
  }
  
  updateHUD();
  checkLose();
}

// ============================================
// TICKER
// ============================================

function tick(msg) {
  var line = document.createElement('div');
  line.textContent = msg;
  var ticker = $('#ticker');
  ticker.prepend(line);
  while (ticker.childNodes.length > 10) {
    ticker.removeChild(ticker.lastChild);
  }
}

// ============================================
// ROSTER BY FLOOR
// ============================================

function rosterByFloor() {
  return {
    B1: [],
    B2: gameState.floorsUnlocked.B2 ? [personnelRoster.marcus.name] : [],
    B3: gameState.floorsUnlocked.B3 ? [personnelRoster.sarah.name] : [],
    B4: gameState.floorsUnlocked.B4 ? [personnelRoster.janitor.name] : [],
    B5: gameState.floorsUnlocked.B5 ? [gameState.echoUnlocked ? 'Echo (listens)' : '(hush)'] : []
  };
}

// ============================================
// HUD UPDATE
// ============================================

function updateHUD() {
  $('#hudCoherence').textContent = gameState.coherence + '%';
  $('#hudCredits').textContent = gameState.credits;
  $('#hudProgress').textContent = gameState.truths;
  $('#hudLogs').textContent = gameState.notes.length + '/16';
  $('#hudDiary').textContent = gameState.diaryEntries.length + '/10';
  
  $('#barCoherence').style.width = Math.max(0, Math.min(100, gameState.coherence)) + '%';
  
  var maxCredits = 500;
  var creditPercent = Math.min(100, (gameState.credits / maxCredits) * 100);
  $('#barCredits').style.width = creditPercent + '%';
  
  var truthPercent = Math.min(100, (gameState.truths / 5) * 100);
  $('#barProgress').style.width = truthPercent + '%';
  
  // Minimap
  var floors = ['B5', 'B4', 'B3', 'B2', 'B1'];
  var roster = rosterByFloor();
  var map = floors.map(function(f) {
    var mark = f === gameState.floor ? '> ' : '  ';
    var line = mark + f + (f === gameState.floor ? ' <' : '');
    if (!gameState.floorsUnlocked[f]) line += ' [LOCKED]';
    var names = (roster[f] || []).join(', ');
    return names ? line + ' — ' + names : line;
  }).join('\n');
  
  map += gameState.place ? '\n[' + gameState.place + ']' : '';
  $('#minimap').textContent = map;
  
  // Mission info
  var mission = getCurrentMission();
  var missionText = 'No active mission';
  if (mission) {
    var completedCount = 0;
    var totalCount = 0;
    for (var key in mission.objectives) {
      totalCount++;
      if (mission.objectives[key].done) completedCount++;
    }
    missionText = mission.title + ': ' + completedCount + '/' + totalCount;
  }
  
  $('#legendBox').innerHTML = '<strong>Current Mission:</strong><br>' + missionText + 
    '<br><br><strong>Diary:</strong> ' + gameState.diaryEntries.length + '/10 entries' +
    '<br>Use <code>diary</code> to read';
}

// ============================================
// SHOP MODAL
// ============================================

function openShop() {
  var modal = $('#shopModal');
  var content = $('#shopContent');
  
  function render() {
    content.innerHTML = '<p style="margin-bottom:15px;">Available Credits: <strong>' + gameState.credits + '¢</strong></p>';
    
    shopItems.forEach(function(item) {
      var owned = gameState.inventory.some(function(i) { return i.id === item.id; });
      var div = document.createElement('div');
      div.className = 'item-card';
      
      var statusText = '';
      var isLocked = false;
      
      // Check if item is locked
      if (item.id === 'keycard' && !gameState._keycardAuthorized) {
        isLocked = true;
        statusText = ' [LOCKED - Complete B2 mission]';
      } else if (item.id === 'scanner' && !gameState._scannerAuthorized) {
        isLocked = true;
        statusText = ' [LOCKED - Complete B3 mission]';
      } else if (owned && !item.consumable) {
        statusText = ' [OWNED]';
      } else if (owned && item.consumable) {
        statusText = ' [OWNED - Can rebuy]';
      }
      
      div.innerHTML = '<h3>' + item.name + statusText + '</h3>' +
                      '<p>' + item.effect + '</p>' +
                      '<p><strong>Price: ' + item.price + '¢</strong></p>';
      
      if (isLocked) {
        div.style.opacity = '0.5';
        div.style.cursor = 'not-allowed';
        div.style.borderColor = '#666';
        content.appendChild(div);
        return;
      }
      
      if (owned && !item.consumable) {
        div.style.opacity = '0.6';
        div.style.cursor = 'default';
        content.appendChild(div);
        return;
      }
      
      div.onclick = function() {
        if (gameState.credits >= item.price) {
          gameState.credits -= item.price;
          gameState.inventory.push(JSON.parse(JSON.stringify(item)));
          addLine('[Purchased: ' + item.name + ']', 'success-message');
          playSound('success');
          toast('Purchased', item.name, 'good');
          createParticles(12, div);
          
          // Check mission purchase objectives
          var mission = getCurrentMission();
          if (mission) {
            for (var key in mission.objectives) {
              var obj = mission.objectives[key];
              if (obj.type === 'purchase' && obj.target === item.id && !obj.done) {
                updateMissionObjective(key);
                break;
              }
            }
          }
          
          render();
          updateDisplay();
          
          if (item.id === 'keycard') {
            hint('Keycard acquired. Access to B3 granted.');
          }
          if (item.id === 'scanner') {
            hint('Scanner acquired. Use "use scanner" to detect patterns.');
          }
        } else {
          addLine('Insufficient credits. Need ' + (item.price - gameState.credits) + '¢ more.', 'error-message');
          playSound('error');
          toast('Purchase failed', 'Not enough credits', 'bad');
        }
      };
      content.appendChild(div);
    });
  }
  
  render();
  modal.style.display = 'block';
}

// ============================================
// INVENTORY MODAL
// ============================================

function openInventory() {
  var modal = $('#inventoryModal');
  var content = $('#inventoryContent');
  
  if (gameState.inventory.length === 0) {
    content.innerHTML = '<p>No items in inventory. Visit REQUISITION to purchase equipment.</p>';
  } else {
    content.innerHTML = '';
    gameState.inventory.forEach(function(item) {
      var div = document.createElement('div');
      div.className = 'item-card';
      div.innerHTML = '<h3>' + item.name + '</h3>' +
                      '<p>' + item.effect + '</p>' +
                      '<p style="color:#00ff41;font-size:12px;">Click to use</p>';
      div.onclick = function() {
        modal.style.display = 'none';
        useItem(item.name);
      };
      content.appendChild(div);
    });
  }
  modal.style.display = 'block';
}

// ============================================
// DIARY MODAL
// ============================================

function openDiaryModal() {
  var modal = $('#diaryModal');
  var content = $('#diaryContent');
  
  if (gameState.diaryEntries.length === 0) {
    content.innerHTML = '<p style="padding:20px;">Your diary is empty. Live first. Write later.</p>';
  } else {
    content.innerHTML = '';
    
    gameState.diaryEntries.forEach(function(entry, index) {
      var entryDiv = document.createElement('div');
      entryDiv.className = 'diary-entry';
      
      var title = document.createElement('h3');
      title.textContent = 'ENTRY ' + (index + 1) + ': ' + entry.title.toUpperCase();
      title.style.color = '#00ff41';
      title.style.marginBottom = '10px';
      
      var timestamp = document.createElement('div');
      timestamp.textContent = 'Cycle: ' + formatDiaryTime(entry.unlockedAt);
      timestamp.style.fontSize = '12px';
      timestamp.style.color = '#00ccff';
      timestamp.style.marginBottom = '15px';
      
      var contentDiv = document.createElement('div');
      contentDiv.style.lineHeight = '1.6';
      contentDiv.style.color = '#9cffb5';
      
      entry.content.forEach(function(line) {
        var p = document.createElement('p');
        p.textContent = line;
        p.style.marginBottom = '8px';
        if (line.startsWith('[') || line.startsWith('-')) {
          p.style.fontStyle = 'italic';
          p.style.color = '#ffaa00';
        }
        contentDiv.appendChild(p);
      });
      
      entryDiv.appendChild(title);
      entryDiv.appendChild(timestamp);
      entryDiv.appendChild(contentDiv);
      
      var separator = document.createElement('hr');
      separator.style.border = 'none';
      separator.style.borderTop = '1px dashed #00ff41';
      separator.style.margin = '20px 0';
      
      content.appendChild(entryDiv);
      if (index < gameState.diaryEntries.length - 1) {
        content.appendChild(separator);
      }
    });
    
    var footer = document.createElement('div');
    footer.style.marginTop = '20px';
    footer.style.paddingTop = '15px';
    footer.style.borderTop = '2px solid #00ff41';
    footer.style.textAlign = 'center';
    footer.style.color = '#ffff00';
    footer.innerHTML = '<strong>Entries: ' + gameState.diaryEntries.length + '/' + diaryTemplate.length + '</strong>';
    content.appendChild(footer);
  }
  
  modal.style.display = 'block';
}

function formatDiaryTime(seconds) {
  var mins = Math.floor(seconds / 60);
  var secs = seconds % 60;
  return ('0' + mins).slice(-2) + ':' + ('0' + secs).slice(-2);
}

// ============================================
// CLOSE MODALS
// ============================================

function closeModals() {
  $('#shopModal').style.display = 'none';
  $('#inventoryModal').style.display = 'none';
  $('#diaryModal').style.display = 'none';
  if ($('#commandInput')) $('#commandInput').focus();
}

// ============================================
// ASCII ROOM RENDERING
// ============================================

function renderRoomASCII(floor, roomName) {
  if (!roomSystem[floor] || !roomSystem[floor][roomName]) {
    return null;
  }
  
  var room = roomSystem[floor][roomName];
  var ascii = room.ascii.join('\n');
  
  // Add color coding for special elements
  ascii = ascii.replace(/@/g, '<span style="color:#ffff00;">@</span>'); // Player
  ascii = ascii.replace(/\[([^\]]+)\]/g, '<span style="color:#00ccff;">[$1]</span>'); // Objects
  
  return ascii;
}

// ============================================
// CHOICE SYSTEM (for dialogues)
// ============================================

function makeChoices(choices) {
  var wrap = document.createElement('div');
  wrap.className = 'choice-container';
  choices.forEach(function(ch) {
    var btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = ch.label;
    btn.onclick = function() {
      wrap.remove();
      addLine('[' + ch.label + ']', 'success-message');
      addLine(ch.outcome, 'npc-message');
      if (ch.effects) {
        if (ch.effects.truths) {
          gameState.truths += ch.effects.truths;
          addLine('[+' + ch.effects.truths + ' Truth]', 'success-message');
        }
        if (ch.effects.credits) {
          gameState.credits += ch.effects.credits;
          addLine('[+' + ch.effects.credits + '¢]', 'success-message');
        }
        if (ch.effects.coherence) {
          gameState.coherence = Math.max(0, Math.min(100, gameState.coherence + ch.effects.coherence));
          addLine('[' + (ch.effects.coherence > 0 ? '+' : '') + ch.effects.coherence + ' Coherence]', 'system-message');
        }
        updateDisplay();
        toast('Consequence', 'Your choice echoes.', 'info');
      }
    };
    wrap.appendChild(btn);
  });
  $('#terminal').appendChild(wrap);
  $('#terminal').scrollTop = $('#terminal').scrollHeight;
}