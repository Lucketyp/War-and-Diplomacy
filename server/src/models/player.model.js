/**
 * @class Player
 */
class Player {
  constructor(name) {
    this.name = name;
    this.startingContinent = null;
    this.orders = [];
  }

  static fromDb(player) {
    const newPlayer = new Player(player.name);
    newPlayer.startingContinent = player.startingContinent;
    return newPlayer;
  }

  getName() {
    return this.name;
  }

  getStartingContinent() {
    return this.startingContinent;
  }

  setStartingContinent(continent) {
    this.startingContinent = continent;
  }

  addOrders(orders) {
    this.orders = this.orders.concat(orders);
  }

  addOrder(order) {
    this.orders.push(order);
  }

  popAllOrders() {
    const { orders } = this;
    this.orders = [];
    return orders;
  }

  getOrders() {
    return this.orders;
  }

  clearOrders() {
    this.orders = [];
  }
}

export default Player;
