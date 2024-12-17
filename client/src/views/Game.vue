<template>
  <div>
    <div class="container">
      <div v-if="gameEnded">
        <h1>{{ endMessage }}</h1>
        <button
          type="button"
          class="btn btn-dark row offset-md-8 mt-2"
          @click="leaveGame"
        >
          Leave Game
        </button>
      </div>
      <div v-else>
        <div>
          <!-- eslint-disable vue/no-v-html -->
          <div
            ref="svgContainer"
            @click="handleClick"
            @keydown="nothing"
            v-html="svgContent"
          ></div>
          <!-- eslint-enable vue/no-v-html -->
        </div>

        <h2 v-if="waitingForPlayers">Waiting for players</h2>
        <h2 v-if="placementTurn">Starting continent: {{ startingContinet }}</h2>
        <draggable
          v-model="currentOrders"
          class="list-group"
          item-key="id"
          @start="drag = true"
          @end="drag = false"
        >
          <template #item="{ element }">
            <div class="list-group-item">
              <span>{{ element.type }}</span>
              <span>{{ element.fromCountry }}</span>
              <span>{{ element.toCountry }}</span>
              <span>{{ element.numUnits }}</span>
            </div>
          </template>
        </draggable>
        <div v-if="!waitingForPlayers">
          <button
            v-if="placementTurn && selectedCountryId"
            type="button"
            class="btn btn-success col-md-3 offset-md-8"
            @click="placeUnit"
          >
            Place Unit
          </button>
          <button
            v-if="!placementTurn && currentOrders.length > 0"
            type="button"
            class="btn btn-dark col-md-3 offset-md-8 mt-2"
            @click="endTurn"
          >
            End Turn
          </button>
        </div>
        <button
          v-if="isAdmin"
          type="button"
          class="btn btn-danger col-md-3 offset-md-8 mt-2"
          @click="endGame"
        >
          End Game
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import draggable from "vuedraggable";

export default {
  name: "GameView",
  components: {
    draggable,
  },
  data() {
    return {
      svgContent: "",

      currentOrders: [],
      orderLimit: 3,

      selectedCountryId: null,
      selectedTarget: null,
      previousCountryId: null,
      previousTarget: null,

      waitingForPlayers: false,
      placementTurn: true,
      selectNumUnits: 0,

      startingContinet: null,
      player: null,
      map: null,
      gameState: null,

      selectCountryColor: "#4d9e56",
      selectUnitColor: "#29ff41",
      playerColor: "#005c0e",
      enemyColor: "#6b0212",
      previousColor: null,
      selectedColor: null,

      isAdmin: false,

      gameEnded: false,
      endMessage: "",
    };
  },
  async mounted() {
    this.player = this.$store.getters.getUsername;
    if (this.$store.getters.getLobbyAdmin === this.player) {
      this.isAdmin = true;
    }

    this.addSocketListeners();
    this.loadMap();
    this.addScrollInteraction();
    this.fetchGameData();

    this.$nextTick(() => {
      this.insertUnits();
    });
  },

  methods: {
    addSocketListeners() {
      const { socket } = this.$root;
      socket.on("gameState", (gameState) => {
        console.log("Received game state from server");
        console.log(gameState);
        this.gameState = gameState;
        this.insertUnits();
        this.waitingForPlayers = false;
        this.currentOrders = [];
      });
      socket.on("placementTurn", (isPlacementTurn) => {
        console.log("Received placement turn from server");
        this.placementTurn = isPlacementTurn;
      });
      socket.on("endGame", (msg) => {
        console.log("Received end game from server");
        this.gameEnded = true;
        this.endMessage = msg;
      });
    },

    async loadMap() {
      this.loadMapGraphic();
    },

    async fetchGameData() {
      const adminName = this.$store.getters.getLobbyAdmin;
      const res = await fetch(`/api/game/${adminName}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (res.status === 200) {
        const { map, startingContinent, gameState } = await res.json();
        this.map = map;
        this.startingContinet = startingContinent;
        this.gameState = gameState;
      }
    },

    async loadMapGraphic() {
      axios.get("/Gameboard.svg").then((response) => {
        this.svgContent = response.data;
      });
    },

    addScrollInteraction() {
      window.addEventListener("wheel", (event) => {
        if (this.selectNumUnits <= 0) return;
        if (this.selectedCountryId === null) return;
        if (this.gameState[this.selectedCountryId] === null) return;
        if (this.gameState[this.selectedCountryId].player !== this.player)
          return;

        if (event.deltaY > 3 || event.deltaY < -3) {
          const change = event.deltaY > 0 ? -1 : 1;
          this.selectNumUnits += change;

          this.selectUnits();
          if (this.selectNumUnits <= 0) this.clearCountrySelection();
        }
      });
    },

    insertUnits() {
      console.log("Trying to insert units");
      if (!this.gameState) return;
      if (!this.$refs.svgContainer) return;
      console.log("Inserting units");
      const svg = this.$refs.svgContainer.querySelector("svg");

      let circlesGroup = svg.querySelector("#circles-group");
      if (!circlesGroup) {
        circlesGroup = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "g"
        );
        circlesGroup.setAttribute("id", "circles-group");
        svg.appendChild(circlesGroup);
      }

      // Remove existing circles to avoid duplication
      circlesGroup.querySelectorAll("circle").forEach((circle) => {
        circle.remove();
      });

      const contriesWithUnits = Object.keys(this.gameState);

      svg.querySelectorAll("path, polygon").forEach((element) => {
        if (element.id === "unknown") return;
        if (!contriesWithUnits.includes(element.id)) return;

        const bbox = element.getBBox();
        const cx = bbox.x + bbox.width / 2;
        const cy = bbox.y + bbox.height / 2;
        const country = element.id;
        const count = this.gameState[country].units;

        for (let i = 0; i < count; i += 1) {
          // Calculate a position offset from the center of the country
          const angle = (2 * Math.PI * i) / count;
          const offset = 12;
          const x = cx + Math.cos(angle) * offset;
          const y = cy + Math.sin(angle) * offset;

          const circle = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "circle"
          );
          circle.setAttribute("cx", x);
          circle.setAttribute("cy", y);
          circle.setAttribute("r", "6");
          // Change fil depending on player
          if (this.gameState[country].player === this.player) {
            circle.setAttribute("fill", this.playerColor);
          } else {
            circle.setAttribute("fill", this.enemyColor);
          }
          circle.setAttribute("data-country", country);
          circlesGroup.appendChild(circle);
        }
      });
    },

    handleClick(event) {
      const { target } = event;
      if (
        target &&
        (target.nodeName === "path" ||
          target.nodeName === "rect" ||
          target.nodeName === "polygon")
      ) {
        const countryId = target.getAttribute("id");
        if (!countryId || countryId === "unknown") return;

        // Check if units are selected and the country is adjacent to the currently selected country
        if (!this.placementTurn && this.isMoveInput(countryId)) {
          this.moveInput(countryId);
        } else {
          this.selectCountry(countryId, target);
        }
      }
    },

    isMoveInput(countryId) {
      if (!this.selectedCountryId) return false;
      if (this.selectNumUnits < 0) return false;
      if (this.currentOrders.length >= this.orderLimit) return false;
      return (
        this.selectedCountryId &&
        this.selectNumUnits > 0 &&
        this.map[this.selectedCountryId] &&
        this.map[this.selectedCountryId].includes(countryId)
      );
    },

    async moveInput(countryId) {
      const adminName = this.$store.getters.getLobbyAdmin;
      const numUnits = this.selectNumUnits;
      const fromCountry = this.selectedCountryId;
      const toCountry = countryId;

      console.log("Moving units from ", fromCountry, " to ", toCountry);

      const res = await fetch(
        `/api/game/${adminName}/${fromCountry}/${numUnits}/${toCountry}/moveUnit`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (res.status === 400) {
        console.log("Invalid move");
        return;
      }

      if (res.status === 200) {
        console.log("Move successful");
        this.deselectUnits();
        this.clearCountrySelection();
        this.currentOrders.push({
          type: "moveUnit",
          fromCountry,
          toCountry,
          numUnits,
        });
      }
    },

    async placeUnit() {
      const adminName = this.$store.getters.getLobbyAdmin;
      const countryName = this.selectedCountryId;

      this.waitingForPlayers = true;

      const res = await fetch(
        `/api/game/${adminName}/${countryName}/placeUnit`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (res.status === 400) {
        console.log("Invalid unit placement");
        this.waitingForPlayers = false;
        return;
      }

      if (res.status === 200) {
        console.log("Unit placed successfully");
        this.clearCountrySelection();
      }
    },

    async endTurn() {
      const adminName = this.$store.getters.getLobbyAdmin;

      console.log("Ending turn");

      this.waitingForPlayers = true;

      const res = await fetch(`/api/game/${adminName}/endTurn`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orders: this.currentOrders }),
      });

      this.currentOrders = [];

      if (res.status === 400) {
        console.log("Invalid orders");
        this.waitingForPlayers = false;
        return;
      }

      if (res.status === 200) {
        console.log("Turn ended successfully");
      }
    },

    selectCountry(countryId, target) {
      this.deselectUnits();

      if (this.selectedCountryId) {
        if (this.selectedCountryId !== countryId)
          this.previousCountryId = this.selectedCountryId;
        this.previousTarget = this.selectedTarget;
        this.previousColor = this.selectedColor;
      }

      this.selectedCountryId = countryId;
      this.selectedTarget = target;
      this.updateCountriesColor();

      if (
        this.gameState &&
        this.gameState[this.selectedCountryId] &&
        this.gameState[this.selectedCountryId].player === this.player
      ) {
        this.selectNumUnits = this.gameState[this.selectedCountryId].units;
        this.selectUnits();
      } else {
        this.selectNumUnits = 0;
      }
    },

    deselectUnits() {
      if (!this.gameState) return;
      if (!this.$refs.svgContainer) return;
      if (!this.$refs.svgContainer.querySelector("svg")) return;
      if (
        !this.$refs.svgContainer
          .querySelector("svg")
          .querySelector("#circles-group")
      )
        return;

      const svg = this.$refs.svgContainer.querySelector("svg");
      const circlesGroup = svg.querySelector("#circles-group");

      circlesGroup.querySelectorAll("circle").forEach((circle) => {
        const country = circle.getAttribute("data-country");

        if (country === this.selectedCountryId) {
          circle.setAttribute("stroke", "none");
        }
      });
    },

    selectUnits() {
      if (!this.gameState) return;
      if (!this.$refs.svgContainer) return;
      if (!this.$refs.svgContainer.querySelector("svg")) return;
      if (
        !this.$refs.svgContainer
          .querySelector("svg")
          .querySelector("#circles-group")
      )
        return;

      const svg = this.$refs.svgContainer.querySelector("svg");
      const circlesGroup = svg.querySelector("#circles-group");

      let i = 0;

      this.deselectUnits();

      circlesGroup.querySelectorAll("circle").forEach((circle) => {
        const country = circle.getAttribute("data-country");

        if (country === this.selectedCountryId && i < this.selectNumUnits) {
          circle.setAttribute("stroke", this.selectUnitColor);
          circle.setAttribute("stroke-width", "4");
          i += 1;
        }
      });
    },

    clearCountrySelection() {
      this.selectedTarget.style.fill = this.selectedColor;
      this.selectedCountryId = null;
      this.selectedTarget = null;
      this.selectedColor = null;
      this.previousCountryId = null;
      this.previousTarget = null;
      this.previousColor = null;
    },

    updateCountriesColor() {
      if (this.previousTarget) {
        this.previousTarget.style.fill = this.previousColor;
      }
      this.selectedColor = this.selectedTarget.style.fill;
      this.selectedTarget.style.fill = this.selectCountryColor;
    },

    async endGame() {
      const res = await fetch(`/api/game/${this.player}/endGame`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (res.status === 200) {
        console.log("Game ended successfully");
        this.$router.push("/lobbies");
      }
    },

    leaveGame() {
      this.$router.push("/lobbies");
    },

    nothing() {
      // Do nothing
    },
  },
};
</script>
