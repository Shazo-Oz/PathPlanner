const $ = selector => document.querySelector(selector)
const $$ = selector => document.querySelectorAll(selector)


function backToInputs() {
  location = (location.href.slice(0, location.href.lastIndexOf("/")) + "/index.html" + location.search)
}
const pointsMarkerObserver = new MutationObserver(mutations=> {
  mutations.forEach(mutationRecord=> {
    const el = mutationRecord.target
    const uuid = el.getAttribute("divId")
    $(`#${uuid}`).setAttribute("style", el.getAttribute("style"))
  });
});
const SYSTEM_STATE = { ready: false }

const map = L.map('map');

let solveStart, solveEnd

const data = findGetParameter()
const cityCoordinates = CreateCoordinates(data) // [ [Lat, Long, name], ... ]
let controlLayer
let markerLayer = []


const num_of_cities = cityCoordinates.length;

const MUTATE_RATE = 0.2;
const CROSSOVER_RATE = 0.75;
const POPULATION_NUM = 100;
const GENERATION_MIN = 32


Background(); // init map
let routePath = cityCoordinates.map((x) => {
  const waypoint = new L.Routing.Waypoint();
  waypoint.latLng = {
    lat: x[0],
    lng: x[1]
  }
  waypoint.name = x[2];
  return waypoint
})
controlLayer = CreateCities(routePath) // drow cities on map with names
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
  const coords = [cityCoordinates[0][0], cityCoordinates[0][1]]
  map.setView(coords, 16);
  //&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    minZoom: 2,
    attribution: 'Maps and routes from <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>. data uses <a href="http://opendatacommons.org/licenses/odbl/">ODbL</a> license'
  }).addTo(map);
  $("#mapErrText").innerHTML = ""
}

function centerWindow() {
  var container = document.querySelector("html");
  var middle = document.querySelector("#map");
  container.scrollLeft = middle.offsetLeft + middle.offsetWidth / 2 - container.offsetWidth / 2;
}

function CreateCoordinates(data) {
  const coordinates = []
  for (let worker in data) {
    if (worker == "posLimits") continue
    const wdata = data[worker]
    coordinates.push([wdata.Lat, wdata.Long, wdata.name]);
  }
  // console.log(data)
  // console.log(coordinates)
  return coordinates
}

function CreateCities(waypoints, calc = false) {
  if (controlLayer) map.removeControl(controlLayer)
  const routeControl = L.Routing.control({
    waypoints,
    autoRoute: false,
    draggableWaypoints: false,
    addWaypoints: false,
    createMarker: () => null,
  }).addTo(map);
  markerLayer.forEach(m => map.removeLayer(m))
  $$(".leaflet-marker-pane>div[id]").forEach(div => div.remove())

  waypoints.forEach(w => {
    const mark = L.marker(w.latLng, { title: w.name, alt: w.name, riseOnHover: true })
    mark.addTo(map)
    markerLayer.push(mark)
  })
  const uuid=uuidv4()
  $$(".leaflet-marker-pane>img[title]").forEach(el => {
    // if (el.hasAttribute("divID")) $(`#${el.getAttrubute("divID")}`).remove()
    const div = document.createElement("div")
    div.innerHTML = el.getAttribute("title")
    div.setAttribute("style", el.getAttribute("style"))
    let uid = uuid.next().value
    div.id = uid
    el.setAttribute("divID", uid)
    pointsMarkerObserver.observe(el, { attributes: true, attributeFilter: ['style'] });
    el.parentElement.append(div)
  })

  if (calc) {
    const DirectionObserver = new MutationObserver(([e]) => {
      const title = document.createElement("div")
      title.classList.add("h2")
      title.innerHTML = "Directions via roads:"
      const roads = e.target.querySelector("h2")
      roads.parentElement.insertBefore(title, roads)
      const dis = e.target.querySelector("h3")
      dis.parentElement.insertBefore(document.createElement("hr"), dis.nextElementSibling)
    });
    routeControl.route() // draw path between waypoints
    const directionsCon = $(".leaflet-top.leaflet-right .leaflet-routing-container.leaflet-bar.leaflet-control")
    directionsCon.querySelectorAll("span[class*='btn']").forEach(e => e.remove())
    const directions = $(".leaflet-top.leaflet-right .leaflet-routing-alternatives-container")
    

    DirectionObserver.observe(directions, { characterData: false, childList: true, attributes: false })
    $(".directionsPop").append(directionsCon)

  }
  return routeControl
}

function* uuidv4(){
  let id=0
  while(true){
    id++
    yield `imti${id}`
  }
} 

function CalculateDistance([aLat, aLong], [bLat, bLong]) { //returns distance between two points
  const DEGtoRAD = (deg) => (deg * (Math.PI / 180))
  const LATtoKM = (Lat) => (Lat * 110.574)
  const LONGtoKM = (Long, Lat) => (Long * 111.320 * Math.cos(DEGtoRAD(Lat)))
  return Math.sqrt(Math.pow(LATtoKM(aLat - bLat), 2) + Math.pow(LONGtoKM(aLong - bLong, (aLat + bLat) / 2), 2));
}

function CalculateRoute(route) { //calculates route length (order matters)
  return route.reduce((s, x, i) =>
    (i != route.length - 1) ? (s + CalculateDistance(x, route[i + 1])) : s + 0
    , 0)
}

function getPathText(path) {
  let text = "";
  path.forEach((x, i) => {
    text += (cityCoordinates[x][2])
    if (i != path.length - 1) text += "&#x200E; > "
  })
  return text;
}

//person starts the animation
function start() {
  if (!SYSTEM_STATE.ready) return
  solveStart = performance.now();
  SYSTEM_STATE.ready = false

  const pop = new TSP(MUTATE_RATE, CROSSOVER_RATE, POPULATION_NUM, num_of_cities);

  pop.Epoch();
}

function drawRoute(cityPath) {
  const route = cityPath.map((x) => {
    const val = cityCoordinates[x]
    const waypoint = new L.Routing.Waypoint();
    waypoint.latLng = {
      lat: val[0],
      lng: val[1]
    }
    waypoint.name = val[2];
    return waypoint
  })
  if (controlLayer) map.removeControl(controlLayer)
  controlLayer = CreateCities(route, true)

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
      drawRoute(this.fittestPath);
      document.getElementById("gen").innerHTML = "Generation: " + this.generationNumber;
      document.getElementById("path").innerHTML = "Path: " + getPathText(this.fittestPath);
      document.getElementById("distance").innerHTML = "Air Distance: " + this.distance.toFixed(3) + " Kilometers";
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
    // drawRoute(this.fittestPath);
    document.getElementById("gen").innerHTML = "Generation: " + this.generationNumber;
    document.getElementById("path").innerHTML = "Path: " + getPathText(this.fittestPath);
    document.getElementById("distance").innerHTML = "Air Distance: " + this.distance.toFixed(3) + " Kilometers";
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