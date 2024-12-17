<template>
  <div class="row">
    <div class="col"></div>
    <form class="col" @submit.prevent="authenticate()">
      <label for="username" class="form-label h4">{{ msg }}</label>
      <input
        id="username"
        v-model="username"
        type="text"
        class="form-control"
        placeholder="username..."
        required
      />
      <input
        id="password"
        v-model="password"
        type="password"
        class="form-control"
        placeholder="password..."
        required
      />
      <button type="submit" class="btn btn-dark mt-4 float-end">OK</button>
    </form>
    <div class="col"></div>
  </div>
</template>

<script>
export default {
  name: "RegisterView",
  components: {},
  data: () => ({
    username: "",
    password: "",
    msg: "Enter a username and password to register",
  }),

  methods: {
    async authenticate() {
      const { commit } = this.$store;
      const { push } = this.$router;

      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: this.username,
          password: this.password,
        }),
      });

      if (res.status !== 200) {
        const { error } = await res.json();
        this.msg = error;
        return;
      }

      await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: this.username,
          password: this.password,
        }),
      });

      commit("setAuthenticated", true);
      commit("setUsername", this.username);
      push("/lobbies");
    },
  },
};
</script>
