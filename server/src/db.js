import sqlite3 from "sqlite3";
import bcrypt from "bcrypt";
import { open } from "sqlite";
import { resolvePath } from "./util.js";

sqlite3.verbose();

// Open and initialize the database
const db = await open({
  filename: resolvePath("db.sqlite"),
  driver: sqlite3.Database,
});

await db.run(`
  CREATE TABLE IF NOT EXISTS users (
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    currentID TEXT
  )
`);

// await db.run(`
//   DROP TABLE IF EXISTS games
// `);

await db.run(`
  CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin TEXT NOT NULL,
    players TEXT NOT NULL,
    placementTurns INTEGER NOT NULL,
    gameState TEXT NOT NULL,
    ongoing INTEGER NOT NULL
  )
`);

const insertUserAndPassword = await db.prepare(
  "INSERT INTO users (username, password) VALUES (?, ?)"
);

const selectUserAndPassword = await db.prepare(
  "SELECT * FROM users WHERE username = ?"
);

const countUsername = await db.prepare(
  "SELECT COUNT(*) as count FROM users WHERE username = ?"
);

class Database {
  static async usernameAvailable(username) {
    const result = await countUsername.get(username);
    return result.count === 0;
  }

  static async validLogin(username, password) {
    const user = await selectUserAndPassword.get(username);
    if (user === undefined) {
      return false;
    }

    return bcrypt.compare(password, user.password);
  }

  static validateUsernameAndPassword(username, password) {
    // Username and password must be at least 3 characters long
    const validRegex = /^.{3,}$/;

    if (!validRegex.test(username)) {
      throw new Error("Username must be at least 3 characters long");
    }

    if (!validRegex.test(password)) {
      throw new Error("Password must be at least 3 characters long");
    }
  }

  static async insertUser(username, password) {
    // Validate the username and password
    Database.validateUsernameAndPassword(username, password);

    // Check if the username exists
    const available = await Database.usernameAvailable(username);
    if (!available) {
      throw new Error("Username already exists");
    }

    // Hash the password
    const hash = await bcrypt.hash(password, 10);

    // Insert a new user
    await insertUserAndPassword.run(username, hash);
  }

  static async getCurrentID(username) {
    const user = await db.get(
      "SELECT * FROM users WHERE username = ?",
      username
    );
    if (user === undefined) {
      return undefined;
    }
    return user.currentID;
  }

  static async getUsernameFromID(id) {
    const user = await db.get("SELECT * FROM users WHERE currentID = ?", id);
    if (user === undefined) {
      return undefined;
    }
    return user.username;
  }

  static async updateCurrentID(username, id) {
    await db.run(
      "UPDATE users SET currentID = ? WHERE username = ?",
      id,
      username
    );
  }

  static async createGame(admin, players, placementTurns, gameState) {
    // players and gameState are JSON strings

    const p = JSON.stringify(players);
    const g = JSON.stringify(gameState);

    await db.run(
      "INSERT INTO games (admin, players, placementTurns, gameState, ongoing) VALUES (?, ?, ?, ?, 1)",
      admin,
      p,
      placementTurns,
      g
    );

    // Return the id of the game
    const result = await db.get("SELECT last_insert_rowid() as id");
    return result.id;
  }

  static async savePlayers(id, players) {
    const p = JSON.stringify(players);

    await db.run("UPDATE games SET players = ? WHERE id = ?", p, id);
  }

  static async getOngoingGames() {
    return db.all("SELECT * FROM games WHERE ongoing = 1");
  }

  static async getGame(id) {
    return db.get("SELECT * FROM games WHERE id = ?", id);
  }

  static async saveGame(id, gameState, placementTurns) {
    const g = JSON.stringify(gameState);

    console.log("Saving game state", g);

    await db.run(
      "UPDATE games SET gameState = ?, placementTurns = ? WHERE id = ?",
      g,
      placementTurns,
      id
    );
  }

  static async endGame(id) {
    // Throws a column index out of range error
    await db.run("UPDATE games SET ongoing = 0 WHERE id = ?", id);
  }
}

export default Database;
