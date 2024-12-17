class SessionHandler {
  constructor() {
    this.io = undefined;
    this.sessions = {};
  }

  init(io) {
    this.io = io;
  }

  findSessionById(id) {
    return this.sessions[id].user;
  }

  addSession(id, user) {
    console.debug("Adding session", id, "for user", user);
    this.sessions[id] = { user, lastActive: Date.now() };
  }

  updateSession(id) {
    this.sessions[id].lastActive = Date.now();
  }

  isValidSession(id) {
    const session = this.sessions[id];
    if (session === undefined) {
      console.debug("Session not found", id);
      return false;
    }
    if (Date.now() - session.lastActive > 10 * 60 * 1000) {
      this.removeSession(id);
      console.debug("Session expired");
      console.debug(session.socket);
      this.io.to(session.socket).emit("logout");
      return false;
    }
    console.debug("Session valid", id);
    return true;
  }

  removeSession(id) {
    delete this.sessions[id];
  }

  logout(socketId) {
    this.io.emit("logout", socketId);
  }

  broadcastLobbies(lobbies) {
    console.debug("Broadcasting lobbies");
    this.io.emit("lobbies", lobbies);
  }

  broadcastPlayers(lobby) {
    console.debug("Broadcasting players");
    const players = lobby.getPlayers();
    this.io.in(lobby.admin).emit("players", players);
  }

  joinRoom(socketID, roomName) {
    console.debug(socketID, "Joining room", roomName);
    this.io.in(socketID).socketsJoin(roomName);
  }

  leaveRoom(socketID, roomName) {
    console.debug(socketID, "Leaving room", roomName);
    this.io.in(socketID).socketsLeave(roomName);
  }

  broadcastStartGame(game) {
    console.debug("Broadcasting game start");
    this.io.in(game.admin).emit("start");
  }

  broadcastGameState(game) {
    console.debug("Broadcasting game state");
    const gameState = game.getGameState();
    const placementTurn = game.isPlacementTurn();
    this.io.in(game.admin).emit("gameState", gameState);
    this.io.in(game.admin).emit("placementTurn", placementTurn);
  }

  broadcastEndGame(game, msg) {
    console.debug("Broadcasting end game");
    this.io.in(game.admin).emit("endGame", msg);
  }
}

export default new SessionHandler();
