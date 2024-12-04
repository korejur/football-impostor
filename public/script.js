function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
    setTimeout(() => {
        errorDiv.classList.add('hidden');
    }, 3000);
}

async function startGame() {
    const totalPlayers = parseInt(document.getElementById('playerCount').value);
    const numImpostors = parseInt(document.getElementById('impostorCount').value);

    try {
        const response = await fetch(`/start-game?players=${totalPlayers}&impostors=${numImpostors}`);
        const data = await response.json();

        console.log('Start game response:', data);

        if (data.status === 'started') {
            document.getElementById('startSection').classList.add('hidden');
            document.getElementById('viewSection').classList.remove('hidden');
            document.getElementById('playerNumber').textContent = 'Player 1, get ready!';
        } else if (data.status === 'error') {
            showError(data.message);
        }
    } catch (error) {
        console.error('Error starting game:', error);
        showError('Failed to start game. Please try again.');
    }
}

async function viewRole() {
    try {
        const response = await fetch('/view-role');
        const data = await response.json();

        if (data.status === 'success') {
            document.getElementById('viewSection').classList.add('hidden');
            document.getElementById('roleSection').classList.remove('hidden');

            if (data.role === 'impostor') {
                document.getElementById('roleDisplay').textContent = 'You are an IMPOSTOR';
                document.getElementById('playerCard').classList.remove('hidden'); // Changed this line
                document.getElementById('playerImage').src = "impostor.jpg";
                document.getElementById('playerName').textContent = "OOPS";
            } else {
                document.getElementById('roleDisplay').textContent = 'You are a regular player';
                document.getElementById('playerCard').classList.remove('hidden');
                document.getElementById('playerImage').src = data.playerData.image;
                document.getElementById('playerName').textContent = data.playerData.name;
            }
        }
    } catch (error) {
        console.error('Error viewing role:', error);
        showError('Failed to view role. Please try again.');
    }
}

async function nextPlayer() {
    try {
        document.getElementById('roleSection').classList.add('hidden');

        const response = await fetch('/next-player');
        const data = await response.json();

        if (data.gameComplete) {
            document.getElementById('gameComplete').classList.remove('hidden');
        } else {
            document.getElementById('viewSection').classList.remove('hidden');
            document.getElementById('playerNumber').textContent = `Next player, get ready!`;
        }
    } catch (error) {
        console.error('Error moving to next player:', error);
        showError('Failed to move to next player. Please try again.');
    }
}

async function resetGame() {
    try {
        await fetch('/reset-game?clearCache=true');
        document.getElementById('startSection').classList.remove('hidden');
        document.getElementById('viewSection').classList.add('hidden');
        document.getElementById('roleSection').classList.add('hidden');
        document.getElementById('gameComplete').classList.add('hidden');
        document.getElementById('roleDisplay').textContent = '';
        document.getElementById('playerCard').classList.add('hidden');
        document.getElementById('playerImage').src = '';
        document.getElementById('playerName').textContent = '';
    } catch (error) {
        console.error('Error resetting game:', error);
        showError('Failed to reset game. Please try again.');
    }
}
