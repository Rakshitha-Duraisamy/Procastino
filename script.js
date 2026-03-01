  const FOCUS = 25 * 60, BREAK = 5 * 60;
  const CIRC = 2 * Math.PI * 130;

  const TAB_ROASTS = [
    "Finish your task first 😈",
    "Scrolling won't finish your project.",
    "Your deadline is not scared of you.",
    "That other tab isn't going to save you.",
    "Back already? Thought so.",
    "One tab. ONE. Is that too much to ask?",
    "Your future self is disappointed.",
  ];
  const INACTIVITY_ROASTS = [
    "Fine. You earned 5 minutes. Don't abuse it.",
    "Staring at the screen isn't working.",
    "The task won't finish itself. Trust me.",
    "Zoning out is not a productivity strategy.",
    "Hello? Anyone home? 👀",
    "Your procrastination is showing.",
  ];

  let timeLeft = FOCUS, isRunning = false, isBreak = false;
  let completedPomodoros = 0, totalFocusSecs = 0, tabSwitches = 0, inactivityWarnings = 0;
  let ticker = null, inactivityChecker = null, lastActivity = Date.now();
  let taskName = "";

  // Input enable/disable
  const taskInput = document.getElementById('task-input');
  const btnStart = document.getElementById('btn-start');
  taskInput.addEventListener('input', () => {
    btnStart.disabled = !taskInput.value.trim();
  });

  function getRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function showPhase(name) {
    ['input','focus','summary'].forEach(p => {
      const el = document.getElementById('phase-' + p);
      el.style.display = (p === name) ? 'flex' : 'none';
    });
  }

  function startSession(e) {
    e.preventDefault();
    taskName = taskInput.value.trim();
    if (!taskName) return;
    tabSwitches = 0; inactivityWarnings = 0;
    totalFocusSecs = 0; completedPomodoros = 0;
    isBreak = false; timeLeft = FOCUS;
    document.getElementById('task-label').textContent = taskName;
    showPhase('focus');
    updateRing(); updateDisplay();
    isRunning = true;
    startTicker();
    startInactivityCheck();
    document.addEventListener('visibilitychange', onVisibility);
    ['mousemove','keydown','mousedown','touchstart','scroll'].forEach(ev =>
      window.addEventListener(ev, resetActivity));
  }

  function startTicker() {
    clearInterval(ticker);
    ticker = setInterval(() => {
      if (!isRunning) return;
      timeLeft--;
      if (!isBreak) { totalFocusSecs++; }
      updateDisplay();
      updateRing();
      if (timeLeft <= 0) {
        if (!isBreak) {
          completedPomodoros++;
          isBreak = true; timeLeft = BREAK;
          document.getElementById('phase-badge').className = 'phase-badge-green';
          document.getElementById('phase-badge').textContent = '☕ Break Time';
          document.getElementById('timer-sub').textContent = 'Recharging';
          document.getElementById('ring').style.stroke = '#10b981';
        } else {
          isBreak = false; timeLeft = FOCUS;
          document.getElementById('phase-badge').className = 'phase-badge-red';
          document.getElementById('phase-badge').textContent = '🧠 Deep Focus';
          document.getElementById('timer-sub').textContent = 'Remaining';
          document.getElementById('ring').style.stroke = '#ef4444';
        }
        updateDisplay(); updateRing();
      }
      document.getElementById('stat-pomodoros').textContent = completedPomodoros;
      document.getElementById('stat-tabs').textContent = tabSwitches;
      document.getElementById('stat-focus').textContent = Math.floor(totalFocusSecs / 60) + 'm';
    }, 1000);
  }

  function togglePlay() {
    isRunning = !isRunning;
    const btn = document.getElementById('btn-play');
    btn.textContent = isRunning ? '⏸' : '▶';
    btn.className = isRunning ? 'btn-playpause' : 'btn-playpause paused';
  }

  function resetTimer() {
    timeLeft = isBreak ? BREAK : FOCUS;
    updateDisplay(); updateRing();
  }

  function updateDisplay() {
    const m = Math.floor(timeLeft / 60).toString().padStart(2,'0');
    const s = (timeLeft % 60).toString().padStart(2,'0');
    document.getElementById('timer-time').textContent = m + ':' + s;
  }

  function updateRing() {
    const total = isBreak ? BREAK : FOCUS;
    const progress = (total - timeLeft) / total;
    const offset = CIRC - progress * CIRC;
    document.getElementById('ring').style.strokeDashoffset = offset;
  }

  function endSession() {
    isRunning = false;
    clearInterval(ticker); clearInterval(inactivityChecker);
    document.removeEventListener('visibilitychange', onVisibility);
    showSummary();
  }

  function showSummary() {
    const score = Math.max(0, 100 - tabSwitches * 10 - inactivityWarnings * 5);
    document.getElementById('summary-task-name').textContent = '"' + taskName + '"';
    const sv = document.getElementById('summary-score');
    sv.textContent = score;
    sv.className = 'score-val ' + (score >= 80 ? 'green' : score >= 50 ? 'amber' : 'red');
    document.getElementById('sum-pomodoros').textContent = completedPomodoros;
    document.getElementById('sum-time').textContent = Math.floor(totalFocusSecs/60) + 'm ' + (totalFocusSecs%60) + 's';
    document.getElementById('sum-tabs').textContent = tabSwitches;
    document.getElementById('sum-inactivity').textContent = inactivityWarnings;
    showPhase('summary');
  }

  function restartApp() {
    taskInput.value = ''; btnStart.disabled = true;
    showPhase('input');
  }

  // Tab switch detection
  function onVisibility() {
    if (document.hidden && isRunning && !isBreak) {
      tabSwitches++;
      showWarning('tab');
    }
  }

  // Inactivity detection
  function resetActivity() { lastActivity = Date.now(); }
  function startInactivityCheck() {
    clearInterval(inactivityChecker);
    inactivityChecker = setInterval(() => {
      if (isRunning && !isBreak && Date.now() - lastActivity > 60000) {
        inactivityWarnings++;
        lastActivity = Date.now();
        showWarning('inactivity');
      }
    }, 10000);
  }

  // Warning popup
  function showWarning(type) {
    const overlay = document.getElementById('warning-overlay');
    if (type === 'tab') {
      document.getElementById('w-icon').textContent = '👁';
      document.getElementById('w-icon').className = 'warning-icon-wrap red';
      document.getElementById('w-title').textContent = 'Tab Switch Detected!';
      document.getElementById('w-msg').textContent = getRandom(TAB_ROASTS);
      document.getElementById('w-btn').className = 'btn-dismiss red';
    } else {
      document.getElementById('w-icon').textContent = '🌙';
      document.getElementById('w-icon').className = 'warning-icon-wrap amber';
      document.getElementById('w-title').textContent = 'Are You Still There?';
      document.getElementById('w-msg').textContent = getRandom(INACTIVITY_ROASTS);
      document.getElementById('w-btn').className = 'btn-dismiss amber';
    }
    overlay.classList.add('show');
  }

  function dismissWarning() {
    document.getElementById('warning-overlay').classList.remove('show');
    lastActivity = Date.now();
  }

  // Init
  showPhase('input');