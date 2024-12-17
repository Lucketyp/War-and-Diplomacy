import Country from "./country.model.js";

class Map {
  constructor() {
    this.continents = [];
    this.countries = {};
    this.freeCities = [];
  }

  printAllUnitPositions() {
    Object.values(this.countries).forEach((country) => {
      if (country.hasUnits()) {
        console.log(
          country.name,
          "has",
          country.getNumUnits(),
          "units owned by",
          country.getOwner()
        );
      }
    });
  }

  addCountry(name, isFreeCity = false, continent = null) {
    this.countries[name] = new Country(name, isFreeCity, continent);

    if (continent && !this.continents.includes(continent)) {
      this.continents.push(continent);
    }

    if (isFreeCity) {
      this.freeCities.push(this.countries[name]);
    }
  }

  setNeighbors(countryName, landNeighbors = [], seaNeighbors = []) {
    const country = this.countries[countryName];
    if (!country) {
      console.log(`Country ${countryName} not found in map`);
      return;
    }

    landNeighbors.forEach((neighborName) => {
      const neighbor = this.countries[neighborName];
      if (neighbor) {
        country.addLandNeighbor(neighbor);
        neighbor.addLandNeighbor(country);
      }
    });

    seaNeighbors.forEach((neighborName) => {
      const neighbor = this.countries[neighborName];
      if (neighbor) {
        country.addSeaNeighbor(neighbor);
        neighbor.addSeaNeighbor(country);
      }
    });
  }

  getCountry(name) {
    if (!this.countries[name]) {
      console.log(`Country ${name} not found in map`);
      return null;
    }
    return this.countries[name];
  }

  getCountries() {
    return Object.values(this.countries);
  }

  getContinents() {
    return this.continents;
  }

  getFreeCities() {
    return this.freeCities;
  }

  getMap() {
    const map = {};
    Object.values(this.countries).forEach((country) => {
      map[country.name] = [];
      country.landNeighbors.forEach((neighbor) =>
        map[country.name].push(neighbor.name)
      );
      country.seaNeighbors.forEach((neighbor) =>
        map[country.name].push(neighbor.name)
      );
    });
    return map;
  }
}

function createTestMap() {
  const map = new Map();

  map.addCountry("A", false, "Continent1");
  map.addCountry("B", false, "Continent1");
  map.addCountry("C", false, "Continent2");
  map.addCountry("D", false, "Continent2");

  map.setNeighbors("A", ["B", "C"], []);
  map.setNeighbors("B", [], ["D"]);
  map.setNeighbors("C", [], ["D"]);

  return map;
}

function createGameMap() {
  const gameMap = new Map();

  const continents = {
    Skytie: [
      "Morya",
      "Kizstan",
      "Derimistan",
      "Tarez",
      "Tuistan",
      "Ozin",
      "Bolsuy",
      "Yug",
    ],
    Lusiola: [
      "Quinsula",
      "Dobrés",
      "Solade",
      "Pietes",
      "Distonia",
      "Uranía",
      "Meridia",
      "Ciura",
      "Oreinta",
    ],
    Tienpei: [
      "Dao",
      "Umai",
      "Vun",
      "Jian",
      "Deybu",
      "Ruki",
      "Zhanchang",
      "Loang",
      "Tiji",
      "Gwang",
      "Zingbu",
      "Doshin",
      "Ashin",
      "Dieh",
    ],
    Mutzulu: [
      "Berdunu",
      "Joburu",
      "Oguolo",
      "Lopolo",
      "Mapolo",
      "Kaswa",
      "Dempolo",
      "Tzizo",
      "Vaaltram",
    ],
    Hibiria: [
      "Moiry",
      "Atchet",
      "Spey",
      "St Roarke",
      "Cershire",
      "N. Cog",
      "S. Cog",
      "Omeria",
    ],
  };

  const FreeCities = [
    "Ziyu",
    "Kallin",
    "Grad",
    "Toqueda",
    "Periclan",
    "Runlathin",
    "Dehomey",
    "Lemoglu",
    "Bakaw",
    "Mon-Tip",
  ];

  // Add countries and free cities
  Object.keys(continents).forEach((continent) => {
    continents[continent].forEach((country) =>
      gameMap.addCountry(country, false, continent)
    );
  });
  FreeCities.forEach((city) => gameMap.addCountry(city, true, null));

  // Set neighbors
  gameMap.setNeighbors(
    "Morya",
    ["Kizstan", "Tuistan", "Ozin", "Kallin"],
    ["Gwang"]
  );
  gameMap.setNeighbors("Kizstan", ["Derimistan", "Bolsuy"], []);
  gameMap.setNeighbors("Derimistan", ["Tarez", "Bolsuy", "Tuistan", "Yug"], []);
  gameMap.setNeighbors("Tarez", ["Yug", "Tuistan"], ["Mon-Tip"]);
  gameMap.setNeighbors("Bolsuy", ["Grad"], ["Dobrés", "Quinsula"]);
  gameMap.setNeighbors("Yug", [], ["Grad", "Quinsula"]);

  gameMap.setNeighbors("Dobrés", ["Solade", "Meridia"], ["Bolsuy"]);
  gameMap.setNeighbors("Solade", ["Distonia", "Meridia"], ["Toqueda"]);
  gameMap.setNeighbors("Pietes", ["Distonia", "Ciura"], ["Quinsula"]);
  gameMap.setNeighbors("Distonia", ["Pietes", "Ciura"], ["Quinsula"]);
  gameMap.setNeighbors("Meridia", ["Uranía", "Periclan"], []);
  gameMap.setNeighbors("Uranía", ["Ciura"], ["Cershire"]);
  gameMap.setNeighbors("Oreinta", ["Ciura"], ["Omeria"]);
  gameMap.setNeighbors("Quinsula", ["Toqueda"], ["Grad"]);
  gameMap.setNeighbors("Ciura", [], ["Runlathin"]);

  gameMap.setNeighbors("Tiji", ["Loang", "Zhanchang"], ["Ciura"]);
  gameMap.setNeighbors("Dieh", ["Ruki", "Gwang", "Zhanchang"], ["Kallin"]);
  gameMap.setNeighbors("Ruki", ["Zingbu", "Zhanchang"], []);
  gameMap.setNeighbors("Zhanchang", ["Loang"], ["Ashin"]);
  gameMap.setNeighbors("Loang", [], ["St Roarke"]);
  gameMap.setNeighbors("Gwang", ["Bakaw", "Zingbu"], []);
  gameMap.setNeighbors("Zingbu", ["Vun", "Jian"], []);
  gameMap.setNeighbors("Vun", ["Umai"], []);
  gameMap.setNeighbors(
    "Umai",
    ["Ziyu", "Jian", "Deybu"],
    ["Lemoglu", "Kasawa", "Doshin"]
  );
  gameMap.setNeighbors("Jian", ["Ziyu"], ["Ashin"]);
  gameMap.setNeighbors("Deybu", [], ["Tzizo", "Dao", "Leoglu"]);
  gameMap.setNeighbors("Dao", ["Tzizo"], ["Bakaw"]);
  gameMap.setNeighbors("Ashin", ["Doshin"], ["Runlathin", "Ziyu"]);
  gameMap.setNeighbors(
    "Doshin",
    [],
    ["Runlathin", "Spey", "Dehomey", "Kasawa"]
  );

  gameMap.setNeighbors("Tzizo", ["Vaaltram", "Berdunu"], []);
  gameMap.setNeighbors("Vaaltram", ["Berdunu", "Lemoglu", "Oguolo"], []);
  gameMap.setNeighbors("Joburu", ["Kasawa", "Berdunu", "Mapolo", "Lopolo"], []);
  gameMap.setNeighbors("Oguolo", ["Kaswa", "Berdunu"], []);
  gameMap.setNeighbors("Kaswa", ["Lopolo"], []);
  gameMap.setNeighbors("Lopolo", ["Dempolo", "Mapolo"], ["Dehomey"]);
  gameMap.setNeighbors("Dempolo", [], ["N. Cog", "Dehomey", "Mapolo"]);

  gameMap.setNeighbors("N. Cog", ["S. Cog", "Spey"], []);
  gameMap.setNeighbors("S. Cog", ["Atchet", "Spey"], []);
  gameMap.setNeighbors(
    "Moiry",
    ["Atchet", "Cershire", "Runlathin", "St Roarke"],
    []
  );
  gameMap.setNeighbors("Atchet", ["Spey", "Cershire"], []);
  gameMap.setNeighbors("Spey", ["Moiry", "Cershire"], ["Dehomey", "Doshin"]);
  gameMap.setNeighbors("St Roarke", ["Cershire", "Omeria", "Runlathin"], []);
  gameMap.setNeighbors("Omeria", ["Cershire"], []);

  return gameMap;
}

export default Map;
export { createGameMap, createTestMap };
