/* ===========================
   NEXUS PROTOCOL - UI System
   =========================== */

function $(sel) {
  return document.querySelector(sel);
}

function addLine(t, c) {
  var d = document.createElement('div');
  d.className = 'terminal-line ' + (c || '');
  d.textContent = t;
  $('#terminal').appendChild(d);
  $('#terminal').scrollTop = $('#terminal').scrollHeight;
}

function think(t) {
  addLine('( ' + t + ' )', 'thought');
}

function hint(t) {
  addLine('💡 ' + t, 'hint-message');
}

function toast(title, body, kind) {
  var t = document.createElement('div');
  t.className = 'toast ' + (kind || 'info');
  var h = document.createElement('div');
  h.className = 'title';
  h.textContent = title;
  var p = document.createElement('div');
  p.textContent = body;
  t.appendChild(h);
  t.appendChild(p);
  var wrap = $('#toasts');
  wrap.appendChild(t);

  setTimeout(function () {
    t.classList.add('show');
  }, 10);
  setTimeout(function () {
    t.classList.remove('show');
    setTimeout(function () {
      try {
        wrap.removeChild(t);
      } catch (e) {}
    }, 400);
  }, 4200);
}

function createParticles(count, fromElement) {
  var rect = fromElement ? fromElement.getBoundingClientRect() : null;
  var startX = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
  var startY = rect ? rect.top : 0;

  for (var i = 0; i < count; i++) {
    var p = document.createElement('div');
    p.className = 'particle';
    p.style.left = startX + 'px';
    p.style.top = startY + 'px';
    p.style.setProperty('--drift', (Math.random() - 0.5) * 2);
    document.body.appendChild(p);

    setTimeout(
      function (particle) {
        particle.classList.add('active');
        setTimeout(function () {
          try {
            document.body.removeChild(particle);
          } catch (e) {}
        }, 2000);
      },
      i * 50,
      p
    );
  }
}

function flashGlitch() {
  var overlay = $('#glitchOverlay');
  overlay.classList.add('active');
  setTimeout(function () {
    overlay.classList.remove('active');
  }, 500);
}

function animateNumber(element, newValue) {
  var oldValue = parseInt(element.textContent) || 0;
  if (oldValue === newValue) return;

  element.classList.add('number-change');
  element.textContent = newValue;

  setTimeout(function () {
    element.classList.remove('number-change');
  }, 400);
}

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
    symbol.textContent = '◐';
  } else if (coh >= 20) {
    led.classList.add('red', 'pulse');
    symbol.textContent = '◑';
  } else {
    led.classList.add('red', 'pulse');
    symbol.textContent = '○';
  }
}

function updateDisplay() {
  $('#floor').textContent = gameState.floor;
  animateNumber($('#coherence'), Math.max(0, Math.min(100, Math.round(gameState.coherence))));
  animateNumber($('#credits'), gameState.credits);
  var mins = ('0' + Math.floor(gameState.time / 60)).slice(-2),
    secs = ('0' + (gameState.time % 60)).slice(-2);
  $('#gameTime').textContent = mins + ':' + secs;

  updateCoherenceLED();

  if (gameState.coherence < 30) {
    document.body.classList.add('glitch-mode');
  } else {
    document.body.classList.remove('glitch-mode');
  }
  updateHUD();
  checkLose();
  checkAchievements();
}

function tick(msg) {
  var line = document.createElement('div');
  line.textContent = msg;
  var t = $('#ticker');
  t.prepend(line);
  while (t.childNodes.length > 10) t.removeChild(t.lastChild);
}

function rosterByFloor() {
  return {
    B1: [],
    B2: gameState.floorsUnlocked.B2 ? [npcsData.marcus.name] : [],
    B3: gameState.floorsUnlocked.B3 ? [npcsData.sarah.name] : [],
    B4: gameState.floorsUnlocked.B4 ? [npcsData.janitor.name] : [],
    B5: gameState.floorsUnlocked.B5
      ? [gameState.echoUnlocked ? 'Echo (listens)' : '(hush)']
      : []
  };
}

function updateHUD() {
  $('#hudCoherence').textContent = gameState.coherence + '%';
  $('#hudCredits').textContent = gameState.credits;
  $('#hudProgress').textContent = gameState.truths;
  $('#hudLogs').textContent = gameState.notes.length + '/16';
  $('#hudAch').textContent = gameState.achCount;
  $('#barCoherence').style.width = Math.max(0, Math.min(100, gameState.coherence)) + '%';
  var c = Math.min(400, gameState.credits);
  $('#barCredits').style.width = c / 4 + '%';
  $('#barProgress').style.width = Math.min(100, gameState.truths * 20) + '%';
  var floors = ['B5', 'B4', 'B3', 'B2', 'B1'];
  var roster = rosterByFloor();
  var map = floors
    .map(function (f) {
      var mark = f === gameState.floor ? '> ' : '  ';
      var line = mark + f + (f === gameState.floor ? ' <' : '');
      if (!gameState.floorsUnlocked[f]) line += ' [locked]';
      var names = (roster[f] || []).join(', ');
      return names ? line + ' — ' + names : line;
    })
    .join('\n');
  map += gameState.place ? '\n[' + gameState.place + ']' : '';
  $('#minimap').textContent = map;
  $('#legendBox').innerHTML =
    'Legend: Coherence = mental clarity (keep above 0). Truths = understanding. Notes/Files = clues. Use <code>who</code> for people.';
}

function makeChoices(choices) {
  var wrap = document.createElement('div');
  wrap.className = 'choice-container';
  choices.forEach(function (ch) {
    var b = document.createElement('button');
    b.className = 'choice-btn';
    b.textContent = ch.label;
    b.onclick = function () {
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
          gameState.coherence = Math.max(
            0,
            Math.min(100, gameState.coherence + ch.effects.coherence)
          );
          addLine(
            '[' + (ch.effects.coherence > 0 ? '+' : '') + ch.effects.coherence + ' Coherence]',
            'system-message'
          );
        }
        if (ch.effects.trustJanitor) {
          gameState.janitorTrust = Math.min(100, gameState.janitorTrust + ch.effects.trustJanitor);
        }
        updateDisplay();
        toast('Consequence', 'Your choice echoes.', 'info');
      }
    };
    wrap.appendChild(b);
  });
  $('#terminal').appendChild(wrap);
  $('#terminal').scrollTop = $('#terminal').scrollHeight;
}

function openShop() {
  var modal = $('#shopModal'),
    content = $('#shopContent');
  function render() {
    content.innerHTML = '<p>Available Credits: ' + gameState.credits + '¢</p>';
    shopItems.forEach(function (it) {
      var owned = gameState.inventory.some(function (i) {
        return i.id === it.id;
      });
      var div = document.createElement('div');
      div.className = 'item-card';
      div.innerHTML =
        '<h3>' +
        it.name +
        (owned ? ' [OWNED]' : '') +
        '</h3><p>' +
        it.effect +
        '</p><p>Price: ' +
        it.price +
        '¢</p>';
      if (owned) {
        div.style.opacity = '0.6';
        div.style.cursor = 'default';
        return content.appendChild(div);
      }
      div.onclick = function () {
        if (gameState.credits >= it.price) {
          gameState.credits -= it.price;
          gameState.inventory.push(JSON.parse(JSON.stringify(it)));
          addLine('[Purchased: ' + it.name + ']', 'success-message');
          playSound('success');
          toast('Purchased', it.name, 'good');
          createParticles(12, div);
          render();
          updateDisplay();
          maybeUnlockB5ByWisdom();
          if (it.id === 'keycard') {
            tryUnlockB4();
          }
          if (it.id === 'scanner') {
            hint('Scanner equipped. Try: use scanner');
          }
        } else {
          addLine('Insufficient clearance.', 'error-message');
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

function openInventory() {
  var modal = $('#inventoryModal'),
    content = $('#inventoryContent');
  if (gameState.inventory.length === 0) {
    content.innerHTML = '<p>No items in inventory</p>';
  } else {
    content.innerHTML = '';
    gameState.inventory.forEach(function (item) {
      var div = document.createElement('div');
      div.className = 'item-card';
      div.innerHTML =
        '<h3>' +
        item.name +
        '</h3><p>' +
        item.effect +
        '</p><p style="color:#00ff41;font-size:12px;">Click to use</p>';
      div.onclick = function () {
        modal.style.display = 'none';
        useItem(item.name);
      };
      content.appendChild(div);
    });
  }
  modal.style.display = 'block';
}

function closeModals() {
  $('#shopModal').style.display = 'none';
  $('#inventoryModal').style.display = 'none';
  if ($('#commandInput')) $('#commandInput').focus();
}