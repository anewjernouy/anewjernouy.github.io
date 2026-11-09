'use strict';

// LOCAL DOMAIN V6 — static, account-free client-side app.
const pages = [...document.querySelectorAll('.page')];
const nav = [...document.querySelectorAll('.nav-btn')];
function showPage(id) {
  pages.forEach(page => page.classList.toggle('active', page.id === id));
  nav.forEach(button => button.classList.toggle('active', button.dataset.page === id));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
document.querySelectorAll('[data-page]').forEach(el => el.addEventListener('click', () => showPage(el.dataset.page)));

// Mini-browser: local tab/history controls around a normal iframe.
const frame = document.getElementById('webFrame');
const frameMessage = document.getElementById('frameMessage');
const address = document.getElementById('address');
const tabsEl = document.getElementById('browserTabs');
let nextTabId = 2;
let activeTabId = 1;
const tabs = [{ id: 1, title: 'New tab', url: '', history: [], index: -1 }];
const currentTab = () => tabs.find(tab => tab.id === activeTabId);

function normalizeAddress(raw) {
  const value = String(raw || '').trim();
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  if (/^[\w-]+\.[a-z]{2,}([/:?#]|$)/i.test(value)) return `https://${value}`;
  return `https://html.duckduckgo.com/html/?kl=uk-en&q=${encodeURIComponent(value)}`;
}
function setFrameMessage(title, body, showExternal = false) {
  if (!frameMessage) return;
  frameMessage.innerHTML = `<div class="big-globe">🌌</div><h3>${title}</h3><p>${body}</p><small>Some websites block embedded viewing. LOCAL cannot override those site security rules.</small>${showExternal ? '<button class="primary-action" id="fallbackOpen">Open this page in a new tab ↗</button>' : ''}`;
  frameMessage.classList.remove('is-hidden');
  const fallback = document.getElementById('fallbackOpen');
  if (fallback) fallback.addEventListener('click', openExternal);
}
function renderTabs() {
  tabsEl.querySelectorAll('.tab').forEach(el => el.remove());
  const add = tabsEl.querySelector('.tab-add');
  tabs.forEach(tab => {
    const button = document.createElement('button');
    button.className = `tab${tab.id === activeTabId ? ' active' : ''}`;
    button.type = 'button';
    const label = document.createElement('span');
    label.className = 'tab-label';
    label.textContent = tab.title;
    const close = document.createElement('span');
    close.className = 'tab-close';
    close.textContent = '×';
    close.title = 'Close tab';
    close.addEventListener('click', event => { event.stopPropagation(); closeTab(tab.id); });
    button.append(label, close);
    button.addEventListener('click', () => activateTab(tab.id));
    tabsEl.insertBefore(button, add);
  });
}
function updateControls() {
  const tab = currentTab();
  document.getElementById('backBtn').disabled = !tab || tab.index <= 0;
  document.getElementById('forwardBtn').disabled = !tab || tab.index >= tab.history.length - 1;
  document.getElementById('externalBtn').disabled = !tab || !tab.url;
  document.getElementById('reloadBtn').disabled = !tab || !tab.url;
}
function displayCurrent() {
  const tab = currentTab();
  if (!tab) return;
  address.value = tab.url || '';
  if (tab.url) {
    frame.style.display = 'block';
    frameMessage.classList.add('is-hidden');
    frame.src = tab.url;
  } else {
    frame.src = 'about:blank';
    frame.style.display = 'none';
    setFrameMessage('Your browser space', 'Search DuckDuckGo or enter a website address above.');
  }
  renderTabs();
  updateControls();
}
function activateTab(id) { activeTabId = id; displayCurrent(); }
function newTab() {
  const id = nextTabId++;
  tabs.push({ id, title: 'New tab', url: '', history: [], index: -1 });
  activateTab(id); showPage('browser'); address.focus();
}
function closeTab(id) {
  if (tabs.length === 1) {
    const tab = tabs[0]; Object.assign(tab, { title: 'New tab', url: '', history: [], index: -1 });
    activeTabId = tab.id; displayCurrent(); return;
  }
  const index = tabs.findIndex(tab => tab.id === id);
  tabs.splice(index, 1);
  if (activeTabId === id) activeTabId = tabs[Math.max(0, index - 1)].id;
  displayCurrent();
}
function visit(raw, addHistory = true) {
  const url = normalizeAddress(raw);
  if (!url) return;
  const tab = currentTab();
  if (addHistory) {
    tab.history = tab.history.slice(0, tab.index + 1);
    tab.history.push(url);
    tab.index = tab.history.length - 1;
  }
  tab.url = url;
  try { tab.title = new URL(url).hostname.replace(/^www\./, '').slice(0, 22) || 'New tab'; }
  catch { tab.title = 'Search'; }
  displayCurrent();
}
function goBack() { const tab = currentTab(); if (tab.index > 0) { tab.index--; tab.url = tab.history[tab.index]; displayCurrent(); } }
function goForward() { const tab = currentTab(); if (tab.index < tab.history.length - 1) { tab.index++; tab.url = tab.history[tab.index]; displayCurrent(); } }
function openExternal() {
  const tab = currentTab();
  if (tab?.url) window.open(tab.url, '_blank', 'noopener,noreferrer');
}
document.getElementById('visitBtn').addEventListener('click', () => visit(address.value));
address.addEventListener('keydown', event => { if (event.key === 'Enter') visit(address.value); });
document.getElementById('backBtn').addEventListener('click', goBack);
document.getElementById('forwardBtn').addEventListener('click', goForward);
document.getElementById('reloadBtn').addEventListener('click', () => { const tab = currentTab(); if (tab?.url) { frame.src = 'about:blank'; requestAnimationFrame(() => { frame.src = tab.url; }); } });
document.getElementById('externalBtn').addEventListener('click', openExternal);
document.getElementById('newTabBtn').addEventListener('click', newTab);
document.getElementById('homeSearchBtn').addEventListener('click', () => { showPage('browser'); visit(document.getElementById('homeSearch').value); });
document.getElementById('homeSearch').addEventListener('keydown', event => { if (event.key === 'Enter') { showPage('browser'); visit(event.target.value); } });
document.querySelectorAll('[data-url]').forEach(button => button.addEventListener('click', () => visit(button.dataset.url)));
document.querySelectorAll('[data-open]').forEach(button => button.addEventListener('click', event => { event.preventDefault(); showPage('browser'); visit(button.dataset.open); }));
renderTabs(); updateControls();

// Original games made for LOCAL. No remote game is represented as locally playable.
const area = document.getElementById('gameArea');
const stage = document.getElementById('gameStage');
const gameTitle = document.getElementById('gameTitle');
let activeGameCleanup = null;
function startGame(id, name) {
  if (activeGameCleanup) activeGameCleanup();
  stage.classList.remove('hidden');
  gameTitle.textContent = name;
  stage.scrollIntoView({ behavior: 'smooth', block: 'start' });

  if (id === 'clickrush') {
    area.innerHTML = '<div><div class="score" id="score">0 clicks</div><p id="timer">15 seconds left</p><button class="big-game-button" id="clickBtn">CLICK ME!</button><p id="gameHint">Click as many times as you can.</p></div>';
    let score = 0, seconds = 15, ended = false;
    const button = document.getElementById('clickBtn');
    button.onclick = () => { if (!ended) document.getElementById('score').textContent = `${++score} clicks`; };
    const timer = setInterval(() => {
      seconds--; document.getElementById('timer').textContent = `${seconds} seconds left`;
      if (seconds <= 0) { clearInterval(timer); ended = true; button.disabled = true; button.textContent = 'Finished!'; document.getElementById('gameHint').textContent = `Final score: ${score} clicks. Press Play to try again.`; }
    }, 1000);
    activeGameCleanup = () => clearInterval(timer);
  } else if (id === 'reaction') {
    area.innerHTML = '<div><h3 id="reactText">Press start, then wait for green...</h3><button class="big-game-button" id="reactBtn">START</button><p id="reactResult"></p></div>';
    let start = 0, timeout;
    const button = document.getElementById('reactBtn');
    button.onclick = () => {
      if (button.dataset.state === 'wait') { clearTimeout(timeout); document.getElementById('reactText').textContent = 'Too soon!'; button.textContent = 'TRY AGAIN'; button.dataset.state = ''; return; }
      if (button.dataset.state === 'go') { document.getElementById('reactResult').textContent = `Your time: ${(performance.now() - start).toFixed(0)} ms`; button.textContent = 'TRY AGAIN'; button.dataset.state = ''; return; }
      button.dataset.state = 'wait'; button.textContent = 'WAIT'; document.getElementById('reactText').textContent = 'Wait for green...';
      timeout = setTimeout(() => { start = performance.now(); button.dataset.state = 'go'; button.textContent = 'CLICK NOW'; document.getElementById('reactText').textContent = 'GO!'; }, 1200 + Math.random() * 2800);
    };
    activeGameCleanup = () => clearTimeout(timeout);
  } else if (id === 'tictactoe') {
    area.innerHTML = `<div><h3 id="turn">X goes first</h3><div class="ttt">${Array.from({ length: 9 }, (_, i) => `<button data-cell="${i}" aria-label="Square ${i + 1}"></button>`).join('')}</div><button class="ghost-btn" id="resetTtt" style="margin-top:14px">Restart</button></div>`;
    const board = Array(9).fill(''); let turn = 'X', done = false;
    const cells = [...area.querySelectorAll('[data-cell]')];
    const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    function reset() { board.fill(''); turn = 'X'; done = false; cells.forEach(cell => { cell.textContent = ''; }); document.getElementById('turn').textContent = 'X goes first'; }
    cells.forEach(cell => cell.onclick = () => {
      const index = Number(cell.dataset.cell); if (done || board[index]) return;
      board[index] = turn; cell.textContent = turn;
      if (wins.some(line => line.every(i => board[i] === turn))) { document.getElementById('turn').textContent = `${turn} wins!`; done = true; }
      else if (board.every(Boolean)) { document.getElementById('turn').textContent = 'Draw!'; done = true; }
      else { turn = turn === 'X' ? 'O' : 'X'; document.getElementById('turn').textContent = `${turn} goes next`; }
    });
    document.getElementById('resetTtt').onclick = reset;
    activeGameCleanup = () => {};
  } else if (id === 'number') {
    const secret = Math.floor(Math.random() * 20) + 1;
    area.innerHTML = '<div><h3>Guess a number from 1 to 20</h3><input id="guess" type="number" min="1" max="20" class="game-input"><button class="big-game-button" id="guessBtn">GUESS</button><p id="guessHint">You have unlimited guesses.</p></div>';
    document.getElementById('guessBtn').onclick = () => { const value = Number(document.getElementById('guess').value); document.getElementById('guessHint').textContent = !value || value < 1 || value > 20 ? 'Enter a number from 1 to 20.' : value === secret ? 'Correct! You got it!' : value < secret ? 'Too low — try again.' : 'Too high — try again.'; };
    activeGameCleanup = () => {};
  } else if (id === 'memory') {
    const symbols = ['🌙','⭐','🪐','☄️','🌌','🚀','🌙','⭐','🪐','☄️','🌌','🚀'].sort(() => Math.random() - .5);
    area.innerHTML = `<div><p id="memoryStatus">Find all 6 matching pairs.</p><div class="memory-grid">${symbols.map((_, i) => `<button class="memory-card" data-card="${i}" aria-label="Hidden card ${i + 1}">?</button>`).join('')}</div><button class="ghost-btn" id="memoryAgain">Restart</button></div>`;
    let first = null, locked = false, matches = 0, hideTimer;
    const cards = [...area.querySelectorAll('[data-card]')];
    cards.forEach(card => card.onclick = () => {
      const i = Number(card.dataset.card); if (locked || card.classList.contains('matched') || card === first) return;
      card.textContent = symbols[i]; card.classList.add('revealed');
      if (!first) { first = card; return; }
      const a = Number(first.dataset.card);
      if (symbols[a] === symbols[i]) { first.classList.add('matched'); card.classList.add('matched'); first = null; matches++; document.getElementById('memoryStatus').textContent = matches === 6 ? 'All pairs found — nice work!' : `${matches} of 6 pairs found.`; }
      else { locked = true; const previous = first; first = null; hideTimer = setTimeout(() => { previous.textContent = '?'; card.textContent = '?'; previous.classList.remove('revealed'); card.classList.remove('revealed'); locked = false; }, 750); }
    });
    document.getElementById('memoryAgain').onclick = () => startGame('memory', 'Memory Match');
    activeGameCleanup = () => clearTimeout(hideTimer);
  } else if (id === 'quickmath') {
    area.innerHTML = '<div><h3 id="mathQuestion">Ready?</h3><input id="mathAnswer" type="number" class="game-input" placeholder="Your answer"><button class="big-game-button" id="mathSubmit">CHECK</button><p id="mathFeedback">Solve 10 quick questions.</p><p id="mathProgress">Question 1 of 10</p></div>';
    let question = 0, score = 0, answer = 0;
    const next = () => { const a = 2 + Math.floor(Math.random() * 10), b = 2 + Math.floor(Math.random() * 10); answer = a * b; document.getElementById('mathQuestion').textContent = `${a} × ${b} = ?`; document.getElementById('mathAnswer').value = ''; document.getElementById('mathAnswer').focus(); };
    const submit = () => { if (question >= 10) return; if (Number(document.getElementById('mathAnswer').value) === answer) score++; question++; if (question === 10) { document.getElementById('mathQuestion').textContent = 'Finished!'; document.getElementById('mathFeedback').textContent = `Your score: ${score}/10`; document.getElementById('mathProgress').textContent = 'Press Play to try again.'; document.getElementById('mathSubmit').disabled = true; } else { document.getElementById('mathFeedback').textContent = 'Answer checked.'; document.getElementById('mathProgress').textContent = `Question ${question + 1} of 10 · Score ${score}`; next(); } };
    document.getElementById('mathSubmit').onclick = submit;
    document.getElementById('mathAnswer').addEventListener('keydown', event => { if (event.key === 'Enter') submit(); });
    next(); activeGameCleanup = () => {};
  }
}
document.querySelectorAll('[data-game]').forEach(card => card.addEventListener('click', () => startGame(card.dataset.game, card.dataset.name)));
document.getElementById('closeGame').onclick = () => { if (activeGameCleanup) activeGameCleanup(); stage.classList.add('hidden'); };
document.getElementById('gameSearch').addEventListener('input', event => {
  const query = event.target.value.toLowerCase();
  document.querySelectorAll('.game-card').forEach(card => { card.style.display = card.dataset.name?.toLowerCase().includes(query) || card.textContent.toLowerCase().includes(query) ? '' : 'none'; });
});
document.getElementById('openDuckMaths').addEventListener('click', () => { showPage('browser'); visit('https://duckmaths.com/'); });

document.getElementById('effectsToggle').onchange = event => document.body.classList.toggle('no-effects', !event.target.checked);
document.getElementById('motionToggle').onchange = event => document.body.classList.toggle('reduce-motion', event.target.checked);
