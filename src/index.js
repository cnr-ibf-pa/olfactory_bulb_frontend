import _ from 'lodash'
import './style.css'
import 'jquery'
import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css'
import { GUI } from 'dat.gui'
import colorGradient from "javascript-color-gradient"

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

import EBRAINS_logo from "../static/img/ebrains_logo.svg"
import colorMap from "../static/img/colorMap.svg"

const axios = require('axios');

let colormap = require('colormap')
let colorMapGlShades = 10

let colorsGlom = colormap({
    colormap: 'hot',
    nshades: colorMapGlShades,
    format: 'hex',
    alpha: 1
})

/*
 * SET BULB'S ELEMENT GRAPHICS PROPERTIES
 */

/* gids - info
mitral: [0-634]
medial tufted: [635-1904]
granule: [1905-390516]
blanes: [390517-390898]
*/

const glomeruliLimits = _.range(0, 127)
const mcLimits = _.range(0, 635)
const tmcLimits = _.range(636, 1905)
const granulesLimits = _.range(1906, 390517)
const blanesLimits = _.range(390518, 390899)

const numMitrPerGlom = 5
const numTMitrPerGlom = 10
const numMitral = 635

const scale_factor = 1
const granularity = 1

const cylinderResolution = 20

const glom_resolution = 60
const glom_base_radius = 35
const glom_selected_radius = 62

const glom_base_color = new THREE.Color(0xe74c3c)
const glom_inactive_color = new THREE.Color(0x8a8a8a)

const glom_hovered_color = new THREE.Color(0x9a7d0a)
const glom_hovered_inactive_color = new THREE.Color(0x3d1656)

const glom_base_geometry = new THREE.SphereGeometry(glom_base_radius, glom_resolution, glom_resolution);
const glom_hovered_geometry = new THREE.SphereGeometry(glom_selected_radius, glom_resolution, glom_resolution);

const granule_radius = 6
const granule_resolution = 6

const granule_base_geometry = new THREE.SphereGeometry(granule_radius, granule_resolution, granule_resolution);

const cameraPositions = [8855, -7873, 7045]
const cameraFov = 20

let currentGlomColor
let odorValues



// ========================== AUTHENTICATION ======================================00 
import * as m_oidc from './handlers/auth.js';

var user_json = window.sessionStorage.getItem('user'); // check if user is already logged in

if (!user_json) {
    m_oidc.init(); // run login
} else {
    var user = JSON.parse(user_json); // parse user json
}
console.log(user.id_token); // fetch token
console.log(user.profile.preferred_username); // fetch username

// ==================================================================================

const listeners = {
    "glom": { "click": selectGlom, "mouseover": highlightElement, "mouseleave": restoreColor },
    //"mitr": { "click": , "mouseover": , "mouseleave": },
    //"tuft": { "click": , "mouseover": , "mouseleave": },

}
// Build the page DOM
window.onload = buildDOM();
var actualSizes = get_canvas_dimensions()

/*
 * SET SCENE PARAMETERS 
 */
const scene = new THREE.Scene();
const pointLight = new THREE.PointLight(0xffffff, 1)
const pointLight2 = new THREE.PointLight(0xffffff, 1)
const pointLight3 = new THREE.PointLight(0xffffff, 1)
const pointLight4 = new THREE.PointLight(0xffffff, 1)
var sizes = { width: window.innerWidth - actualSizes[0], height: window.innerHeight - actualSizes[1] }
const camera = new THREE.PerspectiveCamera(cameraFov, sizes.width / sizes.height, 0.01, 6000000)
camera.zoom = 1
const canvas = document.querySelector('#v_canvas')
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true
})
var controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(cameraPositions[0], cameraPositions[1], cameraPositions[2])

let threeColorArrayGC = setColorThreeArray("#023f48", "#ccfdcc", 200, 100)
let threeColorArrayCell = setColorThreeArray("#800000", "#ffffff", 200, 100)
let threeColorArrayGloms = setColorArray("#800000", "#ffff66", 127)

/*
 * SET GLOBAL VARIABLES 
 */

// edit name
var selected_glom = "glom--"
var selected_mitr = "mitr--"
var selected_tuft = "mitr--"

var plottedNet = {}

// data container
let glom_list // list of glomeurali ids ("0" -> "126") in string format
let allGlomCoord // dictionary with all glomeurli coordinates
let simulatedCellIds = [] // 
let simulatedGloms = []
let simulatedConnections // all connections created during the simulation
let allGranulePositions // dictionary of all granule cell positions
let allMTCellsPositions

window.addEventListener('resize', resize);

createScene()
resize()
animate()
getSimulationData("")


//getSimulatedCellIds()
//createGUI()


function getSimulationData(origin) {
    let url, demoUrl

    demoUrl = "https://corsproxy.hbpneuromorphic.eu/https://object.cscs.ch:443/v1/AUTH_c0a333ecf7c045809321ce9d9ecdfdea/web-resources-bsp/data/olfactory-bulb/demo_sim/"

    if (origin == "") {
        url = demoUrl
    } else {
        url = origin
    }
    axios.get(demoUrl + 'ob_dict.json')
        .then(glomDict => {
            console.log(glomDict)
            allGlomCoord = glomDict.data.glom_coord
            axios.get(url + 'simgloms.json')
                .then(simGloms => {
                    console.log(url + 'simgloms.json')
                    let simulatedGlomsNum = simGloms.data.sim_gloms
                    for (let sg of simulatedGlomsNum) {
                        simulatedGloms.push(sg.toString())
                    }
                    axios.get(url + 'simcells.json')
                        .then(cellIds => {
                            console.log(cellIds)
                            let simulatedCellIdsNum = cellIds["data"]["sim_cells"];
                            for (let c of simulatedCellIdsNum) {
                                simulatedCellIds.push(c.toString())
                            }
                            axios.get(url + 'connections.json')
                                .then(connections => {
                                    simulatedConnections = connections.data
                                    axios.get(demoUrl + "granule_cells_red.json")
                                        .then(granules => {
                                            allGranulePositions = granules.data
                                            axios.get(demoUrl + 'eta_norm.json')
                                                .then(odors => {
                                                    odorValues = odors.data
                                                    axios.get(demoUrl + 'all_mt_cells.json')
                                                        .then(allMTCellsPos => {
                                                            allMTCellsPositions = allMTCellsPos
                                                            initializeSceneContent()
                                                        })
                                                })

                                        })
                                })
                        })
                })
        })
}

// Set color array for plotting elements with gradient colors

function setColorThreeArray(color1, color2, numColors, maxColorIdx) {
    let colorGradientArray = setColorArray(color1, color2, numColors)

    let threeColorArray = {}
    for (let i = 1; i < maxColorIdx + 1; i += 0.5) {
        let str = (Math.floor(i * 1000) / 1000).toString()
        threeColorArray[str] = new THREE.Color(colorGradientArray[i * 2 - 1])
    }
    return threeColorArray
}

function setColorArray(color1, color2, numColors) {
    let colorGradientArray = colorGradient
        .setGradient(color1, color2)
        .setMidpoint(numColors)
        .getArray()
    return colorGradientArray
}

// Get dimensions of the THREE.JS main canvas
function get_canvas_dimensions() {
    return [ge("params").clientWidth, ge("banner").clientHeight]
}

function initializeSceneContent() {
    glom_list = plotGlomeruli(allGlomCoord, simulatedGloms)

    let glom_ids = []
    for (let i of glom_list) {
        glom_ids.push(i.toString())
    }

    populateCellDropdown("glom", glom_ids)
    populateCellDropdown("mitr", [])
    populateCellDropdown("tuft", [])
}

/*
 * *********
 * FUNCTIONS
 * *********
 */
function runSimulation() {

}

function showGlomStrength() {
    let odorBtns = gecn("odor-btn")
    for (var i = 0; i < odorBtns.length; i++) {
        var odEl = ge(odorBtns[i].id)
        if (odEl.classList.contains("sel-for-sim")) {
            odEl.classList.remove("sel-for-sim")
        }
    }
    markForSim(this.id, "")

    let odor = this.id
    for (let idx of glomeruliLimits) {
        let glomName = "gsim_" + idx.toString()
        // console.log(odorValues[odor][idx] * colorMapGlShades, Math.round(odorValues[odor][idx] * colorMapGlShades))
        let value = Math.round(odorValues[odor][idx] * colorMapGlShades)
        ge(glomName).style.backgroundColor = colorsGlom[value]
    }
}

// Remove groups of cells from main canvas
function cleanCanvas() {
    for (let k in plottedNet) {
        if (k.slice(0, 3) != "glom") {
            if ((this.id == "clean-mc-btn" && mcLimits.includes(parseInt(k))) ||
                (this.id == "clean-tmc-btn" && tmcLimits.includes(parseInt(k)))) {
                removeSingleCell(k)

                delete plottedNet[k]
            }
        }
    }
}


function showWeights() {

    let boxClass, element, crrWgh, obj, cell

    let type = this.id.slice(0, 3)

    if (this.id == "inh-mitral-btn" || this.id == "exc-mitral-btn") {
        boxClass = "mitr-box-el"
    } else {
        boxClass = "tuft-box-el"
    }

    let cells = gecn(boxClass + " list-group-item active")

    for (let idx = 0; idx < cells.length; idx++) {
        cell = cells[idx].innerText
        if (cell == "--") {
            continue
        } else {
            // plot the selected cell if not plotted yet
            if (!Object.keys(plottedNet).includes(cell)) {
                addCell(allMTCellsPositions["data"][cell], cell)
            }
            let cellElConn = simulatedConnections
            let dendEl = plottedNet[cell]["dend"]
            for (let cde of Object.keys(dendEl)) {
                let dsegLen = dendEl[cde].length - 1

                for (let gcid of Object.keys(cellElConn[cell][cde])) {
                    crrWgh = cellElConn[cell][cde][gcid][type]
                    for (let w = 0; w < crrWgh.length; w += 2) {
                        let wPos = crrWgh[w + 1]
                        let wStr = crrWgh[w]
                        let dsegPos = Math.round(dsegLen * wPos).toString()
                        //console.log(cde, gcid, dsegLen, dsegPos, wPos, wStr)
                        obj = cell + "_dend_" + cde + "_" + dsegPos
                        element = scene.getObjectByName(obj)
                        if (element) {
                            element.material.color = threeColorArrayCell[wStr.toString()]
                        } else {
                            console.log("not found: ", obj)
                        }
                    }
                }
            }
        }



    }
}


// Launch the addCell procedure depending on the selected cell
function plotCell() {
    let boxClass, cell
    if (this.id == "add-mitral-btn") {
        boxClass = "mitr-box-el"
    } else {
        boxClass = "tuft-box-el"
    }
    let cells = gecn(boxClass + " list-group-item active")

    for (let idx = 0; idx < cells.length; idx++) {
        cell = cells[idx].innerText
        if (Object.keys(plottedNet).includes(cell)) {
            continue
        } else {
            addCell(allMTCellsPositions["data"][cell], cell);
        }
    }
}

// Plot all granule cells connected to a given mitral or tufted cell
function plotGranuleCell(cell) {
    for (let k of Object.keys(simulatedConnections[cell])) {
        for (let ik of Object.keys(simulatedConnections[cell][k])) {
            let gcInhConn = simulatedConnections[cell][k][ik]["inh"]
            let strength = 0
            for (let ist = 0; ist < gcInhConn.length; ist += 2) {
                strength = Math.max(strength, gcInhConn[ist])
            }
            var geometry = granule_base_geometry; // (radius, widthSegments, heightSegments)
            var material = new THREE.MeshStandardMaterial({
                depthWrite: false, transparent: false,
                opacity: 1.0, wireframe: false,
                color: threeColorArrayGC[strength.toString()]
            })
            var sphere = new THREE.Mesh(geometry, material)
            sphere.position.set(allGranulePositions[ik][0], allGranulePositions[ik][1], allGranulePositions[ik][2]);
            sphere.name = ik
            if (!Object.keys(plottedNet[cell]).includes("gc")) {
                plottedNet[cell]["gc"] = []
            }
            plottedNet[cell]["gc"].push(sphere.name)
            scene.add(sphere);
        }
    }
    renderer.render(scene, camera);
}

// Remove cell from canvas
function removeCell() {
    let boxClass, cell
    if (this.id == "remove-mitral-btn") {
        boxClass = "mitr-box-el"
    } else {
        boxClass = "tuft-box-el"
    }

    let cells = gecn(boxClass + " list-group-item active")

    for (let idx = 0; idx < cells.length; idx++) {
        cell = cells[idx].innerText
        removeSingleCell(cell)
    }
}

function removeSingleCell(cell) {
    for (let el of Object.keys(plottedNet[cell]))
        if (el == "gc") {
            for (let gce of plottedNet[cell][el]) {
                scene.remove(scene.getObjectByName(gce))
            }
        } else {
            for (let ink of Object.keys(plottedNet[cell][el])) {
                for (let finel in plottedNet[cell][el][ink]) {
                    let meshName = cell + "_" + el + "_" + ink + "_" + finel
                    scene.remove(scene.getObjectByName(meshName))
                }
            }
        }
    delete plottedNet[cell]
}

function getCellIds(glom_id) {
    let idNum = parseInt(glom_id)
    let startMitr = idNum * numMitrPerGlom
    let endMitr = idNum * numMitrPerGlom + numMitrPerGlom
    let startTMitr = numMitral + idNum * numTMitrPerGlom
    let endTMitr = numMitral + idNum * numTMitrPerGlom + numTMitrPerGlom
    let mitr = _.range(startMitr, endMitr)
    let tuft = _.range(startTMitr, endTMitr)
    let mitrString = []
    let tuftString = []
    for (let s of mitr) {
        mitrString.push(s.toString())
    }

    for (let s of tuft) {
        tuftString.push(s.toString())
    }

    return {
        "mitr": mitrString,
        "tuft": tuftString
    }
}

function createScene() {
    // Lights
    pointLight.position.set(0, 0, 0)
    pointLight2.position.set(0, 0, 30000)
    pointLight3.position.set(0, 5000, 0)
    //pointLight4.position.set(6000, 0, 0)
    scene.add(pointLight)
    scene.add(pointLight2)
    scene.add(pointLight3)
    scene.add(pointLight4)

    // Base camera
    scene.add(camera)

    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    controls.update()
    camera.position.set(cameraPositions[0], cameraPositions[1], cameraPositions[2])
    renderer.render(scene, camera);
}

function createGUI() {
    const gui = new GUI()

    const cameraFolder = gui.addFolder('Camera Controls')

    cameraFolder.add(camera.position, 'x', -100000, 100000).listen()
    cameraFolder.add(camera.position, 'y', -100000, 100000).listen()
    cameraFolder.add(camera.position, 'z', -200000, 200000).listen()
    cameraFolder.open()
}

// highlight element when hovering over
function highlightElement() {
    let name = "glom_" + this.id.slice(5)

    if (name != "glom--") {
        let element = scene.getObjectByName(name)
        let id = name.slice(5)
        if (simulatedGloms.includes(id)) {
            element.material.color = glom_hovered_color
        } else {
            element.material.color = glom_hovered_inactive_color
        }
        element.geometry = glom_hovered_geometry
    }
}


function selGloms() {
    let glomBtns = gecn("glom-btn")
    if (this.id == "sel-all-gloms") {
        for (let i = 0; i < glomBtns.length; i++) {
            markForSim(glomBtns[i].id, "all")
        }
    } else if (this.id == "des-all-gloms") {
        for (let i = 0; i < glomBtns.length; i++) {
            markForSim(glomBtns[i].id, "none")
        }
    } else if (this.id == "inv-all-gloms") {
        for (let i = 0; i < glomBtns.length; i++) {
            markForSim(glomBtns[i].id, "invert")
        }
    }
}
// mark glom for simulation
function markGlom() {
    markForSim(this.id, "")
}

function markForSim(el, opType) {
    if (opType == "") {
        if (!ge(el).classList.contains("sel-for-sim")) {
            ge(el).classList.add("sel-for-sim")
        } else {
            ge(el).classList.remove("sel-for-sim")
        }
    } else if (opType == "all") {
        if (!ge(el).classList.contains("sel-for-sim")) {
            ge(el).classList.add("sel-for-sim")
        }
    } else if (opType == "none") {
        if (ge(el).classList.contains("sel-for-sim")) {
            ge(el).classList.remove("sel-for-sim")
        }
    } else if (opType == "invert") {
        if (ge(el).classList.contains("sel-for-sim")) {
            ge(el).classList.remove("sel-for-sim")
        } else {
            ge(el).classList.add("sel-for-sim")
        }
    }
}

// reset color and geometry on mouse leave
function restoreColor() {
    let name = "glom_" + this.id.slice(5)
    let element = scene.getObjectByName(name)
    element.geometry = glom_base_geometry

    if (name == selected_glom) {
        return
    } else if (name != "glom--") {
        let id = name.slice(5)
        if (simulatedGloms.includes(id)) {
            element.material.color = glom_base_color
        } else {
            element.material.color = glom_inactive_color
        }
    }
}

// handle glomeruli selection
function selectGlom() {
    let name = this.id
    if (name == selected_glom) {
        return
    } else if (name == "glom--") {
        let old = scene.getObjectByName(selected_glom)
        old.geometry = glom_base_geometry
        if (simulatedGloms.includes(selected_glom.slice(5))) {
            old.material.color = glom_base_color
        } else {
            old.material.color = glom_inactive_color
        }
        selected_glom = "glom--"
        populateCellDropdown("mitr", [])
        populateCellDropdown("tuft", [])
    } else {
        let element = scene.getObjectByName(name)

        // reset previously selected cell
        if (selected_glom != "glom--") {
            let old = scene.getObjectByName(selected_glom)
            if (simulatedGloms.includes(selected_glom.slice(5))) {
                old.material.color = glom_base_color
            } else {
                old.material.color = glom_inactive_color
            }
            old.geometry = glom_base_geometry

        }
        selected_glom = name
        element.geometry = glom_base_geometry

        if (!simulatedGloms.includes(name.slice(5))) {
            var mitral_cells = []
            var tufted_cells = []
        } else {
            let cellDict = getCellIds(name.replace("glom_", ""))
            var mitral_cells = cellDict["mitr"]
            var tufted_cells = cellDict["tuft"]
        }
        populateCellDropdown("mitr", mitral_cells)
        populateCellDropdown("tuft", tufted_cells)
    }
}


// Animate
function animate() {
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

function populateCellDropdown(elType, elementList) {

    // elType is: "glom", "mitr", "tuft"

    // create box
    let elId = elType + "-box-names"

    let currentEl = ge(elId)

    if (currentEl) {
        currentEl.remove()
    }

    // remove current cell box
    if (ge(elId)) {
        ge(elId).remove()
    }

    let cellBox = cf('div')
    cellBox.classList.add("list-group")
    cellBox.id = elId

    // prepend first null element
    const allElements = ["--"].concat(elementList)
    for (let i of allElements) {
        var el = cf('a')
        el.classList.add("list-group-item", "list-group-item-action", elType + "-box-el")
        el.setAttribute("href", "#")
        el.setAttribute("data-bs-toggle", "list");
        el.innerHTML = i

        if (i == "--") {
            el.classList.add("active");
            el.setAttribute("aria-current", "true");
            el.id = elType + "--"
        } else {
            el.id = elType + "_" + i.toString()
        }
        cellBox.appendChild(el)

        if (elType == "glom") {
            if (!simulatedGloms.includes(i)) {
                el.classList.add("no-click");
            }
            el.addEventListener("click", selectGlom)
            el.addEventListener("mouseover", highlightElement)
            el.addEventListener("mouseleave", restoreColor)
        }

    }

    ge(elType + "-box").appendChild(cellBox)
    return cellBox
}

//
function createCellSelectionBox() {

    // Glomeruli box
    let glomBox = cf('div')
    glomBox.id = "glom-box"
    glomBox.classList.add("glom-box")

    let glomBoxTitle = cf('h5')
    glomBoxTitle.innerHTML = "Glomeruli"
    glomBoxTitle.classList.add('group-title')
    glomBox.appendChild(glomBoxTitle)

    // Mitral Cells box
    let mitrBox = cf('div')
    mitrBox.id = "mitr-box"
    mitrBox.classList.add("mitr-box")

    let mitrBoxTitle = cf('h5')
    mitrBoxTitle.innerHTML = "Mitral Cells"
    mitrBoxTitle.classList.add('group-title')
    mitrBox.appendChild(mitrBoxTitle)

    // Tuft Cells box
    let tuftBox = cf('div')
    tuftBox.id = "tuft-box"
    tuftBox.classList.add("tuft-box")

    let tuftBoxTitle = cf('h5')
    tuftBoxTitle.innerHTML = "Tufted Cells"
    tuftBoxTitle.classList.add('group-title')
    tuftBox.appendChild(tuftBoxTitle)

    //
    let listGroupsBox = cf('div')
    listGroupsBox.classList.add('row')

    let glomListBox = cf('div')
    glomListBox.classList.add('col')

    let mitrListBox = cf('div')
    mitrListBox.classList.add('col')

    let tuftListBox = cf('div')
    tuftListBox.classList.add('col')

    let boxButtons = cf('div')
    boxButtons.classList.add('cell-box-btn')

    // Select All Mitral Button
    let selMitralBtn = cf('button')
    selMitralBtn.classList.add("btn", "btn-secondary", "cell-btn", "sel-des")
    selMitralBtn.innerHTML = "Select All"
    selMitralBtn.id = "sel-mitral-btn"
    selMitralBtn.addEventListener("click", selectDeselectAll)

    // Deselect All Mitral Button
    let desMitralBtn = cf('button')
    desMitralBtn.classList.add("btn", "btn-secondary", "cell-btn", "sel-des")
    desMitralBtn.innerHTML = "Deselect All"
    desMitralBtn.id = "des-mitral-btn"
    desMitralBtn.addEventListener("click", selectDeselectAll)

    // Add Mitral Button
    let addMitralBtn = cf('button')
    addMitralBtn.classList.add("btn", "btn-secondary", "cell-btn")
    addMitralBtn.innerHTML = "Add Cell(s)"
    addMitralBtn.id = "add-mitral-btn"
    addMitralBtn.addEventListener("click", plotCell)

    // Remove Mitral Button
    let removeMitralBtn = cf('button')
    removeMitralBtn.classList.add("btn", "btn-secondary", "cell-btn")
    removeMitralBtn.innerHTML = "Remove Cell(s)"
    removeMitralBtn.id = "remove-mitral-btn"
    removeMitralBtn.addEventListener("click", removeCell)

    // Inh Mitral Button
    let inhMitralBtn = cf('button')
    inhMitralBtn.classList.add("btn", "btn-secondary", "cell-btn")
    inhMitralBtn.innerHTML = "Inhib. weights"
    inhMitralBtn.id = "inh-mitral-btn"
    inhMitralBtn.addEventListener("click", showWeights)

    // Exc Mitral Button
    let excMitralBtn = cf('button')
    excMitralBtn.classList.add("btn", "btn-secondary", "cell-btn")
    excMitralBtn.innerHTML = "Excit. weights"
    excMitralBtn.id = "exc-mitral-btn"
    excMitralBtn.addEventListener("click", showWeights)

    // Clear Weights Mitral Button
    let clrMitralBtn = cf('button')
    clrMitralBtn.classList.add("btn", "btn-secondary", "cell-btn")
    clrMitralBtn.innerHTML = "Clear weights"
    clrMitralBtn.id = "clr-mitral-btn"
    clrMitralBtn.addEventListener("click", showWeights)


    // Select All Tufted Button
    let selTuftedBtn = cf('button')
    selTuftedBtn.classList.add("btn", "btn-secondary", "cell-btn", "sel-des")
    selTuftedBtn.innerHTML = "Select All"
    selTuftedBtn.id = "sel-tufted-btn"
    selTuftedBtn.addEventListener("click", selectDeselectAll)

    // Deselect All Tufted Button
    let desTuftedBtn = cf('button')
    desTuftedBtn.classList.add("btn", "btn-secondary", "cell-btn", "sel-des")
    desTuftedBtn.innerHTML = "Deselect All"
    desTuftedBtn.id = "des-tufted-btn"
    desTuftedBtn.addEventListener("click", selectDeselectAll)


    // Add Tufted Button
    let addTuftedBtn = cf('button')
    addTuftedBtn.classList.add("btn", "btn-secondary", "cell-btn")
    addTuftedBtn.innerHTML = "Add Cell(s)"
    addTuftedBtn.id = "add-tufted-btn"
    addTuftedBtn.addEventListener("click", plotCell)

    // Remove Tufted Button
    let removeTuftedBtn = cf('button')
    removeTuftedBtn.classList.add("btn", "btn-secondary", "cell-btn")
    removeTuftedBtn.innerHTML = "Remove Cell(s)"
    removeTuftedBtn.id = "remove-tufted-btn"
    removeTuftedBtn.addEventListener("click", removeCell)

    // Inh Tufted Button
    let inhTuftedBtn = cf('button')
    inhTuftedBtn.classList.add("btn", "btn-secondary", "cell-btn")
    inhTuftedBtn.innerHTML = "Inhib. weights"
    inhTuftedBtn.id = "inh-tufted-btn"
    inhTuftedBtn.addEventListener("click", showWeights)

    // Exc Tufted Button
    let excTuftedBtn = cf('button')
    excTuftedBtn.classList.add("btn", "btn-secondary", "cell-btn")
    excTuftedBtn.innerHTML = "Excit. weights"
    excTuftedBtn.id = "exc-tufted-btn"
    excTuftedBtn.addEventListener("click", showWeights)

    // Clear Weights Tufted Button
    let clrTuftedBtn = cf('button')
    clrTuftedBtn.classList.add("btn", "btn-secondary", "cell-btn")
    clrTuftedBtn.innerHTML = "Clear weights"
    clrTuftedBtn.id = "clr-mitral-btn"
    clrTuftedBtn.addEventListener("click", showWeights)

    //
    let cleanMCBtn = cf('button')
    cleanMCBtn.classList.add("btn", "btn-secondary", "cell-btn")
    cleanMCBtn.innerHTML = "Remove All Mitral Cells"
    cleanMCBtn.id = "clean-mc-btn"
    cleanMCBtn.addEventListener("click", cleanCanvas)

    //
    let cleanTMCBtn = cf('button')
    cleanTMCBtn.classList.add("btn", "btn-secondary", "cell-btn")
    cleanTMCBtn.innerHTML = "Remove All Tufted Cells"
    cleanTMCBtn.id = "clean-tmc-btn"
    cleanTMCBtn.addEventListener("click", cleanCanvas)

    //
    let cleanGrCBtn = cf('button')
    cleanGrCBtn.classList.add("btn", "btn-secondary", "cell-btn")
    cleanGrCBtn.innerHTML = "Remove All Granule Cells"
    cleanGrCBtn.id = "clean-grc-btn"
    cleanGrCBtn.addEventListener("click", cleanCanvas)

    boxButtons.appendChild(cleanMCBtn)
    boxButtons.appendChild(cleanTMCBtn)
    //boxButtons.appendChild(cleanGrCBtn)

    // Insert list of Glomeruli
    glomListBox.appendChild(glomBox)

    // Append buttons in mitral box
    mitrListBox.appendChild(mitrBox)

    mitrListBox.appendChild(addMitralBtn)
    mitrListBox.appendChild(removeMitralBtn)
    mitrListBox.appendChild(inhMitralBtn)
    mitrListBox.appendChild(excMitralBtn)
    //mitrListBox.appendChild(clrMitralBtn)
    mitrListBox.appendChild(selMitralBtn)
    mitrListBox.appendChild(desMitralBtn)

    // Append buttons in tufted box
    tuftListBox.appendChild(tuftBox)
    tuftListBox.appendChild(addTuftedBtn)
    tuftListBox.appendChild(removeTuftedBtn)
    tuftListBox.appendChild(inhTuftedBtn)
    tuftListBox.appendChild(excTuftedBtn)
    //tuftListBox.appendChild(clrTuftedBtn)
    tuftListBox.appendChild(selTuftedBtn)
    tuftListBox.appendChild(desTuftedBtn)


    listGroupsBox.appendChild(glomListBox)
    listGroupsBox.appendChild(mitrListBox)
    listGroupsBox.appendChild(tuftListBox)

    ge("explorer-body").appendChild(listGroupsBox)
    ge("explorer-body").appendChild(boxButtons)
}


// Create the DOM elements
function buildDOM() {

    let page = cf('div')
    page.classList.add('container-fluid', 'page-container')
    page.id = "page"

    /*  Top banner  */
    let banner = cf('div')
    banner.classList.add('banner', 'row')
    banner.id = "banner"

    let bannerLogo = cf('div')
    bannerLogo.classList.add('col',)

    let bannerLogoLink = cf('a')
    bannerLogoLink.setAttribute('href', 'https://ebrains.eu/')
    bannerLogoLink.setAttribute('target', '_blank')

    let bannerLogoImg = new Image()
    bannerLogoImg.src = EBRAINS_logo
    bannerLogoImg.height = 34;

    bannerLogoLink.appendChild(bannerLogoImg)
    bannerLogo.appendChild(bannerLogoLink)

    let b_title = cf('div')
    b_title.classList.add('col-6', 'banner-element', 'title')

    let b_links = cf('div')
    b_links.classList.add('col', 'banner-element')

    // visualizer container
    let visualizer = cf('div')
    visualizer.classList.add('row')

    let v_params = cf('div')
    v_params.classList.add('col', 'params')
    v_params.id = "params"

    // accordion
    let v_accordion = cf('div')
    v_accordion.id = "action-accordion"
    v_accordion.classList.add('accordion')

    let explorerMainPanel = "explorer-body"
    let explorer_item = createAccordionItem("explorer-header", "explorer-collapse", "EXPLORER CONTROLS",
        "action-accordion", "", ["collapse", "show"], [], explorerMainPanel)

    let submitMainPanel = "submit-body"
    let submit_item = createAccordionItem("submit-header", "submit-collapse", "RUN SIMULATION",
        "action-accordion", "", ["collapse"], ["collapsed"], submitMainPanel)

    let fetchMainPanel = "fetch-body"
    let fetch_item = createAccordionItem("fetch-header", "fetch-collapse", "FETCH RESULTS",
        "action-accordion", "", ["collapse"], ["collapsed"], fetchMainPanel)

    // append items to accordion
    v_accordion.appendChild(explorer_item)
    v_accordion.appendChild(submit_item)
    v_accordion.appendChild(fetch_item)

    //
    let v_canvas_div = cf('div')
    v_canvas_div.classList.add('col-9', "canvas-container")

    let v_canvas = cf('canvas')
    v_canvas.id = "v_canvas"
    v_canvas.classList.add('webgl')

    v_canvas_div.appendChild(v_canvas)

    banner.appendChild(bannerLogo)
    banner.appendChild(b_title)
    banner.appendChild(b_links)

    v_params.appendChild(v_accordion)
    visualizer.appendChild(v_params)

    visualizer.appendChild(v_canvas_div)

    page.appendChild(banner)
    page.appendChild(visualizer)

    b_title.innerHTML = "OLFACTORY BULB EXPLORER"
    b_links.innerHTML = "links"

    document.body.appendChild(page)

    // Populate collapsible panels
    createCellSelectionBox()
    populateSubmitPanel()
    populateFetchPanel()


    return;
}

function checkSimStatus() {

}

function fetchSim() {

}

function populateFetchPanel() {
    // job list title
    let jobListTitle = cf("h5")
    jobListTitle.innerHTML = "JOB LIST"
    jobListTitle.classList.add("list-title")

    // create group item for job listing
    let jobList = cf("div")
    jobList.classList.add("list-group")
    // create dummy element
    let el = cf('a')
    el.classList.add("list-group-item", "list-group-item-action", "list-group-item-light", "job-box-el")
    el.setAttribute("href", "#")
    el.innerHTML = "--"
    jobList.appendChild(el)

    // check simulations button
    let checkSimBtn = cf("button")
    checkSimBtn.id = "check-sim-btn"
    checkSimBtn.innerHTML = "CHECK SIMULATION STATUS"
    checkSimBtn.classList.add("run-hpc-btn")
    checkSimBtn.addEventListener("click", checkSimStatus)

    // fetch simulation button
    let fetchSimBtn = cf("button")
    fetchSimBtn.id = "check-sim-btn"
    fetchSimBtn.innerHTML = "FETCH SIMULATION"
    fetchSimBtn.classList.add("run-hpc-btn")
    fetchSimBtn.addEventListener("click", fetchSim)

    // 
    ge("fetch-body").appendChild(jobListTitle)
    ge("fetch-body").appendChild(jobList)
    ge("fetch-body").appendChild(checkSimBtn)
    ge("fetch-body").appendChild(fetchSimBtn)



}

// Insert DOM elements in the RUN SIMULATION panel
function populateSubmitPanel() {

    // Sniffing interval input
    let sniffDiv = cf("div")
    sniffDiv.id = "sniff-div"
    sniffDiv.classList.add("input-group", "mb-3")

    let sniffSpanDiv = cf("div")
    sniffSpanDiv.classList.add("input-group-prepend")
    sniffSpanDiv.id = "sniff-span-div"

    let sniffSpan = cf("span")
    sniffSpan.classList.add("input-group-text", "span-param")
    sniffSpan.id = "sniff-span"
    sniffSpan.innerHTML = "Set Sniffing Interval (ms)"

    let sniffInput = cf("input")
    sniffInput.id = "sniff-input"
    sniffInput.setAttribute("type", "text")
    sniffInput.setAttribute("aria-label", "Default")
    sniffInput.setAttribute("aria-describedby", "sniff-span")
    sniffInput.classList.add("form-control", "input-param")

    sniffSpanDiv.appendChild(sniffSpan)
    sniffDiv.appendChild(sniffSpanDiv)
    sniffDiv.appendChild(sniffInput)

    // Simulation duration input
    let durDiv = cf("div")
    durDiv.id = "dur-div"
    durDiv.classList.add("input-group", "mb-3")

    let durSpanDiv = cf("div")
    durSpanDiv.classList.add("input-group-prepend")
    durSpanDiv.id = "dur-span-div"

    let durSpan = cf("span")
    durSpan.classList.add("input-group-text", "span-param")
    durSpan.id = "dur-span"
    durSpan.innerHTML = "Set Simulation time  (ms)"

    let durInput = cf("input")
    durInput.id = "dur-input"
    durInput.setAttribute("type", "text")
    durInput.setAttribute("aria-label", "Default")
    durInput.setAttribute("aria-describedby", "dur-span")
    durInput.classList.add("form-control", "input-param")

    durSpanDiv.appendChild(durSpan)
    durDiv.appendChild(durSpanDiv)
    durDiv.appendChild(durInput)


    // Run simulatioin button
    let runSimBtn = cf("button")
    runSimBtn.id = "run-sim-btn"
    runSimBtn.innerHTML = "RUN"
    runSimBtn.classList.add("run-hpc-btn")
    runSimBtn.addEventListener("click", runSimulation)


    // Odors div
    let odorsList = ["Apple", "Banana", "Basil", "Black_Pepper", "Cheese", "Chocolate", "Cinnamon", "Cloves",
        "Coffee", "Garlic", "Ginger", "Lemongrass", "Kiwi", "Mint", "Onion", "Oregano", "Pear", "Pineapple", "Strawberry"]

    let odorsTitle = cf("h5")
    odorsTitle.innerHTML = "SELECT ODORS"
    odorsTitle.classList.add("list-title")

    let odorsContainer = cf("div")
    odorsContainer.classList.add("container", "odor-container")

    let odorsRow = cf("div")
    odorsRow.classList.add("row")

    for (let o of odorsList) {
        let odorCol = cf("div")
        odorCol.classList.add("col", "odor-col")

        let odorBtn = cf("button")
        odorBtn.id = o
        odorBtn.innerHTML = o
        odorBtn.classList.add("odor-btn")
        odorBtn.addEventListener("click", showGlomStrength)


        odorCol.appendChild(odorBtn)
        odorsRow.appendChild(odorCol)
    }

    // Insert title for the glomerulus selection panel
    let simGlomTitle = cf("h5")
    simGlomTitle.innerHTML = "SELECT GLOMERULI"
    simGlomTitle.classList.add("list-title")

    // Insert buttons for batch selections of glomeruli
    let selBtnContainer = cf("div")
    selBtnContainer.classList.add("row", "sel-glom-btn-row")

    let selAllGlomBtn = cf("button")
    selAllGlomBtn.id = "sel-all-gloms"
    selAllGlomBtn.classList.add("col")
    selAllGlomBtn.innerHTML = "Select All"
    selAllGlomBtn.addEventListener("click", selGloms)

    let desAllGlomBtn = cf("button")
    desAllGlomBtn.id = "des-all-gloms"
    desAllGlomBtn.classList.add("col")
    desAllGlomBtn.innerHTML = "Deselect All"
    desAllGlomBtn.addEventListener("click", selGloms)

    let invAllGlomBtn = cf("button")
    invAllGlomBtn.id = "inv-all-gloms"
    invAllGlomBtn.classList.add("col")
    invAllGlomBtn.innerHTML = "Invert Selection"
    invAllGlomBtn.addEventListener("click", selGloms)

    selBtnContainer.appendChild(selAllGlomBtn)
    selBtnContainer.appendChild(desAllGlomBtn)
    selBtnContainer.appendChild(invAllGlomBtn)


    let simGlomRow = cf("div")
    simGlomRow.classList.add("row")

    for (let glom of glomeruliLimits) {
        let glomCol = cf("div")
        glomCol.classList.add("col", "glom-col")

        let glomBtn = cf("button")
        glomBtn.id = "gsim_" + glom.toString()
        glomBtn.innerHTML = glom.toString()
        glomBtn.classList.add("glom-btn")
        glomBtn.addEventListener("mouseover", highlightElement)
        glomBtn.addEventListener("click", markGlom)
        glomBtn.addEventListener("mouseleave", restoreColor)

        glomCol.appendChild(glomBtn)
        simGlomRow.appendChild(glomCol)
    }

    // create color map

    let colorMapImg = cf("img")
    colorMapImg.classList.add("img-fluid", "colormap-img")
    colorMapImg.setAttribute("src", colorMap)

    odorsContainer.appendChild(odorsTitle)
    odorsContainer.appendChild(odorsRow)
    odorsContainer.appendChild(simGlomTitle)

    odorsContainer.appendChild(simGlomRow)
    odorsContainer.appendChild(colorMapImg)
    odorsContainer.appendChild(selBtnContainer)

    ge("submit-body").appendChild(odorsContainer)
    ge("submit-body").appendChild(sniffDiv)
    ge("submit-body").appendChild(durDiv)

    ge("submit-body").appendChild(runSimBtn)
}


// Resize the canvas on window resize
function resize() {
    // Update sizes
    var win_h = window.innerHeight;
    var win_w = window.innerWidth;

    let out_width = ge("params").clientWidth
    let out_height = ge("banner").clientHeight

    sizes.height = win_h - out_height - 7;
    sizes.width = win_w - out_width - 20;

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
}


// Create the collapsible items for the control menu
function createAccordionItem(header_id, collapse_id, button_content,
    accordion_id, item_content, content_classes, button_classes, body_id) {

    let item = cf('div')
    item.classList.add("accordion-item")

    let header = cf('div')
    header.classList.add("accordion-header")
    header.id = header_id

    let button = cf('button')
    button.classList.add("accordion-button")
    for (let i = 0; i < button_classes.length; i++) {
        button.classList.add(button_classes[i])
    }
    button.setAttribute("type", "button")
    button.setAttribute("data-bs-toggle", "collapse")
    button.setAttribute("data-bs-target", "#" + collapse_id)
    button.setAttribute("aria-expanded", "true")
    button.setAttribute("aria-controls", collapse_id)
    button.innerHTML = button_content

    let content = cf('div')
    content.id = collapse_id
    content.classList.add("accordion-collapse")
    for (let i = 0; i < content_classes.length; i++) {
        content.classList.add(content_classes[i])
    }
    content.setAttribute("aria-labelledby", header_id)
    content.setAttribute("data-bs-parent", "#" + accordion_id)

    let body = cf('div')
    body.classList.add("accordion-body")
    body.id = body_id
    body.innerHTML = item_content

    header.appendChild(body)
    header.appendChild(button)

    content.appendChild(body)

    item.appendChild(header)
    item.appendChild(content)

    return item
}

/*  
 * PLOTTING FUNCTIONS  
 */

// Plot the cylinders building up mitral and tufted cells
function createSticks(vertices, type, cell, seg) {
    let allMeshes = []
    const endPoints = []
    const len = vertices.length
    if (!Object.keys(plottedNet).includes(cell))
        plottedNet[cell] = {}

    for (let i = 0; i < len - 1; i += granularity) {
        let endIdx = Math.min(len - 1, i + granularity)
        endPoints.push({ a_o: vertices[i], b_o: vertices[endIdx] })
    }

    for (let j = 0; j < endPoints.length; j++) {

        const { a_o, b_o } = endPoints[j]

        // stick has length equal to distance between endpoints
        const type_colors = { "dend": 0xbb8fce, "apic": 0x339999, "tuft": 0xc6ecc6, "soma": 0x0000ff }
        const a = new THREE.Vector3(a_o[0], a_o[1], a_o[2]);
        const b = new THREE.Vector3(b_o[0], b_o[1], b_o[2]);
        const a_radius = a_o[3] * scale_factor
        const b_radius = b_o[3] * scale_factor

        const distance = a.distanceTo(b)
        const cylinder = new THREE.CylinderGeometry(a_radius, b_radius, distance, cylinderResolution, cylinderResolution)

        // stick endpoints define the axis of stick alignment
        const { x: ax, y: ay, z: az } = a
        const { x: bx, y: by, z: bz } = b
        const stickAxis = new THREE.Vector3(bx - ax, by - ay, bz - az).normalize()

        // Use quaternion to rotate cylinder from default to target orientation
        const quaternion = new THREE.Quaternion()
        const cylinderUpAxis = new THREE.Vector3(0, 1, 0)
        quaternion.setFromUnitVectors(cylinderUpAxis, stickAxis)
        cylinder.applyQuaternion(quaternion)

        // Translate oriented stick to location between endpoints
        cylinder.translate((bx + ax) / 2, (by + ay) / 2, (bz + az) / 2)

        const material = new THREE.MeshStandardMaterial({ depthWrite: false, color: type_colors[type] });
        const mesh = new THREE.Mesh(cylinder, material);


        if (!Object.keys(plottedNet[cell]).includes(type)) {
            plottedNet[cell][type] = {}
        }

        if (!Object.keys(plottedNet[cell][type]).includes(seg)) {
            plottedNet[cell][type][seg] = []
        }

        plottedNet[cell][type][seg].push(j.toString())
        mesh.name = cell + "_" + type + "_" + seg + "_" + j.toString()
        allMeshes.push(mesh)
    }
    return allMeshes
}

// plot glomeruli
function plotGlomeruli(data, simGloms) {
    var glom_list = []

    for (let sg of simGloms) {
        glom_list.push(sg)
    }

    for (let i of glomeruliLimits) {
        if (simGloms.includes(i.toString())) {
            currentGlomColor = glom_base_color
        } else {
            currentGlomColor = glom_inactive_color
            glom_list.push(i.toString())
        }
        var geometry = glom_base_geometry; // (radius, widthSegments, heightSegments)
        var material = new THREE.MeshStandardMaterial({ depthWrite: false, transparent: false, opacity: 1.0, wireframe: false, color: currentGlomColor })
        var sphere = new THREE.Mesh(geometry, material)
        sphere.name = "glom_" + i.toString();
        sphere.position.set(data[i][0], data[i][1], data[i][2]);
        scene.add(sphere);
        plottedNet[sphere.name] = [sphere.uuid]
    }
    renderer.render(scene, camera);

    return glom_list
}




// Add cell to canvas
function addCell(data, cell) {
    let allCellMeshes = []
    let keys = Object.keys(data["secs"])

    for (let k of keys) {
        let points_array = data["secs"][k]["geom"]["pt3d"]
        let lidx = k.lastIndexOf("_")
        let seg = k.slice(lidx + 1)
        allCellMeshes.push(createSticks(points_array, k.slice(0, 4), cell, seg))
    }

    for (let m of allCellMeshes) {
        for (let n of m) {
            scene.add(n)
        }
    }
    plotGranuleCell(cell)
    renderer.render(scene, camera);
}

function selectDeselectAll() {
    if (this.id == "sel-mitral-btn") {
        let allEls = gecn("mitr-box-el")
        for (let elIdx = 0; elIdx < allEls.length; elIdx++) {
            if (allEls[elIdx].innerText == "--") {
                allEls[elIdx].classList.remove("active");
            } else {
                allEls[elIdx].classList.add("active");
            }
        }
    } else if (this.id == "des-mitral-btn") {
        let allEls = gecn("mitr-box-el")
        for (let elIdx = 0; elIdx < allEls.length; elIdx++) {
            allEls[elIdx].classList.remove("active");
        }
    } else if (this.id == "sel-tufted-btn") {
        let allEls = gecn("tuft-box-el")
        for (let elIdx = 0; elIdx < allEls.length; elIdx++) {
            if (allEls[elIdx].innerText == "--") {
                allEls[elIdx].classList.remove("active");
            } else {
                allEls[elIdx].classList.add("active");
            }
        }

    } else if (this.id == "des-tufted-btn") {
        let allEls = gecn("tuft-box-el")
        for (let elIdx = 0; elIdx < allEls.length; elIdx++) {
            allEls[elIdx].classList.remove("active");
        }
    }
}

// create element function
function cf(type) {
    return document.createElement(type)
}

// select element function
function ge(id) {
    return document.getElementById(id)
}

// get element by class name
function gecn(classes) {
    return document.getElementsByClassName(classes)
}