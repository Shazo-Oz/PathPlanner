const $ = selector => document.querySelector(selector)
const $$ = selector => document.querySelectorAll(selector)


function backToInputs() {
  location = (location.href.slice(0, location.href.lastIndexOf("/")) + "/index.html" + location.search)
}


const SYSTEM_STATE = { ready: false }

const map = L.map('map');
const mapInit = () =>
  new Promise(res => {
    const coords = [cityCoordinates[0][2], cityCoordinates[0][3]]
    map.setView(coords, 16);
    //&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      minZoom: 2,
      attribution: 'Maps and routes from <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>. data uses <a href="http://opendatacommons.org/licenses/odbl/">ODbL</a> license'
    }).addTo(map);
    $("#mapErrText").innerHTML = ""
    res({ code: 200, message: "success" })
  })
const mapRoutePoints = (waypoints /* [ [lat, long], [lat, long], ... ] */) => {
  const routeControl = L.Routing.control({
    waypoints,
    autoRoute: false,
    draggableWaypoints: false,
    addWaypoints: false
  }).addTo(map);
  $(".leaflet-top.leaflet-right > .leaflet-routing-container.leaflet-bar.leaflet-control").style.maxWidth='30%'
  // $(".leaflet-top.leaflet-right > .leaflet-routing-container.leaflet-bar.leaflet-control").remove()
  return routeControl
}

//CITY CODE -----------------------------------------------------------------------
const ctx = document.getElementById("canvas").getContext("2d");

// const sticky = new Image();
// sticky.src = "./assets/boneMap.jpg";


let MAP_SIZE = 500
let solveStart, solveEnd

const data = findGetParameter()
const cityCoordinates = CreateCoordinates(data) // [ [normalizeLat, normalizeLong, Lat, Long, name], ... ]
let routePath = cityCoordinates.map((x) => [x[2], x[3]])
let controlLayer = mapRoutePoints(routePath)


const num_of_cities = cityCoordinates.length;

const MUTATE_RATE = 0.2;
const CROSSOVER_RATE = 0.75;
const POPULATION_NUM = 100;
const GENERATION_MIN = 32


// await new Promise((resolve) => {
//   sticky.onload = () => {
//     resolve()
//   }
// })
Background(); // init canvas + map
CreateCities(); // drow cities on ctx with names + on map with names
SYSTEM_STATE.ready = true
setTimeout(centerWindow, 350)

document.querySelector("button.solve").addEventListener("click", start)
document.querySelector("button.backbtn").addEventListener("click", backToInputs)

function findGetParameter() {
  const tmp = {};
  const posLimits = { LatMax: -Infinity, LongMax: -Infinity, LatMin: Infinity, LongMin: Infinity }
  location.search
    .slice(1)
    .split("&")
    .forEach(item => {
      const [attr, val] = item.split("=")
      const [worker, key] = attr.split("-");
      tmp[worker] = { ...tmp[worker], [key]: key == 'name' ? decodeURIComponent(val.replaceAll("+", " ")) : parseFloat(val) }
      if (key == "Lat") {
        posLimits.LatMax = Math.max(posLimits.LatMax, val)
        posLimits.LatMin = Math.min(posLimits.LatMin, val)
      }
      if (key == "Long") {
        posLimits.LongMax = Math.max(posLimits.LongMax, val)
        posLimits.LongMin = Math.min(posLimits.LongMin, val)
      }
    });
  tmp.posLimits = posLimits
  return tmp;
}

function Background() {
  ctx.canvas.width = `${MAP_SIZE}`
  ctx.canvas.height = `${MAP_SIZE}`

  ctx.globalAlpha = 0.8;
  ctx.fillStyle = "#efefef";
  ctx.fillRect(0, 0, MAP_SIZE, MAP_SIZE);
  // ctx.drawImage(sticky, 0, 0, MAP_SIZE, MAP_SIZE)
  ctx.globalAlpha = 1;

  mapInit()
}

function centerWindow() {
  var container = document.querySelector("html");
  var middle = document.querySelector("canvas");
  container.scrollLeft = middle.offsetLeft + middle.offsetWidth / 2 - container.offsetWidth / 2;
}

function CreateCoordinates(data) {
  const Xnorm = MAP_SIZE * 0.94 / (data.posLimits.LatMax - data.posLimits.LatMin)
  const Ynorm = MAP_SIZE * 0.94 / (data.posLimits.LongMax - data.posLimits.LongMin)
  const coordinates = []
  for (let worker in data) {
    if (worker == "posLimits") continue
    const wdata = data[worker]
    const normalizeLat = (wdata.Lat - data.posLimits.LatMin) * Xnorm + MAP_SIZE * 0.03
    const normalizeLong = (wdata.Long - data.posLimits.LongMin) * Ynorm + MAP_SIZE * 0.03
    coordinates.push([normalizeLat, normalizeLong, wdata.Lat, wdata.Long, wdata.name]);
  }
  return coordinates
}

function CreateCities() {
  const CITY_SIZE = 5
  const CITY_NAME_SIZE = 15
  const CITY_NUMBER_OFFSET = { x: 5, y: 9 }

  cityCoordinates.forEach((coor) => {
    const Lat = coor[0];
    const Long = coor[1];
    ctx.fillStyle = "black";

    let xText = Lat + CITY_NUMBER_OFFSET.x
    if (Lat > MAP_SIZE / 2) {
      xText = Lat - CITY_NUMBER_OFFSET.x - coor[4].length * CITY_NAME_SIZE / 2
    }
    let yText = Long + CITY_NUMBER_OFFSET.y
    if (Long > MAP_SIZE / 2) {
      yText = Long - CITY_NUMBER_OFFSET.y
    }
    ctx.beginPath();
    ctx.arc(Lat, Long, CITY_SIZE, 0, 2 * Math.PI); // circle at (Lat, Long)
    ctx.fill();

    ctx.font = `${CITY_NAME_SIZE}px sans-serif`;
    ctx.fillText(coor[4], xText, yText); // city name at (xText, yText)
  })
}

function CalculateDistance([, , aLat, aLong], [, , bLat, bLong]) { //returns distance between two points
  const DEGtoRAD = (deg) => (deg * (Math.PI / 180))
  const LATtoKM = (Lat) => (Lat * 110.574)
  const LONGtoKM = (Long, Lat) => (Long * 111.320 * Math.cos(DEGtoRAD(Lat)))
  return Math.sqrt(Math.pow(LATtoKM(aLat - bLat), 2) + Math.pow(LONGtoKM(aLong - bLong, (aLat + bLat) / 2), 2));
}

function CalculateRoute(route) { //calculates route length (order matters)
  return route.reduce((s, x, i) =>
    (i != route.length-1) ? (s + CalculateDistance(x, route[i + 1])) : s + 0
    , 0)
}

function getPathText(path) {
  let text = "";
  for (let i = 0; i < path.length; i++) {
    const cityIndex = path[i]
    text += (cityCoordinates[cityIndex][4])
    if (i != path.length - 1) text += "&#x200E; > "
  }
  return text;
}

//person starts the animation
function start() {
  if (!SYSTEM_STATE.ready) return
  solveStart = performance.now();
  SYSTEM_STATE.ready = false
  // bestPossibleRoute = CalculateRoute(cityCoordinates);

  const pop = new TSP(MUTATE_RATE, CROSSOVER_RATE, POPULATION_NUM, num_of_cities);

  pop.Epoch();
}

function drawRoute(cityPath) {

  for (let i = 0; i < cityPath.length - 1; i++) {
    const startCoor = cityCoordinates[cityPath[i]];
    const endCoor = cityCoordinates[cityPath[i + 1]];

    ctx.beginPath();
    ctx.moveTo(startCoor[0], startCoor[1]);
    ctx.lineTo(endCoor[0], endCoor[1]);
    ctx.stroke();
  }

  const route = cityPath.map((x) => [cityCoordinates[x][2], cityCoordinates[x][3]])
  if (controlLayer) map.removeControl(controlLayer)
  controlLayer = mapRoutePoints(route)
  controlLayer.route()
}

//acessor methods

function RandomInt(min, max) { //min and max are inclusive
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

//GENOME CODE --------------------------------------------------------------------------------

class Genome {
  constructor() {
    this.fitness;
    this.cities = this.GrabPermutation();

  }
  GrabPermutation() { // return an option for randomize cities (keep base and dest)
    const orderedCities = [];

    for (let i = 2; i < num_of_cities; i++) {
      orderedCities.push(i)
    }

    const randomCities = [0]; // for start point
    for (let i = 2; i < num_of_cities; i++) {
      const index = RandomInt(0, orderedCities.length - 1);
      const city = orderedCities[index];
      randomCities.push(city);
      orderedCities.splice(index, 1);

    }
    randomCities.push(1); // for end point
    return randomCities;
  }
  TourLength() {
    const citiesByOrder = this.cities.map((x) => cityCoordinates[x])
    return CalculateRoute(citiesByOrder);
  }
}

//TSP CODE ------------------------------------------------------------------------

class TSP {
  constructor(mutRate, crossRat, popSize, numCities = num_of_cities) {
    this.population = [];
    this.mutationRate = mutRate;
    this.crossoverRate = crossRat;
    this.populationSize = popSize;
    this.chromosomeLength = numCities;

    this.generationNumber = 0;
    this.population = Array(this.populationSize).fill(new Genome())

  }
  Mutate(chromosome) {
    if (Math.random > this.mutationRate) {
      return chromosome;
    }

    var pos1 = RandomInt(1, chromosome.length - 2);
    var pos2 = RandomInt(1, chromosome.length - 2);

    while (pos1 == pos2) {
      var pos2 = RandomInt(1, chromosome.length - 2);
    }

    const tempCity = chromosome[pos1];
    chromosome[pos1] = chromosome[pos2];
    chromosome[pos2] = tempCity;
    return chromosome;
  }
  Crossover(d, m, b1, b2) {
    const dad = [...d];
    const mom = [...m]
    const baby1 = [...b1]
    const baby2 = [...b2]

    if ((Math.random() > this.crossoverRate) || (dad == mom)) {
      return [baby1, baby2];
    }

    const beg = RandomInt(0, mom.length - 3);

    var end = beg;

    while (end <= beg) {
      end = RandomInt(0, mom.length - 2);
    }

    //now we iterate through the matched pairs of genes from beg
    //to end swapping the places in each child
    for (let i = beg; i < end + 1; i++) {
      const gene1 = mom[i];
      const gene2 = dad[i];

      if (gene1 != gene2) {
        //baby1
        let posGene1 = baby1.indexOf(gene1);
        let posGene2 = baby1.indexOf(gene2);

        baby1[posGene1] = gene2;
        baby1[posGene2] = gene1;

        //baby2
        posGene1 = baby2.indexOf(gene1);
        posGene2 = baby2.indexOf(gene2);

        baby2[posGene1] = gene2;
        baby2[posGene2] = gene1;

      }
    }

    return [baby1, baby2];

  }
  CalculatePopulationFitness() {
    this.population.forEach((x) => { // set shortestRoute, longestRoute, fittestGenome, fittestPath
      const tourLength = x.TourLength();
      x.fitness = tourLength;

      if (tourLength < this.shortestRoute) {
        this.shortestRoute = tourLength;
        this.fittestGenome = x;
        this.fittestPath = x.cities;
        this.distance = tourLength;
      }

      if (tourLength > this.longestRoute) {
        this.longestRoute = tourLength;
      }
    })

    this.population.forEach((x) => { // set fitness for each genome and totalFitness
      x.fitness = this.longestRoute - x.fitness;
      this.totalFitness += x.fitness;
    })

  }
  Epoch() {
    this.Reset();
    this.CalculatePopulationFitness();
    if (this.generationNumber == Math.max(Math.pow(2, num_of_cities), GENERATION_MIN)) {
      solveEnd = performance.now();
      Background();
      CreateCities(num_of_cities);
      drawRoute(this.fittestPath);
      document.getElementById("gen").innerHTML = "Generation: " + this.generationNumber;
      document.getElementById("path").innerHTML = "Path: " + getPathText(this.fittestPath);
      document.getElementById("distance").innerHTML = "Distance: " + Math.round(this.distance) + " Kilometers";
      document.getElementById("time").innerHTML = "Solved in: " + ((solveEnd - solveStart) / 1000).toFixed(3) + " Seconds";
      SYSTEM_STATE.ready = true;
      return;
    }

    const offSpring = Array(4).fill(this.fittestGenome);


    while (offSpring.length < this.population.length) {
      var mom = this.RouletteWheel();
      var dad = this.RouletteWheel();

      var baby1 = new Genome();
      var baby2 = new Genome();

      var babyCities = this.Crossover(dad.cities, mom.cities, baby1.cities, baby2.cities);

      baby1.cities = babyCities[0];
      baby2.cities = babyCities[1];

      baby1.cities = this.Mutate(baby1.cities);
      baby2.cities = this.Mutate(baby2.cities);

      offSpring.push(baby1);
      offSpring.push(baby2);
    }

    this.population = offSpring;

    this.generationNumber += 1;

    // Background();
    // CreateCities(num_of_cities);
    // drawRoute(this.fittestPath);
    document.getElementById("gen").innerHTML = "Generation: " + this.generationNumber;
    document.getElementById("path").innerHTML = "Path: " + getPathText(this.fittestPath);
    document.getElementById("distance").innerHTML = "Distance: " + Math.round(this.distance) + " Kilometers";
    document.getElementById("time").innerHTML = "Solved in: " + ((performance.now() - solveStart) / 1000).toFixed(3) + " Seconds";
    var scope = this;
    setTimeout(() => scope.Epoch(), 1); //keeps on repeating, recursive

  }
  Reset() {
    this.shortestRoute = Infinity;
    this.longestRoute = 0;
    this.fittestGenome = this.population[0];
    this.totalFitness = 0;
    this.fittestPath = [];
    this.distance = 0;
  }
  RouletteWheel() { // choose random genome
    const slice = Math.random() * this.totalFitness;

    var total = 0;
    var selectedGenome = 0;

    for (let i = 0; i < this.populationSize; i++) {
      total += this.population[i].fitness;
      if (total > slice) {
        selectedGenome = i;
        break;
      }
    }

    return this.population[selectedGenome];

  }
}