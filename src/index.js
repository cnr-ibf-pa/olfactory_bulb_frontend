import _ from 'lodash'
import './style.css'
//import './auth.js'
import 'jquery'
import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css'
import { GUI } from 'dat.gui'
import colorGradient from "javascript-color-gradient"

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

import EBRAINS_logo from "../static/img/ebrains_logo.svg"
import { Scene } from 'three'

const axios = require('axios');
const loadImage = require('load-img');

/*
 * SET BULB'S ELEMENT GRAPHICS PROPERTIES
 */

/* gids - info
mitral: [0-634]
medial tufted: [635-1904]
granule: [1905-390516]
blanes: [390517-390898]
*/
const glomeruliLimits = _.range(0, 126)
const mcLimits = _.range(0, 634)
const tmcLimits = _.range(635, 1904)
const granulesLimits = _.range(1905, 390516)
const blanesLimits = _.range(390517, 390898)

const numMitrPerGlom = 5
const numTMitrPerGlom = 10
const numMitral = 635

const scale_factor = 1
const granularity = 2

const cylinderResolution = 20

const glom_resolution = 60
const glom_base_radius = 35
const glom_selected_radius = 62

const glom_base_color = new THREE.Color(0xe74c3c)
const glom_inactive_color = new THREE.Color(0x8a8a8a)

const glom_hovered_color = new THREE.Color(0x9a7d0a)
const glom_hovered_inactive_color = new THREE.Color(0x3d1656)

const glom_selected_color = new THREE.Color(0xffff00)

const glom_base_geometry = new THREE.SphereGeometry(glom_base_radius, glom_resolution, glom_resolution);
const glom_hovered_geometry = new THREE.SphereGeometry(glom_selected_radius, glom_resolution, glom_resolution);
const glom_selected_geometry = new THREE.SphereGeometry(glom_base_radius, glom_resolution, glom_resolution);

const granule_radius = 6
const granule_resolution = 6
const granule_hovered_radius = 6
const granule_selected_radius = 4

const granule_base_color = new THREE.Color(0x12b9b5)
const granule_hovered_color = new THREE.Color(0x85c4ee)
const granule_selected_color = new THREE.Color(0x3b99d7)

const granule_base_geometry = new THREE.SphereGeometry(granule_radius, granule_resolution, granule_resolution);
const granule_hovered_geometry = new THREE.SphereGeometry(granule_hovered_radius, granule_resolution, granule_resolution);
const granule_selected_geometry = new THREE.SphereGeometry(granule_selected_radius, granule_resolution, granule_resolution);

const cameraPositions = [8855, -7873, 7045]
const cameraFov = 20

let currentGlomColor

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

const numColors = 200
const maxColorIdx = 100

const colorGradientArray = colorGradient
    .setGradient("#023f48", "#ccfdcc")
    .setMidpoint(numColors)
    .getArray();

let threeColorArray = {}
for (let i = 1; i < maxColorIdx + 1; i += 0.5) {
    let str = (Math.floor(i * 1000) / 1000).toString()
    threeColorArray[str] = new THREE.Color(colorGradientArray[i * 2 - 1])
}


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
let simulatedConnections
let allGranulePositions // dictionary of all granule cell positions
let allMTCellsPositions

window.addEventListener('resize', resize);

createScene()
resize()
animate()
getSimulationData()


// getSimulatedCellIds()
createGUI()


function getSimulationData() {
    axios.get('https://127.0.0.1:8000/ob/ob_dict')
        .then(glomDict => {
            allGlomCoord = glomDict.data.glom_coord
            axios.get('https://127.0.0.1:8000/ob/simulated_gloms')
                .then(simGloms => {
                    let simulatedGlomsNum = simGloms.data.sim_gloms
                    for (let sg of simulatedGlomsNum) {
                        simulatedGloms.push(sg.toString())
                    }
                    axios.get('https://127.0.0.1:8000/ob/simulated_cell_ids')
                        .then(cellIds => {
                            let simulatedCellIdsNum = cellIds["data"]["cell_ids"];
                            for (let c of simulatedCellIdsNum) {
                                simulatedCellIds.push(c.toString())
                            }
                            axios.get('https://127.0.0.1:8000/ob/connections')
                                .then(connections => {
                                    simulatedConnections = connections.data
                                    axios.get('https://127.0.0.1:8000/ob/all_granules_pos')
                                        .then(granules => {
                                            allGranulePositions = granules.data
                                            axios.get('https://127.0.0.1:8000/ob/all_mt_pos')
                                                .then(allMTCellsPos => {
                                                    allMTCellsPositions = allMTCellsPos
                                                    initializeSceneContent()
                                                })
                                        })
                                })
                        })
                })
        })
}



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

function cleanCanvas() {
    for (let k in plottedNet) {
        if (k.slice(0, 3) != "glom") {
            if ((this.id == "clean-mc-btn" && mcLimits.includes(parseInt(k))) ||
                (this.id == "clean-tmc-btn" && tmcLimits.includes(parseInt(k)))) {
                for (let el of plottedNet[k]) {
                    scene.remove(scene.getObjectByName(el))
                }
                delete plottedNet[k]
            }
        }
    }
}


function showWeights() {

}


function plotCell() {
    let boxClass
    if (this.id == "add-mitral-btn") {
        boxClass = "mitr-box-el"
    } else {
        boxClass = "tuft-box-el"
    }
    let cell = gecn(boxClass + " list-group-item active")[0].innerText
    if (Object.keys(plottedNet).includes(cell))
        return
    addCell(allMTCellsPositions["data"][cell], cell);
}

function plotGranuleCell(cell) {
    for (let k of Object.keys(simulatedConnections[cell])) {
        for (let ik of Object.keys(simulatedConnections[cell][k])) {
            var geometry = granule_base_geometry; // (radius, widthSegments, heightSegments)
            var material = new THREE.MeshStandardMaterial({
                depthWrite: false, transparent: false,
                opacity: 1.0, wireframe: false,                
                color: threeColorArray[simulatedConnections[cell][k][ik][0].toString()]
            })
            var sphere = new THREE.Mesh(geometry, material)
            sphere.position.set(allGranulePositions[ik][0], allGranulePositions[ik][1], allGranulePositions[ik][2]);
            sphere.name = ik
            plottedNet[cell].push(sphere.name)
            scene.add(sphere);            
        }
    }
    renderer.render(scene, camera);
}

// remove cell from canvas
function removeCell() {
    let boxClass
    if (this.id == "remove-mitral-btn") {
        boxClass = "mitr-box-el"
    } else {
        boxClass = "tuft-box-el"
    }
    let cell = gecn(boxClass + " list-group-item active")[0].innerText

    for (let el of plottedNet[cell])
        scene.remove(scene.getObjectByName(el))
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
    let name = this.id

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

// reset color and geometry on mouse leave
function restoreColor() {
    let name = this.id
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

        // Add Mitral Button
    let addMitralBtn = cf('button')
    addMitralBtn.classList.add("btn", "btn-secondary", "cell-btn")
    addMitralBtn.innerHTML = "Add Cell"
    addMitralBtn.id = "add-mitral-btn"
    addMitralBtn.addEventListener("click", plotCell)

    // Remove Mitral Button
    let removeMitralBtn = cf('button')
    removeMitralBtn.classList.add("btn", "btn-secondary", "cell-btn")
    removeMitralBtn.innerHTML = "Remove Cell"
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



    // Add Tufted Button
    let addTuftedBtn = cf('button')
    addTuftedBtn.classList.add("btn", "btn-secondary", "cell-btn", "col")
    addTuftedBtn.innerHTML = "Add Cell"
    addTuftedBtn.id = "add-tufted-btn"
    addTuftedBtn.addEventListener("click", plotCell)
    

    // Remove Tufted Button
    let removeTuftedBtn = cf('button')
    removeTuftedBtn.classList.add("btn", "btn-secondary", "cell-btn")
    removeTuftedBtn.innerHTML = "Remove Cell"
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


    let cleanMCBtn = cf('button')
    cleanMCBtn.classList.add("btn", "btn-secondary", "cell-btn", "col")
    cleanMCBtn.innerHTML = "Remove All Mitral Cells"
    cleanMCBtn.id = "clean-mc-btn"
    cleanMCBtn.addEventListener("click", cleanCanvas)

    let cleanTMCBtn = cf('button')
    cleanTMCBtn.classList.add("btn", "btn-secondary", "cell-btn", "col")
    cleanTMCBtn.innerHTML = "Remove All Tufted Cells"
    cleanTMCBtn.id = "clean-tmc-btn"
    cleanTMCBtn.addEventListener("click", cleanCanvas)

    let cleanGrCBtn = cf('button')
    cleanGrCBtn.classList.add("btn", "btn-secondary", "cell-btn", "col")
    cleanGrCBtn.innerHTML = "Remove All Granule Cells"
    cleanGrCBtn.id = "clean-grc-btn"
    cleanGrCBtn.addEventListener("click", cleanCanvas)

    boxButtons.appendChild(cleanMCBtn)
    boxButtons.appendChild(cleanTMCBtn)
    //boxButtons.appendChild(cleanGrCBtn)
    

    glomListBox.appendChild(glomBox)


    mitrListBox.appendChild(mitrBox)
    mitrListBox.appendChild(addMitralBtn)
    mitrListBox.appendChild(removeMitralBtn)
    mitrListBox.appendChild(inhMitralBtn)
    mitrListBox.appendChild(excMitralBtn)
    mitrListBox.appendChild(clrMitralBtn)

        
    

    
    tuftListBox.appendChild(tuftBox)
    tuftListBox.appendChild(addTuftedBtn)
    tuftListBox.appendChild(removeTuftedBtn)
    tuftListBox.appendChild(inhTuftedBtn)
    tuftListBox.appendChild(excTuftedBtn)
    tuftListBox.appendChild(clrTuftedBtn)

    listGroupsBox.appendChild(glomListBox)
    listGroupsBox.appendChild(mitrListBox)
    listGroupsBox.appendChild(tuftListBox)

    ge("explorer-body").appendChild(listGroupsBox)
    ge("explorer-body").appendChild(boxButtons)

}



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

    let explorer_item = createAccordionItem("explorer-header", "explorer-collapse", "Explorer Controls",
        "action-accordion", "", ["collapse", "show"], [], "explorer-body")

    let submit_item = createAccordionItem("submit-header", "submit-collapse", "Submit Simulation",
        "action-accordion", "Content", ["collapse"], ["collapsed"], "submit-body")

    let fetch_item = createAccordionItem("fetch-header", "fetch-collapse", "Fetch Simulation Results",
        "action-accordion", "Fetch Simulation Results", ["collapse"], ["collapsed"], "fetch-body")

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

    createCellSelectionBox()

    return;
}


function resize() {
    // Update sizes
    var win_h = window.innerHeight;
    var win_w = window.innerWidth;

    let out_width = ge("params").clientWidth
    let out_height = ge("banner").clientHeight

    sizes.height = win_h - out_height;
    sizes.width = win_w - out_width;

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
}


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

function createSticks(vertices, type, cell, full_type) {
    let allMeshes = []
    const endPoints = []
    const len = vertices.length
    if (!Object.keys(plottedNet).includes(cell))
        plottedNet[cell] = []

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
        mesh.name = full_type + "___" + j.toString()
        plottedNet[cell].push(mesh.name)
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


// 
function addCell(data, cell) {
    let allCellMeshes = []
    let keys = Object.keys(data["secs"])

    for (let k of keys) {
        let points_array = data["secs"][k]["geom"]["pt3d"]
        allCellMeshes.push(createSticks(points_array, k.slice(0, 4), cell, k))
    }

    for (let m of allCellMeshes) {
        for (let n of m) {
            scene.add(n)
        }
    }
    plotGranuleCell(cell)
    renderer.render(scene, camera);
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