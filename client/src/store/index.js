import { createStore } from "vuex";
import VuexPersist from "vuex-persist";

const vuexPersist = new VuexPersist({
  key: "my-app",
  storage: window.localStorage,
});

export default createStore({
  state: {
    authenticated: false,
    username: null,
    lobbyAdmin: null,
  },
  getters: {
    isAuthenticated(state) {
      return state.authenticated;
    },
    getUsername(state) {
      return state.username;
    },
    getLobbyAdmin(state) {
      return state.lobbyAdmin;
    },
    inLobby(state) {
      return state.lobbyAdmin !== null;
    },
  },
  mutations: {
    setAuthenticated(state, authenticated) {
      state.authenticated = authenticated;
    },
    setUsername(state, username) {
      state.username = username;
    },
    setLobbyAdmin(state, lobbyAdmin) {
      state.lobbyAdmin = lobbyAdmin;
    },
    leaveLobby(state) {
      state.lobbyAdmin = null;
    },
    reset(state) {
      state.authenticated = false;
      state.username = null;
      state.lobbyAdmin = null;
    },
  },
  actions: {},
  modules: {},
  plugins: [vuexPersist.plugin],
});
