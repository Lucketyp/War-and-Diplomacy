<template>
  <nav class="navbar navbar-expand-md navbar-dark bg-dark">
    <button
      class="navbar-toggler mx-2 mb-2"
      type="button"
      data-bs-toggle="collapse"
      data-bs-target="#navbarNav"
    >
      <span class="navbar-toggler-icon"></span>
    </button>
    <ul v-if="getAuthenticated()" class="navbar-nav">
      <li class="nav-item">
        <a class="nav-link" href="#" @click="logout()">Logout</a>
      </li>
      <li class="nav-item">
        <a class="nav-link" href="#" @click="redirect('/lobbies')">Lobbies</a>
      </li>
    </ul>
    <ul v-else class="navbar-nav">
      <li class="nav-item">
        <a class="nav-link" href="#" @click="redirect('/login')">Login</a>
      </li>
      <li class="nav-item">
        <a class="nav-link" href="#" @click="redirect('/register')">Register</a>
      </li>
    </ul>
  </nav>
  <section class="container-fluid py-4">
    <router-view />
  </section>
</template>

<script>
// @ is an alias to /src
import "bootstrap";
import io from "socket.io-client";

export default {
  name: "App",
  components: {},
  data: () => ({
    socket: io(/* socket.io options */).connect(),
  }),
  async mounted() {
    const { push } = this.$router;

    this.socket.on("logout", () => {
      console.log("Logging out");
      this.$store.commit("reset");
      push("/login");
    });

    // // Short polling for logout
    // setInterval(async () => {
    //   if (this.$store.state.authenticated) {
    //     const res = await fetch("/api/poll", {
    //       method: "GET",
    //       headers: { "Content-Type": "application/json" },
    //     });
    //     if (res.status !== 200) {
    //       console.log("Logging out");
    //       this.$store.commit("reset");
    //       push("/login");
    //     }
    //   }
    // }, 30000);
  },
  methods: {
    redirect(target) {
      this.$router.push(target);
    },
    getAuthenticated() {
      return this.$store.getters.isAuthenticated;
    },
    inLobby() {
      return this.$store.getters.inLobby;
    },
    getName() {
      return this.$store.getters.getUsername;
    },
    async logout() {
      await fetch("/api/logout");
      this.$store.commit("reset");
      this.$router.push("/login");
    },
  },
};
</script>

<style>
@import url("bootstrap/dist/css/bootstrap.css");

html,
body {
  /* https://designs.ai/colors */
  background-color: #9dc9ed;
}
</style>
