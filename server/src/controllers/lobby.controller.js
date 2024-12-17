import { Router } from "express";
import model from "../model.js";
import sessionhandler from "../sessionhandler.js";

const lobbyRouter = Router();
/**
 * API (see the route handlers below) should combine uniquely identifiable resources (paths)
 * with the appropriate HTTP request methods (GET, POST, PUT, DELETE and more) to manipulate them.
 */

lobbyRouter.get("/lobbies", async (req, res) => {
  console.log("Getting lobbies");
  const lobbies = model.getAllLobbies();

  const { id } = req.session;
  console.log("Session id", id);

  res.status(200).json({ lobbies }).end();
});

lobbyRouter.post("/lobby/:admin", async (req, res) => {
  const { admin } = req.params;

  const { id, socketID } = req.session;
  const player = await model.getPlayerById(id);

  if (player === undefined || player.name !== admin) {
    res.status(404).end();
    return;
  }

  console.log("Creating lobby", admin, player);

  model.createLobby(admin);
  model.joinLobby(admin, player);
  sessionhandler.joinRoom(socketID, admin);

  req.session.room = admin;
  req.session.save();

  sessionhandler.broadcastLobbies(model.getAllLobbies());

  res.status(201).end();
});

lobbyRouter.get("/lobby/:admin", async (req, res) => {
  const { admin } = req.params;
  const lobby = model.getLobby(admin);

  if (lobby === undefined) {
    res.status(404).end();
    return;
  }

  res.status(200).json({ lobby });
});

lobbyRouter.put("/lobby/:admin/join", async (req, res) => {
  const { admin } = req.params;
  const lobby = model.getLobby(admin);

  const { id, socketID } = req.session;
  const player = await model.getPlayerById(id);

  console.log("Joining lobby", admin, player);

  if (lobby === undefined || player === undefined) {
    res.status(404).end();
    return;
  }

  if (lobby.isFull()) {
    res.status(403).end();
    return;
  }

  model.joinLobby(admin, player);
  sessionhandler.joinRoom(socketID, admin);

  req.session.room = admin;
  req.session.save();

  sessionhandler.broadcastLobbies(model.getAllLobbies());
  sessionhandler.broadcastPlayers(lobby);

  res.status(200).end();
});

lobbyRouter.put("/lobby/:admin/leave", async (req, res) => {
  const { admin } = req.params;
  const lobby = model.getLobby(admin);

  const { id } = req.session;
  const player = await model.getPlayerById(id);

  if (lobby === undefined || player === undefined) {
    res.status(404).end();
    return;
  }

  model.leaveLobby(admin, player);
  sessionhandler.leaveRoom(id, lobby.admin);

  req.session.room = null;
  req.session.save();

  sessionhandler.broadcastLobbies(model.getAllLobbies());
  sessionhandler.broadcastPlayers(lobby);

  res.status(200).end();
});

lobbyRouter.delete("/lobby/:admin", async (req, res) => {
  const { admin } = req.params;

  model.deleteLobby(admin);
  sessionhandler.broadcastLobbies(model.getAllLobbies());

  res.status(200).end();
});

export default lobbyRouter;
