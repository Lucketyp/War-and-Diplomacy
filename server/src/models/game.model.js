import { createGameMap } from "./map.model.js";
import sessionHandler from "../sessionhandler.js";
import db from "../db.js";

/**
 * @class Game
 */

/* eslint class-methods-use-this: ["error", { "exceptMethods": ["moveUnit", "support", "isValidMove"] }] */
class Game {
  constructor(admin, players, id) {
    this.admin = admin;
    this.players = players;
    this.id = id;
    this.donePlayers = [];
    this.map = createGameMap();
    this.allOrders = [];
    this.currentOrders = [];
    this.placementTurns = 2;
    this.ongoing = true;

    this.assignStartingContinents();
  }

  static loadGame(admin, players, placementTurns, gameState, id) {
    const game = new Game(admin, players, id);
    game.placementTurns = placementTurns;
    console.debug("Loading game state", gameState);
    if (Object.keys(gameState).length > 0) {
      game.setGameState(gameState);
    }

    return game;
  }

  hasPlayer(player) {
    return this.players.includes(player);
  }

  getPlayers() {
    return this.players;
  }

  assignStartingContinents() {
    const continents = this.map.getContinents();

    for (let i = 0; i < this.players.length; i += 1) {
      this.players[i].setStartingContinent(continents[i]);
    }
  }

  getCountry(countryName) {
    if (!this.map.getCountry(countryName)) {
      return null;
    }
    return this.map.countries[countryName];
  }

  getMap() {
    // Get map in JSON format
    return this.map.getMap();
  }

  getGameState() {
    const countries = this.map.getCountries();
    const gameState = {};

    countries.forEach((country) => {
      const owner = country.getOwner();
      const numUnits = country.getNumUnits();
      if (owner) {
        gameState[country.name] = { player: owner, units: numUnits };
      }
    });

    return gameState;
  }

  setGameState(gameState) {
    Object.keys(gameState).forEach((countryName) => {
      const { player, units } = gameState[countryName];
      this.map.countries[countryName].setNumUnits(player, units);
    });
  }

  isPlacementTurn() {
    return this.placementTurns > 0;
  }

  isValidPlacement(player, countryName) {
    const country = this.getCountry(countryName);

    if (country.continent !== player.getStartingContinent()) {
      console.debug(
        country.name,
        "is not in starting continent",
        player.getStartingContinent()
      );
      return false;
    }

    if (!country.hasRoomForUnit()) {
      console.debug("Country does not have room for unit");
      return false;
    }

    return true;
  }

  placeUnit(player, countryName) {
    console.debug("Placing unit for player", player.name, "on", countryName);
    this.map.countries[countryName].placeUnit(player.name);
  }

  areValidOrders(player, orders) {
    let valid = true;
    orders.forEach((order) => {
      if (!this.isValidOrder(player, order)) {
        valid = false;
      }
    });
    return valid;
  }

  isValidOrder(player, order) {
    switch (order.type) {
      case "moveUnit":
        try {
          const fromCountry = this.getCountry(order.fromCountry);
          const toCountry = this.getCountry(order.toCountry);
          const { numUnits } = order;
          return this.isValidMove(player, fromCountry, toCountry, numUnits);
        } catch (e) {
          console.log(e);
          return false;
        }
      case "support":
        return true;
      default:
        console.debug("Invalid order type");
        return false;
    }
  }

  isValidMove(player, fromCountry, toCountry, numUnits) {
    // VALID MOVE LOGIC HERE
    if (fromCountry.getOwner() !== player.getName()) {
      console.debug("Player does not own fromCountry");
      return false;
    }

    if (!fromCountry.isNeighbor(toCountry)) {
      console.debug("Countries are not neighbors");
      return false;
    }

    if (fromCountry.getNumUnits() < numUnits) {
      console.debug("Not enough units to move");
      return false;
    }

    return true;
  }

  endTurn(player) {
    // END TURN LOGIC HERE
    if (this.donePlayers.includes(player)) {
      return;
    }
    console.debug("Ending turn for", player.getName());
    this.donePlayers.push(player);
    if (this.donePlayers.length === this.players.length) {
      this.turnLogic();
    }
  }

  turnLogic() {
    const placementTurn = this.isPlacementTurn();

    this.players.forEach((player) => {
      const orders = player.popAllOrders();
      orders.forEach((order) => {
        this.allOrders.push({ player, order });
      });
    });

    // Execute all orders
    while (this.allOrders.length > 0) {
      this.executeOrders();
    }

    // Reset done players
    this.donePlayers = [];

    // End Turn logic if placement turn
    if (placementTurn) {
      this.placementTurns -= 1;
      sessionHandler.broadcastGameState(this);
    } else {
      // Check for winner

      // Broadcast game state
      sessionHandler.broadcastGameState(this);
    }

    // Save game state to database
    db.saveGame(this.id, this.getGameState(), this.placementTurns);

    const winner = this.checkForWinner();
    if (winner) {
      this.endGame(winner);
    }
  }

  executeOrders() {
    console.debug("Executing Orders");
    // Get the first order from each player from all orders
    this.players.forEach((player) => {
      const order = this.allOrders.find((o) => o.player === player);
      if (order) {
        this.allOrders = this.allOrders.filter((o) => o !== order);
        this.currentOrders.push(order);
      }
    });

    const affectedCountries = [];

    // Execute orders
    this.currentOrders.forEach(({ player, order }) => {
      switch (order.type) {
        case "placeUnit":
          this.placeUnit(player, order.countryName);
          break;
        case "moveUnit":
          this.moveUnit(
            player,
            order.fromCountry,
            order.toCountry,
            order.numUnits
          );
          affectedCountries.push(this.getCountry(order.toCountry));
          break;
        case "support":
          this.support(
            player,
            order.fromCountry,
            order.toCountry,
            order.numUnits,
            order.supportedPlayer
          );
          break;
        default:
          console.debug("Invalid order type");
      }
    });

    // Resolve free cities with owners
    const freeCities = this.map.getFreeCities();
    freeCities.forEach((country) => {
      if (country.getOwner()) {
        affectedCountries.push(country);
      }
    });

    affectedCountries.forEach((country) => {
      country.resolveTurn();
    });

    this.currentOrders = [];
  }

  moveUnit(player, fromCountryName, toCountryName, numUnits) {
    const fromCountry = this.getCountry(fromCountryName);
    const toCountry = this.getCountry(toCountryName);
    let numMoved = fromCountry.removeNumUnits(numUnits);
    if (fromCountry.isSeaNeighbor(toCountry)) numMoved -= 1;
    toCountry.addFutureUnits(player.name, fromCountry, numMoved);
  }

  checkForWinner() {
    // CHECK FOR WINNER LOGIC HERE
    // If only one player has countries, they win
    // If one player has half the countries, they win

    const playerCountries = {};
    const countries = this.map.getCountries();
    countries.forEach((country) => {
      const owner = country.getOwner();
      if (owner) {
        if (playerCountries[owner]) {
          playerCountries[owner] += 1;
        } else {
          playerCountries[owner] = 1;
        }
      }
    });

    const players = Object.keys(playerCountries);
    if (players.length === 1) {
      return players[0];
    }

    const numCountries = countries.length;
    let winner = null;

    players.forEach((player) => {
      if (playerCountries[player] === numCountries / 2) {
        winner = player.name;
      }
    });

    return winner;
  }

  async endGame(winner) {
    // END GAME LOGIC HERE
    this.ongoing = false;
    await db.endGame(this.id);
    const msg = `Game over! ${winner} wins!`;
    sessionHandler.broadcastEndGame(this, msg);
  }
}

export default Game;
