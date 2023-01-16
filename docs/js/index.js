import { docRef } from './fb-init.js'
import { updateDoc, getDoc } from 'https://www.gstatic.com/firebasejs/9.14.0/firebase-firestore.js';

const registerServiceWorker = async () => {
    if ("serviceWorker" in navigator) {
        try {
            const registration = await navigator.serviceWorker.register("/sw.js", {
                scope: "/",
            });
            if (registration.installing) {
                console.log("Service worker installing");
            } else if (registration.waiting) {
                console.log("Service worker installed");
            } else if (registration.active) {
                console.log("Service worker active");
            }
        } catch (error) {
            console.error(`Registration failed with ${error}`);
        }
    }
};

registerServiceWorker();
const $ = selector => document.querySelector(selector)
const $$ = selector => document.querySelectorAll(selector)

var map = L.map('map');
const mapInit = () =>
    new Promise(res => {
        navigator.geolocation.getCurrentPosition((p) => {
            const coords = [p.coords.latitude, p.coords.longitude]
            map.setView(coords, 16);
            //&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>
            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                minZoom: 2,
                attribution: 'Maps and routes from <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>. data uses <a href="http://opendatacommons.org/licenses/odbl/">ODbL</a> license'
            }).addTo(map);
            $("#mapErrText").innerHTML = ""
            res({ code: 200, message: "success" })
        }, () => {
            try {
                map.setView([31.85, 35.27], 8);
                //&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>
                L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 19,
                    minZoom: 2,
                    attribution: 'Maps and routes from <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>. data uses <a href="http://opendatacommons.org/licenses/odbl/">ODbL</a> license'
                }).addTo(map);
                $("#mapErrText").innerHTML = ""
                res({ code: 200, message: "success" })
            } catch (e) {
                console.table(e);
                $("#mapErrText").innerHTML = `<strong><center><big><br>${e.message}</big></center></strong>`
                res(e)
            }
        })
    })


const MIN_POINTS_TO_CALC = 4
const START_POINT_NAME = "Start Point"
const END_POINT_NAME = "End Point"
const POINT_PICKER = "pointPicker"
const LAST_POINT_PICKER = "isLast"
const EDIT_POINT_PICKER = "editing"

const mapDiv = $("#map")
const pointsList = $(".pointsList")
const addBasePoint = $("#basePoint") //strat btn
const addDestPoint = $("#destPoint")


addBasePoint.addEventListener("click", basePoint)
$("form").addEventListener("submit", handleSubmit)


async function basePoint(e) {
    mapDiv.style.display = "block"
    mapDiv.setAttribute(POINT_PICKER, "true")
    if ((await mapInit()).code != 200) return
    $("#mapContinue").addEventListener("click", firstSelection, { once: true })
    addBasePoint.remove()
    $("#mapConfirm").addEventListener("click", confirmSelection)
    $("#mapCancel").addEventListener("click", cancelSelection)
}

function firstSelection(e, user=true) {
    // add point to list
    if(user){
        const point = map.getCenter()
        const pointDesc = {
            "aria-label": "_base",
            "_base-name": START_POINT_NAME,
            "_base-Lat": point.lat,
            "_base-Long": point.lng
        }
        confirmSelection(e, pointDesc)
    }

    // set "add point from map/places" btns
    $$(".adding").forEach((btn) => {
        btn.classList.add("show")
        btn.addEventListener("click", (e) => {
            switch (e.target.id) {
                case "addPoint":
                    mapDiv.style.display = "block"
                    mapDiv.setAttribute(POINT_PICKER, true)
                    break;

                case "savedPoint":
                    pickFromPlaces()
                    break;

                default:
                    break;
            }
        })
    })
    // change map layout
    $("#initProps").remove()
}

function cancelSelection(e) {
    mapDiv.style.display = "none"
    mapDiv.removeAttribute(LAST_POINT_PICKER)
    mapDiv.removeAttribute(POINT_PICKER)
    $('#places').classList.remove('show')
}

function confirmSelection(e, attr) {
    if (mapDiv.getAttribute(POINT_PICKER) != "true") return
    if (mapDiv.getAttribute(LAST_POINT_PICKER) == "true") {
        if (attr==null) {
            const point = map.getCenter()
            attr = {
                "aria-label": "_dest",
                "_dest-name": END_POINT_NAME,
                "_dest-Lat": point.lat,
                "_dest-Long": point.lng
            }
        }
    }
    const isEditing = mapDiv.hasAttribute(EDIT_POINT_PICKER)

    // con=>template, li=>new li element
    const con = document.querySelector("ul>template").content.cloneNode(true)
    let li = con.querySelector("span").parentElement
    // set name and attributes (aria-label, name, lat, long)
    if (attr != null) { // for first and last points
        Object.entries(attr).forEach(([name, val]) => {
            li.setAttribute(name, val)
        })
        li.querySelector("span").innerHTML = attr[`${attr["aria-label"]}-name`]
    } else { // for generic points
        if (isEditing) {
            li = document.querySelector(`ul>li[aria-label='${mapDiv.getAttribute(EDIT_POINT_PICKER)}']`)
        }
        const wNum = pointsList.children.length - 1 // minus 1 for the template
        const pName = prompt("Point name", li.getAttribute(`${li.getAttribute('aria-label')}-name`) || `Point #${wNum}`)
        if (pName == null) return cancelSelection() // user chose cancel on point name prompt
        const point = map.getCenter()
        li.setAttribute(`aria-label`, mapDiv.getAttribute(EDIT_POINT_PICKER) || `worker${wNum}`)
        li.setAttribute(`${li.getAttribute('aria-label')}-name`, pName)
        li.setAttribute(`${li.getAttribute('aria-label')}-Lat`, point.lat)
        li.setAttribute(`${li.getAttribute('aria-label')}-Long`, point.lng)
        li.querySelector("span").innerHTML = pName
    }
    if (!isEditing) {
        // set edit and save btns (for the new point)
        li.querySelector("button[title='edit point']").addEventListener("click", editPoint);
        li.querySelector("button[title='save point']").addEventListener("click", savePoint);

        // append
        pointsList.append(li)
    }

    // offset map Center
    const mapOffset = {
        2: 0.3,
        3: 0.2,
        4: 0.1,
        5: 0.1,
        6: 0.03,
        7: 0.02,
        8: 0.01,
        9: 0.01,
        10: 0.003,
        11: 0.002,
        12: 0.001,
        13: 0.0003,
        14: 0.0002,
        15: 0.0001,
        16: 0.00003,
        17: 0.00002,
        18: 0.00001,
        19: 0.00001,
    }
    try {
        map.panTo([map.getCenter().lat + mapOffset[map.getZoom()], map.getCenter().lng + mapOffset[map.getZoom()]]);
    } catch { }

    mapDiv.style.display = "none"
    mapDiv.removeAttribute(POINT_PICKER)
    mapDiv.removeAttribute(EDIT_POINT_PICKER)
    $('#places').classList.remove('show')
    // if last point, remove "add point btns"
    if (mapDiv.getAttribute(LAST_POINT_PICKER) == "true") {
        mapDiv.removeAttribute(LAST_POINT_PICKER)
        $$(".adding").forEach(btn => btn.remove())
        addDestPoint.remove()
        $("#calcPath").classList.add("show")
        return
    }
    // add the option to finish the route
    if (pointsList.children.length >= MIN_POINTS_TO_CALC) {
        addDestPoint?.classList.add("show")
        addDestPoint?.addEventListener("click", destPoint)
    }
}

function confirmSelectionFromPlaces({ pName, pCoords }) {
    const con = document.querySelector("ul>template").content.cloneNode(true)
    let li = con.querySelector("span").parentElement
    const wNum = pointsList.children.length - 1 // minus 1 for the template
    li.setAttribute(`aria-label`, `worker${wNum}`)
    li.setAttribute(`${li.getAttribute('aria-label')}-name`, pName)
    li.setAttribute(`${li.getAttribute('aria-label')}-Lat`, pCoords.lat)
    li.setAttribute(`${li.getAttribute('aria-label')}-Long`, pCoords.long)
    li.querySelector("span").innerHTML = pName

    // set edit and save btns (for the new point)
    li.querySelector("button[title='edit point']").addEventListener("click", editPoint);
    li.querySelector("button[title='save point']").addEventListener("click", savePoint);

    // append
    pointsList.append(li)
    // add the option to finish the route
    if (pointsList.children.length >= MIN_POINTS_TO_CALC) {
        addDestPoint?.classList.add("show")
        addDestPoint?.addEventListener("click", destPoint)
    }
}

function destPoint(e) {
    mapDiv.style.display = "block"
    mapDiv.setAttribute(POINT_PICKER, true)
    mapDiv.setAttribute(LAST_POINT_PICKER, true)
}

function handleSubmit(e) {
    const inpEdges = document.createElement("div")
    const inps = document.createElement("div")
    $$(".pointsList>li").forEach((p, i) => {
        const pLabel = p.getAttribute("aria-label")
            ;['name', 'Lat', 'Long'].forEach((x, i) => {
                const path = `${pLabel}-${x}`
                const val = (p.getAttribute(path))
                const inp = document.createElement("input")
                inp.hidden = true
                inp.setAttribute("name", path)
                inp.setAttribute("value", val)
                if (path.startsWith("worker")) inps.append(inp)
                else inpEdges.append(inp)
            })
    })
    $("form").append(inpEdges)
    $("form").append(inps)
}

function editPoint(e) {
    const ariaLabel = e.target.parentElement.getAttribute("aria-label")
    mapDiv.style.display = "block"
    mapDiv.setAttribute(POINT_PICKER, true)
    mapDiv.setAttribute(EDIT_POINT_PICKER, ariaLabel)

}

async function savePoint(e) {
    const li = e.target.parentElement
    const ariaLabel = li.getAttribute("aria-label")
    const pointName = prompt("Point name:", li.getAttribute(`${ariaLabel}-name`))
    const pointCoords = { lat: li.getAttribute(`${ariaLabel}-lat`), long: li.getAttribute(`${ariaLabel}-long`) }

    try {
        const docSnap = (await getDoc(docRef())).data()
        await updateDoc(docRef(), {
            savedPoints: { ...docSnap.savedPoints, [pointName]: pointCoords }
        })
        alert("The point was successfully saved")
    } catch (e) {
        alert(e.message + " Please try again later")
    }
}

async function pickFromPlaces() {
    const list = $('#placesList');
    [...list.children].forEach(ch => ch.remove())
    const docSnap = (await getDoc(docRef())).data()
    Object.entries(docSnap.savedPoints).forEach(([pName, pCoords]) => {
        const li = document.createElement("li")
        li.setAttribute("pName", pName)
        const coordsSTR = parseFloat(pCoords.lat).toFixed(3) + " / " + parseFloat(pCoords.long).toFixed(3)
        li.setAttribute("title", coordsSTR)
        li.innerHTML = pName
        li.addEventListener("click", () => confirmSelectionFromPlaces({ pName, pCoords }))
        list.append(li)
    })
    list.parentElement.classList.add("show")
}

function findGetParameter() {
    if (location.search == "") return {}
    const tmp = {};
    location.search
        .slice(1)
        .split("&")
        .forEach(item => {
            const [attr, val] = item.split("=")
            const [worker, key] = attr.split("-")
            tmp[worker] = { ...tmp[worker], [key]: key == 'name' ? decodeURIComponent(val.replaceAll("+", " ")) : parseFloat(val) }
        });
    return tmp;
}

let workerNum = 1
let lastAttr=false
Object.entries(findGetParameter()).forEach(([, { name, Lat, Long }], id) => {
    mapDiv.setAttribute(POINT_PICKER, "true");
    const attr = {}
    switch (id) {
        case 0:
            attr['aria-label'] = "_base"
            break;
        case 1:
            attr['aria-label'] = "_dest"
            lastAttr = true
            break;
        default:
            attr['aria-label'] = "worker" + workerNum
            workerNum++
            break;
    }
    const key = attr['aria-label']
    attr[`${key}-name`] = name
    attr[`${key}-Lat`] = Lat
    attr[`${key}-Long`] = Long
    if (lastAttr===true) {
        lastAttr = attr
        return
    }
    confirmSelection(undefined, attr)
})
if (lastAttr!==false && workerNum>1){
    await basePoint(undefined, false)
    $("#initProps").remove()
    mapDiv.setAttribute(LAST_POINT_PICKER, "true")
    mapDiv.setAttribute(POINT_PICKER, "true")
    confirmSelection(undefined, lastAttr)
    addBasePoint.remove()
}
