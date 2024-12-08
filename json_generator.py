import requests
import json
from typing import List, Dict

def fetch_players(url: str, headers: Dict[str, str]) -> List[str]:
    """
    Fetch players from the specified API endpoint.
    
    Args:
        url (str): The API endpoint URL
        headers (Dict[str, str]): Headers including API key
        
    Returns:
        List[str]: List of player names
    """
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        # Extract player names from the response
        players_data = response.json()
        player_names = []
        
        # The response is a list of player objects
        for player in players_data:
            if isinstance(player, dict) and 'name' in player:
                # Capitalize player names for better presentation
                name = player['name'].title()
                player_names.append(name)
        
        return player_names
    
    except requests.exceptions.RequestException as e:
        print(f"Error fetching data from {url}: {e}")
        return []

def main():
    # API configuration
    headers = {
        'X-RapidAPI-Key': '99ba89dd10mshb6ffa4d330b716cp1bdd83jsnafce8b135d5c',
        'X-RapidAPI-Host': 'football-leagues1.p.rapidapi.com'
    }
    
    # Fetch players from both leagues
    premier_league_players = fetch_players(
        "https://football-leagues1.p.rapidapi.com/premierLeague/players",
        headers
    )
    
    la_liga_players = fetch_players(
        "https://football-leagues1.p.rapidapi.com/laLiga/players",
        headers
    )
    
    # Combine players from both leagues and remove duplicates
    all_players = list(set(premier_league_players + la_liga_players))
    
    # Sort alphabetically for better organization
    all_players.sort()
    
    # Create the data structure for the game
    game_data = {
        "players": all_players
    }
    
    # Save to data.json
    try:
        with open('data.json', 'w', encoding='utf-8') as f:
            json.dump(game_data, f, ensure_ascii=False, indent=2)
        print(f"Successfully saved {len(all_players)} players to data.json")
        
        # Print first few players as a sample
        print("\nSample of players saved:")
        for player in all_players[:5]:
            print(f"- {player}")
    
    except IOError as e:
        print(f"Error saving data.json: {e}")

if __name__ == "__main__":
    main()