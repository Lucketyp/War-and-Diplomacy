import Player from "./models/player.model.js";
import Lobby from "./models/lobby.model.js";
import Game from "./models/game.model.js";
import db from "./db.js";
import sessionhandler from "./sessionhandler.js";

class Model {
  constructor() {
    this.players = {};
    this.lobbies = {};
    this.games = {};

    this.loadOngoingGames();
  }

  getPlayers() {
    return this.players;
  }

  async getPlayerById(id) {
    // return this.players[id];
    console.log("Getting player with id", id);
    console.log(this.players);
    if (Object.keys(this.players).includes(id) === false) {
      console.log("Player not found, loading player");
      await this.loadPlayer(id);
      if (Object.keys(this.players).includes(id) === false) return null;
    }
    return this.players[id];
  }

  async createPlayer(id, name) {
    console.log("Creating player", id, name);
    const player = new Player(name);
    this.players[id] = player;
    await db.updateCurrentID(name, id);
    return player;
  }

  async createPlayersFromDb(players) {
    const playerObjects = [];
    players.forEach(async (player) => {
      // Get id from db
      const id = await db.getCurrentID(player.name);
      this.players[id] = Player.fromDb(player);
      playerObjects.push(this.players[id]);
    });
    return playerObjects;
  }

  async loadPlayer(id) {
    const name = await db.getUsernameFromID(id);
    this.players[id] = new Player(name);
    sessionhandler.addSession(id, name);
  }

  createLobby(adminName) {
    this.lobbies[adminName] = new Lobby(adminName);
  }

  joinLobby(adminName, player) {
    this.lobbies[adminName].addPlayer(player);
  }

  leaveLobby(adminName, player) {
    if (!this.lobbies[adminName]) return;
    this.lobbies[adminName].removePlayer(player);
    if (this.lobbies[adminName].isEmpty()) {
      this.deleteLobby(adminName);
    }
  }

  getAllLobbies() {
    return this.lobbies;
  }

  getLobby(adminName) {
    console.log("Getting lobby", adminName);
    console.log(this.lobbies);
    return this.lobbies[adminName];
  }

  deleteLobby(admin) {
    delete this.lobbies[admin];
  }

  async startGame(admin, players) {
    // Detta är en ganska ful funktion för jag byggde inte systemet med id i åtanke från början
    if (this.games[admin]) this.endGame(admin); // Ensures one game per admin

    const id = await db.createGame(
      admin,
      players,
      2, // Placement turns
      {} // Initial game state
    );

    this.games[admin] = new Game(admin, players, id);

    const playersToSave = this.games[admin].getPlayers();
    await db.savePlayers(id, playersToSave);

    this.deleteLobby(admin);
  }

  async endGame(admin) {
    await db.endGame(this.games[admin].id);
    delete this.games[admin];
  }

  getGame(admin) {
    return this.games[admin];
  }

  async loadOngoingGames() {
    // Load ongoing games from database
    const gamesToLoad = await db.getOngoingGames();
    if (gamesToLoad.length === 0) return;
    console.log(gamesToLoad);
    gamesToLoad.forEach(async (game) => {
      // Create player objects
      const PARSEDplayers = JSON.parse(game.players);
      const PARSEDgameState = JSON.parse(game.gameState);

      const players = await this.createPlayersFromDb(PARSEDplayers);

      this.games[game.admin] = Game.loadGame(
        game.admin,
        players,
        game.placementTurns,
        PARSEDgameState,
        game.id
      );
    });
  }

  gameOnGoing(admin) {
    if (this.games[admin]) {
      if (this.games[admin].ongoing) {
        return true;
      }
      delete this.games[admin];
    }
    return false;
  }

  getOngoingGameAdmin(player) {
    if (Object.keys(this.games).length === 0) return undefined;

    // Return the admin name of the game the player is in or null
    if (this.gameOnGoing(player.name)) {
      return player.name;
    }

    return Object.keys(this.games).find((admin) =>
      this.games[admin].hasPlayer(player)
    );
  }
}

export default new Model();
