import { createRouter, createWebHistory } from "vue-router";
import store from "../store";
import Login from "../views/Login.vue";
import Lobby from "../views/Lobby.vue";
import Lobbies from "../views/Lobbies.vue";
import Register from "../views/Register.vue";
import Game from "../views/Game.vue";

const routes = [
  {
    path: "/",
    component: Login,
  },
  {
    path: "/login",
    component: Login,
  },
  {
    path: "/lobby",
    component: Lobby,
  },
  {
    path: "/lobbies",
    component: Lobbies,
  },
  {
    path: "/register",
    component: Register,
  },
  {
    path: "/game",
    component: Game,
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// Use the router to navigate to current page on refresh.
router.beforeEach(async (to, from, next) => {
  if (to.path === "/login") next();
  if (to.path === "/register") next();
  else if (store.state.authenticated) next();
  else if (store.state.authenticated === false) {
    if (!routes.includes(to.path)) {
      console.log("Navigating to", to.path);
    }
    store.commit("reset");
    next("/login");
  }
});

export default router;
