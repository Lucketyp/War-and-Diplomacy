<template>
  <div class="row">
    <div class="col"></div>
    <div class="col">
      <h1 class="text-center">Lobby</h1>
      <ul class="list-group mt-3">
        <li
          v-for="(player, index) in lobby.players"
          :key="index"
          class="list-group-item text-center mt-2"
        >
          {{ player.name }}
        </li>
      </ul>
    </div>
    <div class="col"></div>
  </div>
  <div class="row">
    <div class="col"></div>
    <button
      v-if="$store.getters.getLobbyAdmin == $store.getters.getUsername"
      type="button"
      class="btn col-3 btn-dark text-center mt-3"
      @click="startGame"
    >
      Start Game
    </button>
    <button
      type="button"
      class="btn col-3 btn-dark text-center mt-3"
      @click="leaveLobby"
    >
      Leave Lobby
    </button>
    <div class="col"></div>
  </div>
</template>

<script>
export default {
  name: "LobbyView",
  components: {},
  data() {
    return {
      lobby: {},
    };
  },

  async mounted() {
    const admin = this.$store.getters.getLobbyAdmin;
    const res = await fetch(`/api/lobby/${admin}`);
    const { lobby } = await res.json();
    this.lobby = lobby;

    const { socket } = this.$root;
    socket.on("players", (p) => {
      this.lobby.players = p;
      console.log("Received players from server");
    });
    socket.on("start", () => {
      this.$router.push("/game");
    });
  },

  methods: {
    async leaveLobby() {
      const { commit } = this.$store;
      const { push } = this.$router;

      const admin = this.$store.getters.getLobbyAdmin;

      const res = await fetch(`/api/lobby/${admin}/leave`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });

      if (res.status !== 200) {
        console.log("Failed to leave lobby");
        return;
      }

      commit("leaveLobby");
      push("/lobbies");
    },
    async startGame() {
      console.log("Starting game");

      const res = await fetch(`/api/game/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (res.status !== 201) {
        console.log("Failed to start game");
        return;
      }

      console.log("Game started");
      this.$router.push("/game");
    },
  },
};
</script>
