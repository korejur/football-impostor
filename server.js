const express = require('express');
const app = express();
const port = 3000;
const fs = require('fs'); // Add this for reading JSON file
const path = require('path');

app.use(express.static('public'));
app.use(express.json());

// Game state
let currentGameState = {
    isActive: false,
    player: null,
    totalPlayers: 0,
    numImpostors: 0,
    currentPlayerIndex: 0,
    impostorIndices: [],
    viewedPlayers: []
};

let allPlayers = []; // Will store players from data.json
const usedPlayers = new Set(); // Keep track of used players

// Load players from data.json
function loadPlayers() {
    try {
        const rawData = fs.readFileSync(path.join(__dirname, 'data.json'));
        const data = JSON.parse(rawData);
        allPlayers = data.players.map((name, index) => ({
            id: index.toString(), // Create unique ID for each player
            name: name // Keep the name as is
        }));
        console.log(`Loaded ${allPlayers.length} players from data.json`);
    } catch (error) {
        console.error('Error loading players from data.json:', error);
        allPlayers = []; // Reset to empty array if there's an error
    }
}

// Get a random player that hasn't been used
function getRandomPlayer() {
    try {
        // If all players have been used or no players loaded, reload the data
        if (usedPlayers.size >= allPlayers.length || allPlayers.length === 0) {
            console.log('Refreshing player pool');
            loadPlayers();
            usedPlayers.clear();
        }

        // Get available players (not already used)
        const availablePlayers = allPlayers.filter(player => !usedPlayers.has(player.id));

        if (availablePlayers.length === 0) {
            throw new Error('No available players');
        }

        // Pick a random player
        const randomPlayer = availablePlayers[Math.floor(Math.random() * availablePlayers.length)];

        // Mark this player as used
        usedPlayers.add(randomPlayer.id);

        console.log(`Selected random player: ${randomPlayer.name}`);
        return randomPlayer;
    } catch (error) {
        console.error('Error getting random player:', error);
        return null;
    }
}

app.get('/start-game', async (req, res) => {
    try {
        const totalPlayers = parseInt(req.query.players);
        const numImpostors = parseInt(req.query.impostors);

        console.log('Starting game with:', { totalPlayers, numImpostors });

        if (isNaN(totalPlayers) || isNaN(numImpostors)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid player or impostor count'
            });
        }

        if (totalPlayers < 3) {
            return res.status(400).json({
                status: 'error',
                message: 'Minimum 3 players required'
            });
        }

        if (numImpostors >= totalPlayers || numImpostors < 1) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid number of impostors'
            });
        }

        const randomPlayer = getRandomPlayer();
        if (!randomPlayer) {
            return res.status(500).json({
                status: 'error',
                message: 'Failed to fetch player data'
            });
        }

        // Generate random impostor positions
        const impostorIndices = [];
        while (impostorIndices.length < numImpostors) {
            const randomIndex = Math.floor(Math.random() * totalPlayers);
            if (!impostorIndices.includes(randomIndex)) {
                impostorIndices.push(randomIndex);
            }
        }

        // Reset game state with new configuration
        currentGameState = {
            isActive: true,
            player: randomPlayer,
            totalPlayers: totalPlayers,
            numImpostors: numImpostors,
            currentPlayerIndex: 0,
            impostorIndices: impostorIndices,
            viewedPlayers: []
        };

        res.json({ status: 'started' });

    } catch (error) {
        console.error('Error starting game:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to start game'
        });
    }
});

app.get('/view-role', (req, res) => {
    if (!currentGameState.isActive ||
        currentGameState.currentPlayerIndex >= currentGameState.totalPlayers) {
        res.json({ status: 'gameOver' });
        return;
    }

    const currentIndex = currentGameState.currentPlayerIndex;
    const isImpostor = currentGameState.impostorIndices.includes(currentIndex);

    currentGameState.viewedPlayers.push(currentIndex);

    res.json({
        status: 'success',
        playerNumber: currentIndex + 1,
        totalPlayers: currentGameState.totalPlayers,
        role: isImpostor ? 'impostor' : 'player',
        playerData: isImpostor ? null : currentGameState.player
    });
});

app.get('/next-player', (req, res) => {
    if (currentGameState.currentPlayerIndex < currentGameState.totalPlayers) {
        currentGameState.currentPlayerIndex++;
        res.json({
            status: 'success',
            gameComplete: currentGameState.currentPlayerIndex >= currentGameState.totalPlayers
        });
    } else {
        res.json({ status: 'gameOver' });
    }
});

app.get('/reset-game', (req, res) => {
    currentGameState = {
        isActive: false,
        player: null,
        totalPlayers: 0,
        numImpostors: 0,
        currentPlayerIndex: 0,
        impostorIndices: [],
        viewedPlayers: []
    };

    if (req.query.clearCache === 'true') {
        usedPlayers.clear();
        loadPlayers(); // Reload players when cache is cleared
        console.log('Cleared player cache and reloaded data');
    }

    res.json({ status: 'reset' });
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Load players when server starts
loadPlayers();

app.listen(port, () => {
    console.log(`Game server running at http://localhost:${port}`);
});