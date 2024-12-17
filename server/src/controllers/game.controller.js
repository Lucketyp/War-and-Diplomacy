import { Router } from "express";
import model from "../model.js";
import sessionhandler from "../sessionhandler.js";

const gameRouter = Router();

/**
 * API (see the route handlers below) should combine uniquely identifiable resources (paths)
 * with the appropriate HTTP request methods (GET, POST, PUT, DELETE and more) to manipulate them.
 */

// Create a new game
gameRouter.post("/game/start", async (req, res) => {
  const { id } = req.session;
  const player = await model.getPlayerById(id);
  const lobby = model.getLobby(player.name);

  console.log("Starting game", player, lobby);

  if (lobby === undefined || player === undefined) {
    res.status(401).end();
    return;
  }

  lobby.setNotJoinable();

  await model.startGame(player.name, lobby.getPlayers());
  sessionhandler.broadcastStartGame(model.getGame(player.name));

  res.status(201).end();
});

// Get the game map, starting continent and game state
gameRouter.get("/game/:adminName", async (req, res) => {
  const { adminName } = req.params;
  const { id } = req.session;
  const game = model.getGame(adminName);
  const player = await model.getPlayerById(id);

  if (game === undefined) {
    res.status(404).end();
    return;
  }

  const map = game.getMap();
  const startingContinent = player.getStartingContinent();
  const gameState = game.getGameState();

  res.json({ map, startingContinent, gameState });
  res.status(200).end();
});

// Place a unit on a country
gameRouter.put("/game/:adminName/:countryName/placeUnit", async (req, res) => {
  const { adminName, countryName } = req.params;
  const { id } = req.session;
  const player = await model.getPlayerById(id);
  const game = model.getGame(adminName);

  if (game === undefined) {
    res.status(404).end();
    return;
  }

  if (!game.isValidPlacement(player, countryName) || !game.isPlacementTurn()) {
    res.status(400).end();
    return;
  }
  res.status(200).end();

  player.addOrder({ type: "placeUnit", countryName });
  game.endTurn(player);
});

// Check if a move is valid
gameRouter.get(
  "/game/:adminName/:fromCountry/:numUnits/:toCountry/moveUnit",
  async (req, res) => {
    const { adminName, fromCountry, toCountry, numUnits } = req.params;
    const { id } = req.session;
    const player = await model.getPlayerById(id);
    const game = model.getGame(adminName);

    if (game === undefined) {
      res.status(404).end();
      return;
    }

    if (
      game.isPlacementTurn() ||
      !game.isValidOrder(player, {
        type: "moveUnit",
        fromCountry,
        toCountry,
        numUnits,
      })
    ) {
      res.status(400).end();
      return;
    }

    res.status(200).end();
  }
);

// Send orders and end turn
gameRouter.put("/game/:adminName/endTurn", async (req, res) => {
  const { adminName } = req.params;
  const { id } = req.session;
  const { orders } = req.body;
  const player = await model.getPlayerById(id);
  const game = model.getGame(adminName);

  if (game === undefined) {
    res.status(404).end();
    return;
  }

  if (!game.areValidOrders(player, orders)) {
    res.status(400).end();
    return;
  }

  player.addOrders(orders);
  game.endTurn(player);

  res.status(200).end();
});

// End the game
gameRouter.delete("/game/:adminName/endGame", async (req, res) => {
  const { adminName } = req.params;
  const { id } = req.session;
  const player = await model.getPlayerById(id);
  const game = model.getGame(adminName);

  if (game === undefined || player === undefined) {
    res.status(404).end();
    return;
  }

  if (player.name !== game.admin) {
    res.status(401).end();
    return;
  }

  await model.endGame(adminName);
  sessionhandler.broadcastEndGame(game, "Game ended by admin");

  res.status(200).end();
});

export default gameRouter;
