import { Router } from "express";
import model from "../model.js";
import sessionhandler from "../sessionhandler.js";
import db from "../db.js";

const authRouter = Router();

/**
 * requireAuth is a middleware function that limit access to an endpoint to authenticated users.
 * @param {Request} req
 * @param {Response} res
 * @param {Function} next
 * @returns {void}
 */

const requireAuth = async (req, res, next) => {
  const { id } = req.session;
  const valid = sessionhandler.isValidSession(id);

  if (!valid) {
    // Check for reconnecting player
    console.log(id, "is not a valid session");

    const player = await model.getPlayerById(id);
    if (player) {
      console.log("Reconnecting player", player.name);
      sessionhandler.addSession(id, player.name);
      next();
      return;
    }

    console.log("Not reconnecting player");
    res.redirect("/api/logout");
  }

  next();
};

authRouter.get("/poll", (req, res) => {
  const { id } = req.session;

  console.debug("Polling session", id);

  const valid = sessionhandler.isValidSession(id);
  if (!valid) {
    console.log("Invalid session", id);
    res.status(401).end();
    return;
  }

  res.status(200).end();
});

authRouter.get("/logout", (req, res) => {
  const { id } = req.session;

  const valid = sessionhandler.isValidSession(id);
  if (!valid) {
    req.session.destroy();
    res.redirect("/login");
    return;
  }

  sessionhandler.removeSession(id);
  // invalidate the session
  req.session.destroy();
  res.status(200).end();
});

authRouter.post("/login", async (req, res) => {
  // Check how to access data being sent as a path, query, header and cookie parameter or in the HTTP request body
  const { username } = req.body;
  const { password } = req.body;
  const { id } = req.session;

  // Check if the given username and password are valid
  const playerId = await db.validLogin(username, password);

  if (playerId === false) {
    res.status(401).end();
    return;
  }

  await model.createPlayer(id, username);
  sessionhandler.addSession(id, username);

  req.session.save();

  res.status(200).end();
});

authRouter.post("/register", async (req, res) => {
  const { username, password } = req.body;

  try {
    await db.insertUser(username, password);
    res.status(200).end();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default authRouter;
export { requireAuth };
