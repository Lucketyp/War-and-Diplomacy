import betterLogging from "better-logging";
import express from "express";
import expressSession from "express-session";
import socketIOSession from "express-socket.io-session";
import { createServer } from "https";
import { Server } from "socket.io";
import fs from "fs";
import helmet from "helmet";
import sanitizeHtml from "sanitize-html";
import connectSQLite3 from "connect-sqlite3";
import { resolvePath } from "./util.js";
import sessionhandler from "./sessionhandler.js";
import authRouter, { requireAuth } from "./controllers/auth.controller.js";
import lobbyRouter from "./controllers/lobby.controller.js";
import gameRouter from "./controllers/game.controller.js";

const SQLiteStore = connectSQLite3(expressSession);

const port = 8989;
const app = express();

// HTTPS configuration
const key = fs.readFileSync("./certs/mykey.key");
const cert = fs.readFileSync("./certs/mycert.crt");

const options = {
  key,
  cert,
};

const server = createServer(options, app);

const io = new Server(server);

console.log(expressSession.Store);
// Configure session management
const sessionConf = expressSession({
  store: new SQLiteStore(),
  secret: "Super secret! Shh! Do not tell anyone...",
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: true,
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
  },
});

app.use(sessionConf);

io.use(
  socketIOSession(sessionConf, {
    autoSave: false,
    saveUninitialized: false,
    resave: false,
  })
);

// Logging configuration
const { Theme } = betterLogging;
betterLogging(console, {
  color: Theme.green,
});
console.logLevel = 4;
app.use(
  betterLogging.expressMiddleware(console, {
    ip: { show: true, color: Theme.green.base },
    method: { show: true, color: Theme.green.base },
    header: { show: false },
    path: { show: true },
    body: { show: true },
  })
);

// XSS protection
app.use(helmet());

app.use((req, res, next) => {
  if (req.body) {
    Object.keys(req.body).forEach((k) => {
      req.body[k] = sanitizeHtml(req.body[k]);
    });
  }
  next();
});

// Serve static files
app.use(express.static(resolvePath("client", "dist")));

// Register middlewares that parse the body of the request, available under req.body property
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/GameBoard.svg", (req, res) => {
  res.sendFile(resolvePath("client", "GameBoard.svg"));
});

app.use("/api", authRouter);
app.use("/api", requireAuth, lobbyRouter);
app.use("/api", requireAuth, gameRouter);

app.use("*", (req, res) => {
  res.sendFile(resolvePath("client", "dist", "index.html"));
});

// Initalize the session handler
sessionhandler.init(io);

// Handle socket.io connections
io.on("connection", (socket) => {
  console.log("Socket connected", socket.id);
  const { id } = socket.handshake.session;
  console.log("Session connected", id);
  const { session } = socket.handshake;
  console.log("Socket connected", session.id);
  if (!session.socketID || session.socketID !== socket.id) {
    session.socketID = socket.id;
    session.save();
  }
  if (session.room) {
    console.debug(
      `Joining room ${session.room} with socketID: ${session.socketID}`
    );
    socket.join(session.room);
  }
});

server.listen(port, () => {
  console.log(`Listening on https://localhost:${port}/`);
});
