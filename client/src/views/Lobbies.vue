<template>
  <div class="row">
    <div class="col"></div>

    <ul class="col list-group">
      <h1 class="text-center">Lobbies</h1>
      <li
        v-for="lobby in lobbies"
        :key="lobby"
        class="list-group-item text-center"
      >
        <div class="row">
          <button
            v-if="lobby.joinable"
            type="button"
            class="btn col"
            @click="joinLobby(lobby)"
          >
            join {{ lobby.admin }}
          </button>
        </div>
      </li>
    </ul>

    <div class="col"></div>
  </div>
  <div class="row">
    <div class="col"></div>
    <button
      type="button"
      class="btn col-3 btn-dark text-center mt-2"
      @click="createLobby"
    >
      Create Lobby
    </button>
    <div class="col"></div>
  </div>
</template>

<script>
export default {
  name: "BookingView",
  components: {},
  data() {
    return {
      lobbies: {},
      potentialAdmin: null,
    };
  },
  async mounted() {
    const res = await fetch("/api/lobbies");
    const { lobbies } = await res.json();
    this.lobbies = lobbies;

    const { socket } = this.$root;
    socket.on("lobbies", (l) => {
      this.lobbies = l;
      console.log("Received lobbies from server");
    });
    socket.on("startGame", () => {
      this.$router.push("/game");
    });
  },

  methods: {
    async joinLobby(lobby) {
      // route to lobby page
      const { admin } = lobby;
      console.log("Joining lobby with admin: ", admin);

      const res = await fetch(`/api/lobby/${admin}/join`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });

      if (res.status !== 200) {
        console.log("Failed to join lobby");
        return;
      }

      this.$store.commit("setLobbyAdmin", admin);
      this.$router.push("/lobby");
    },
    async createLobby() {
      // route to lobby page
      console.log("Creating lobby");
      const username = this.$store.getters.getUsername;

      const res = await fetch(`/api/lobby/${username}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (res.status !== 201) {
        console.log("Failed to create lobby");
        return;
      }

      this.$store.commit("setLobbyAdmin", username);
      this.$router.push("/lobby");
    },
  },
};
</script>
