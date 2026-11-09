// Football Impostor — runs fully in the browser (no server needed),
// so it can be hosted on GitHub Pages.

let allPlayers = [];
const usedPlayers = new Set();

let game = {
  isActive: false,
  player: null,
  totalPlayers: 0,
  currentPlayerIndex: 0,
  impostorIndices: [],
};

const $ = (id) => document.getElementById(id);

// ---- Data ----
async function loadPlayers() {
  if (allPlayers.length) return;
  const res = await fetch('data.json');
  if (!res.ok) throw new Error(`data.json: HTTP ${res.status}`);
  const data = await res.json();
  allPlayers = data.players.map((name, i) => ({ id: String(i), name }));
}

// Random footballer that hasn't been used yet (pool refills when exhausted)
function getRandomPlayer() {
  if (usedPlayers.size >= allPlayers.length) usedPlayers.clear();
  const available = allPlayers.filter((p) => !usedPlayers.has(p.id));
  const pick = available[Math.floor(Math.random() * available.length)];
  usedPlayers.add(pick.id);
  return pick;
}

// Fisher–Yates shuffle of seat indices, take the first `count`
function pickImpostors(total, count) {
  const idx = Array.from({ length: total }, (_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx.slice(0, count);
}

// ---- UI ----
function showError(message) {
  const el = $('errorMessage');
  el.textContent = message;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 3000);
}

async function startGame() {
  const totalPlayers = parseInt($('playerCount').value);
  const numImpostors = parseInt($('impostorCount').value);

  if (isNaN(totalPlayers) || isNaN(numImpostors)) return showError('Invalid player or impostor count');
  if (totalPlayers < 3) return showError('Minimum 3 players required');
  if (numImpostors < 1 || numImpostors >= totalPlayers) return showError('Invalid number of impostors');

  try {
    await loadPlayers();
  } catch (error) {
    console.error('Error loading players:', error);
    return showError('Failed to load player data. Please try again.');
  }

  game = {
    isActive: true,
    player: getRandomPlayer(),
    totalPlayers,
    currentPlayerIndex: 0,
    impostorIndices: pickImpostors(totalPlayers, numImpostors),
  };

  $('startSection').classList.add('hidden');
  $('viewSection').classList.remove('hidden');
  $('playerNumber').textContent = 'Player 1, get ready!';
}

function viewRole() {
  if (!game.isActive || game.currentPlayerIndex >= game.totalPlayers) return;

  const isImpostor = game.impostorIndices.includes(game.currentPlayerIndex);

  $('viewSection').classList.add('hidden');
  $('roleSection').classList.remove('hidden');
  $('playerCard').classList.remove('hidden');
  $('roleDisplay').textContent = isImpostor ? 'You are an IMPOSTOR' : 'You are a regular player';
  $('playerName').textContent = isImpostor ? 'OOPS' : game.player.name;
}

function nextPlayer() {
  $('roleSection').classList.add('hidden');
  game.currentPlayerIndex++;

  if (game.currentPlayerIndex >= game.totalPlayers) {
    $('gameComplete').classList.remove('hidden');
  } else {
    $('viewSection').classList.remove('hidden');
    $('playerNumber').textContent = 'Next player, get ready!';
  }
}

function resetGame() {
  game = { isActive: false, player: null, totalPlayers: 0, currentPlayerIndex: 0, impostorIndices: [] };
  $('startSection').classList.remove('hidden');
  ['viewSection', 'roleSection', 'gameComplete', 'playerCard'].forEach((id) => $(id).classList.add('hidden'));
  $('roleDisplay').textContent = '';
  $('playerName').textContent = '';
}
