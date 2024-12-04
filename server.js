const express = require('express');
const app = express();
const port = 3000;
const axios = require('axios');
require('dotenv').config();

app.use(express.static('public'));
app.use(express.json());

const API_TOKEN = process.env.API_TOKEN;
const API_URL = 'https://api.sportmonks.com/v3/football/players';

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

const usedPlayers = new Set(); // Keep track of used players
const allPlayers = []; // Store all players from API
let lastFetchTime = 0; // Track when we last fetched players
const FETCH_INTERVAL = 1000 * 60 * 60; // Refresh player list every hour

async function fetchAllPlayers() {
    try {
        const response = await axios.get(`${API_URL}?api_token=${API_TOKEN}`);
        allPlayers.length = 0; // Clear existing players
        allPlayers.push(...response.data.data);
        lastFetchTime = Date.now();
        usedPlayers.clear(); // Reset used players when getting fresh data
        console.log(`Fetched ${allPlayers.length} players`);
    } catch (error) {
        console.error('Error fetching players:', error);
    }
}

async function getRandomPlayer() {
    try {
        // Refresh player list if needed
        if (Date.now() - lastFetchTime > FETCH_INTERVAL || allPlayers.length === 0) {
            await fetchAllPlayers();
        }

        // Get available players (those not used yet)
        const availablePlayers = allPlayers.filter(player => !usedPlayers.has(player.id));

        // If we're running low on players, refresh the used list
        if (availablePlayers.length < 5) {
            usedPlayers.clear();
            return getRandomPlayer(); // Try again with cleared cache
        }

        // Get random player from available ones
        const randomPlayer = availablePlayers[Math.floor(Math.random() * availablePlayers.length)];
        
        // Mark this player as used
        usedPlayers.add(randomPlayer.id);

        console.log(`Selected player ${randomPlayer.display_name || randomPlayer.name}, ${usedPlayers.size} players used`);
        
        return {
            name: randomPlayer.display_name || randomPlayer.name,
            image: randomPlayer.image_path,
        };
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

        const randomPlayer = await getRandomPlayer();
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

app.get('/view-role', async (req, res) => {
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


// Modify the reset-game endpoint to optionally clear the cache
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

    // Only clear used players if explicitly requested
    if (req.query.clearCache === 'true') {
        usedPlayers.clear();
        console.log('Cleared player cache');
    }

    res.json({ status: 'reset' });
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.listen(port, () => {
    console.log(`Game server running at http://localhost:${port}`);
});