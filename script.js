// State Management
let currentPin = "1234";
let balance = 5000;
let enteredPin = "";
let currentInputTarget = "pin"; // 'pin', 'withdraw', 'deposit', 'newpin'
let transactions = [
  { type: "CREDIT", amount: 5000, date: "Initial Balance" }
];

// Web Audio API for Key Beep Sound Effect
function playBeep(freq = 600, duration = 0.05) {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {
    // Audio context fallback
  }
}

// Update Realtime ATM Screen Clock
function updateClock() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const clockElem = document.getElementById('screenTime');
  if (clockElem) clockElem.textContent = timeStr;
}
setInterval(updateClock, 1000);
updateClock();

// View Switcher
function switchView(viewName) {
  playBeep(800);
  document.querySelectorAll('.screen-view').forEach(view => view.classList.remove('active'));
  
  const targetView = document.getElementById(`view-${viewName}`);
  if (targetView) targetView.classList.add('active');

  // Set input targets based on active view
  if (viewName === 'pin') {
    currentInputTarget = 'pin';
    enteredPin = '';
    updatePinDisplay();
  } else if (viewName === 'withdraw') {
    currentInputTarget = 'withdraw';
    document.getElementById('withdrawInput').value = '';
  } else if (viewName === 'deposit') {
    currentInputTarget = 'deposit';
    document.getElementById('depositInput').value = '';
  } else if (viewName === 'pinchange') {
    currentInputTarget = 'newpin';
    document.getElementById('newPinInput').value = '';
  } else if (viewName === 'balance') {
    document.getElementById('balanceDisplay').textContent = `$${balance.toFixed(2)}`;
  } else if (viewName === 'statement') {
    renderStatement();
  }
}

// Display PIN as Actual Numbers
function updatePinDisplay() {
  const display = document.getElementById('pinDisplay');
  if (!display) return;
  
  let formattedDisplay = "";
  for (let i = 0; i < 4; i++) {
    if (i < enteredPin.length) {
      formattedDisplay += enteredPin[i] + " ";
    } else {
      formattedDisplay += "- ";
    }
  }
  display.textContent = formattedDisplay.trim();
}

// Hardware Keypad Operations
function pressKey(num) {
  playBeep(700);

  // Automatic Card Insertion Visual Feedback
  const card = document.getElementById('atmCard');
  const indicator = document.getElementById('cardIndicator');
  if (card) card.classList.add('inserted');
  if (indicator) indicator.classList.add('active');

  if (currentInputTarget === 'pin') {
    if (enteredPin.length < 4) {
      enteredPin += num;
      updatePinDisplay();
    }
  } else if (currentInputTarget === 'withdraw') {
    const input = document.getElementById('withdrawInput');
    if (input) input.value += num;
  } else if (currentInputTarget === 'deposit') {
    const input = document.getElementById('depositInput');
    if (input) input.value += num;
  } else if (currentInputTarget === 'newpin') {
    const input = document.getElementById('newPinInput');
    if (input && input.value.length < 4) input.value += num;
  }
}

function pressClear() {
  playBeep(400);
  if (currentInputTarget === 'pin') {
    enteredPin = '';
    updatePinDisplay();
    document.getElementById('pinError').textContent = '';
  } else if (currentInputTarget === 'withdraw') {
    document.getElementById('withdrawInput').value = '';
  } else if (currentInputTarget === 'deposit') {
    document.getElementById('depositInput').value = '';
  } else if (currentInputTarget === 'newpin') {
    document.getElementById('newPinInput').value = '';
  }
}

function pressCancel() {
  playBeep(300);
  if (currentInputTarget !== 'pin') {
    switchView('pin');
  } else {
    pressClear();
  }
}

function pressEnter() {
  playBeep(900);
  if (currentInputTarget === 'pin') {
    if (enteredPin === currentPin) {
      document.getElementById('pinError').textContent = '';
      enteredPin = '';
      updatePinDisplay();
      switchView('menu');
    } else {
      document.getElementById('pinError').textContent = 'INVALID PIN! TRY AGAIN.';
      playBeep(200, 0.2);
      enteredPin = '';
      updatePinDisplay();
    }
  } else if (currentInputTarget === 'withdraw') {
    processWithdrawal();
  } else if (currentInputTarget === 'deposit') {
    processDeposit();
  } else if (currentInputTarget === 'newpin') {
    processPinChange();
  }
}

// Quick Cash Buttons
function quickWithdraw(amount) {
  document.getElementById('withdrawInput').value = amount;
  processWithdrawal();
}

// Transaction Logic
function processWithdrawal() {
  const amount = parseFloat(document.getElementById('withdrawInput').value);
  if (isNaN(amount) || amount <= 0) {
    alert("Please enter a valid amount!");
    return;
  }
  if (amount > balance) {
    alert("Insufficient Balance!");
    return;
  }

  balance -= amount;
  transactions.unshift({ type: "DEBIT", amount: amount, date: new Date().toLocaleTimeString() });
  
  triggerDispenseAnimation();
}

function processDeposit() {
  const amount = parseFloat(document.getElementById('depositInput').value);
  if (isNaN(amount) || amount <= 0) {
    alert("Please enter a valid amount!");
    return;
  }

  balance += amount;
  transactions.unshift({ type: "CREDIT", amount: amount, date: new Date().toLocaleTimeString() });

  switchView('dispensing');
  setTimeout(() => {
    alert(`Successfully deposited $${amount.toFixed(2)}`);
    switchView('menu');
  }, 1200);
}

function processPinChange() {
  const newPin = document.getElementById('newPinInput').value;
  if (newPin.length !== 4) {
    alert("PIN must be exactly 4 digits!");
    return;
  }

  currentPin = newPin;
  alert("PIN Code updated successfully!");
  switchView('menu');
}

function triggerDispenseAnimation() {
  switchView('dispensing');
  setTimeout(() => {
    const cashNote = document.getElementById('cashNote');
    if (cashNote) cashNote.classList.add('dispensed');
    playBeep(1000, 0.2);

    setTimeout(() => {
      if (cashNote) cashNote.classList.remove('dispensed');
      switchView('menu');
    }, 2500);
  }, 1500);
}

function renderStatement() {
  const list = document.getElementById('statementList');
  if (!list) return;
  list.innerHTML = transactions.map(t => `
    <div class="stmt-item ${t.type.toLowerCase()}">
      <span>${t.type} - ${t.date}</span>
      <strong>${t.type === 'CREDIT' ? '+' : '-'}$${t.amount.toFixed(2)}</strong>
    </div>
  `).join('');
}

function ejectCard() {
  playBeep(500);
  const card = document.getElementById('atmCard');
  const indicator = document.getElementById('cardIndicator');
  if (card) card.classList.remove('inserted');
  if (indicator) indicator.classList.remove('active');
  switchView('pin');
}

// Initial Call
updatePinDisplay();