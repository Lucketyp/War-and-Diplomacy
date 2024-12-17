/**
 * @class Lobby
 */
class Lobby {
  constructor(admin) {
    this.admin = admin;
    this.players = [];
    this.joinable = true;
  }

  getPlayers() {
    return this.players;
  }

  addPlayer(player) {
    this.players.push(player);
    if (this.players.length >= 4) {
      this.joinable = false;
    }
  }

  removePlayer(player) {
    this.players = this.players.filter((p) => p !== player);
    if (this.players.length < 4) {
      this.joinable = true;
    }
  }

  isFull() {
    return !this.joinable;
  }

  isEmpty() {
    return this.players.length === 0;
  }

  setNotJoinable() {
    this.joinable = false;
  }
}

export default Lobby;
