class Country {
  constructor(name, isFreeCity, continent) {
    this.name = name;
    this.isFreeCity = isFreeCity;
    this.continent = continent;
    this.seaNeighbors = [];
    this.landNeighbors = [];
    this.numNeighbors = 0;

    this.currentUnits = {};
    this.futureUnits = {};

    this.unitRoomInFreeCity = 6;
  }

  setContinent(continent) {
    this.continent = continent;
  }

  addSeaNeighbor(country) {
    if (!this.seaNeighbors.includes(country)) {
      this.seaNeighbors.push(country);
    }
  }

  addLandNeighbor(country) {
    if (!this.landNeighbors.includes(country)) {
      this.landNeighbors.push(country);
    }
  }

  getNumNeighbors() {
    if (this.numNeighbors === 0) {
      const allNeighbors = this.seaNeighbors.concat(this.landNeighbors);
      this.numNeighbors = allNeighbors.length;
    }

    return this.numNeighbors;
  }

  isNeighbor(toCountry) {
    return this.isSeaNeighbor(toCountry) || this.isLandNeighbor(toCountry);
  }

  isSeaNeighbor(toCountry) {
    return this.seaNeighbors.includes(toCountry);
  }

  isLandNeighbor(toCountry) {
    return this.landNeighbors.includes(toCountry);
  }

  hasRoomForUnit() {
    if (this.isFreeCity) {
      return this.getNumUnits() < this.unitRoomInFreeCity;
    }
    return this.getNumUnits() < this.getNumNeighbors();
  }

  maxNumUnits() {
    if (this.isFreeCity) {
      return this.unitRoomInFreeCity;
    }
    return this.getNumNeighbors();
  }

  placeUnit(playerName) {
    if (this.currentUnits[playerName]) {
      this.currentUnits[playerName] += 1;
    } else {
      this.currentUnits[playerName] = 1;
    }
  }

  setNumUnits(playerName, numUnits) {
    this.currentUnits[playerName] = numUnits;
  }

  getNumUnits() {
    if (!this.hasUnits()) {
      return 0;
    }
    return this.currentUnits[this.getOwner()];
  }

  hasUnits() {
    return Object.keys(this.currentUnits).length > 0;
  }

  getOwner() {
    if (!this.hasUnits()) {
      return null;
    }
    return Object.keys(this.currentUnits)[0];
  }

  removeNumUnits(numUnits) {
    const owner = this.getOwner();
    if (!owner) {
      return 0;
    }

    if (this.currentUnits[owner] <= numUnits) {
      const unitsRemoved = this.currentUnits[owner];
      delete this.currentUnits[owner];
      return unitsRemoved;
    }

    this.currentUnits[owner] -= numUnits;

    // If no units left, remove owner
    if (this.currentUnits[owner] === 0) {
      delete this.currentUnits[owner];
    }

    return numUnits;
  }

  addFutureUnits(playerName, fromCountry, numUnits) {
    this.futureUnits[playerName] = { fromCountry, numUnits };
  }

  printFutureUnits() {
    if (Object.keys(this.futureUnits).length === 0) {
      console.debug("No future units");
    }
    Object.keys(this.futureUnits).forEach((player) => {
      console.debug(
        player,
        "has",
        this.futureUnits[player].numUnits,
        "units coming in from",
        this.futureUnits[player].fromCountry.name
      );
    });
  }

  resolveTurn() {
    // Could be a lot prettier but I'm tired

    // Resolve turn

    const playersCompeting = new Set();
    const currentOwner = this.getOwner();

    // Check for current owner
    if (currentOwner) {
      playersCompeting.add(currentOwner);
    }

    // Check for other players in future units
    Object.keys(this.futureUnits).forEach((player) => {
      playersCompeting.add(player);
    });

    if (playersCompeting.size > 1) {
      // Battle

      // Get the player with the most units and the number of most and second most units
      let maxUnits = 0;
      let maxPlayer = null;
      let secondMaxUnits = 0;

      if (currentOwner) {
        maxUnits = this.currentUnits[currentOwner];
        maxPlayer = currentOwner;
      }

      Object.keys(this.futureUnits).forEach((player) => {
        if (this.futureUnits[player].numUnits > maxUnits) {
          secondMaxUnits = maxUnits;
          maxUnits = this.futureUnits[player].numUnits;
          maxPlayer = player;
        } else if (this.futureUnits[player].numUnits > secondMaxUnits) {
          secondMaxUnits = this.futureUnits[player].numUnits;
        }
      });

      // Update current units and future units based on battle
      const remainingUnits = maxUnits - secondMaxUnits;
      this.currentUnits = {};
      const overMax = this.numUnitsOverLimit(remainingUnits);
      if (overMax) {
        this.sendBackRemainingUnits(maxPlayer, overMax);
      } else if (remainingUnits > 0) {
        this.currentUnits[maxPlayer] = remainingUnits;
      }
      this.futureUnits = {};
    } else if (playersCompeting.size === 1) {
      // Move future units to current units if available and enough room
      console.debug("Moving future units to current units");
      Object.keys(this.futureUnits).forEach((player) => {
        const overMax = this.numUnitsOverLimit(
          this.futureUnits[player].numUnits
        );
        if (overMax) {
          this.sendBackRemainingUnits(player, overMax);
        } else {
          if (!this.currentUnits[player]) {
            this.currentUnits[player] = 0;
          }
          this.currentUnits[player] += this.futureUnits[player].numUnits;
        }
      });
      this.futureUnits = {};
    }

    const newOwner = this.getOwner();

    if (newOwner) {
      // Create unit if free city and enough room and neighbors owned by current owner
      if (this.isFreeCity) {
        const allNeighbors = this.seaNeighbors.concat(this.landNeighbors);

        allNeighbors.forEach((neighbor) => {
          if (!this.hasRoomForUnit()) return;
          if (neighbor.getOwner() === newOwner) {
            console.debug("Placing unit in free city");
            this.placeUnit(newOwner);
          }
        });
      }
    }
  }

  sendBackRemainingUnits(player, overMax) {
    this.currentUnits[player] = this.maxNumUnits();
    const { fromCountry } = this.futureUnits[player];
    fromCountry.addFutureUnits(player, this, overMax);
  }

  numUnitsOverLimit(numUnits) {
    const overMax = numUnits - this.maxNumUnits();
    if (overMax > 0) {
      return overMax;
    }
    return null;
  }
}

export default Country;
