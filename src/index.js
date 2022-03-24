import _ from 'lodash'
import './style.css'
import 'jquery'
import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css'
import { GUI } from 'dat.gui'

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

import EBRAINS_logo from "../static/img/ebrains_logo.svg"

const axios = require('axios');
const loadImage = require('load-img');

/*
 * SET BULB'S ELEMENT GRAPHICS PROPERTIES
 */

/* gids - info
 * 0 -> 634 mitral cells
 * 635 -> 1904 mtufted cells
 * 1905 -> 390516 granules
 * 390517 -> ... blanes
 *  -> ... glomeruli
 * 
*/

const scale_factor = 1
const granularity = 3
const cylinderResolution = 90
const sphereResolution = 90
const glom_base_radius = 30
const glom_selected_radius = 62

const glom_base_color = new THREE.Color(0xe74c3c)
const glom_hovered_color = new THREE.Color(0x9a7d0a)
const glom_selected_color = new THREE.Color(0xffff00)

const glom_base_geometry = new THREE.SphereGeometry(glom_base_radius, sphereResolution, sphereResolution);
const glom_hovered_geometry = new THREE.SphereGeometry(glom_selected_radius, sphereResolution, sphereResolution);
const glom_selected_geometry = new THREE.SphereGeometry(glom_base_radius, sphereResolution, sphereResolution);

const cameraPositions = [3840, 485, 1367]
const cameraFov = 70

const listeners = {
    "glom": { "click": selectGlom, "mouseover": highlightElement, "mouseleave": restoreColor },
    //"mitr": { "click": , "mouseover": , "mouseleave": },
    //"tmitr": { "click": , "mouseover": , "mouseleave": },

}
// Build the page DOM
window.onload = buildDOM();



/*
 * SET SCENE PARAMETERS 
 */
const scene = new THREE.Scene();
const pointLight = new THREE.PointLight(0xffffff, 1)
const pointLight2 = new THREE.PointLight(0xffffff, 1)
const pointLight3 = new THREE.PointLight(0xffffff, 1)
const pointLight4 = new THREE.PointLight(0xffffff, 1)
var sizes = { width: window.innerWidth, height: window.innerHeight }
const camera = new THREE.PerspectiveCamera(cameraFov, sizes.width / sizes.height, 0.001, 20000)
const canvas = document.querySelector('#v_canvas')
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true
})
var controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(cameraPositions[0], cameraPositions[1], cameraPositions[2])


/*
 * SET GLOBAL VARIABLES 
 */

var selected_glom = "glom--"
var selected_mitr = "mitr--"
var selected_tmitr = "mitr--"

var cell_dict = {
    "glom_0": {
        "mitr": ["0", "1", "2", "3", "4"],
        "tmitr": ["5", "6", "7", "8", "9"]
    }
}

var plottedNet = {}

var glom_list;
var plottedELements = {}

window.addEventListener('resize', resize);

createScene()
resize()
animate()
//createGUI()


axios.get('https://127.0.0.1:8000/ob/ob_dict')
    .then(res => {
        //data = res.data.glom_coord;
        glom_list = plotGlomeruli(res.data.glom_coord)        
        let glom_ids = []
        for (let i = 0; i < glom_list.length; i++) {
            glom_ids.push(i.toString())
        }
        populateCellDropdown("glom", glom_ids)
    })
    .catch(err => {
        console.log('Error: ', err.message);
    });




/*
 * *********
 * FUNCTIONS
 * *********
 */



function updateStoredCellId() {
    if ("mitr-box-class" in this.classes) {

    }
}

function getCellPosition() {
    let boxClass
    if (this.id == "add-mitral-btn") {
        boxClass = "mitr-box-el"
    } else {
        boxClass = "tmitr-box-el"
    }
    let cell = gecn(boxClass + " list-group-item active")[0].innerText
    axios.get('https://127.0.0.1:8000/ob/example_mitral/' + cell)
        .then(res => {
            plotCells(res, cell);
        })
        .catch(err => {
            console.log('Error: ', err.message);
        });
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

    if (name == selected_glom) {
        return
    } else if (name != "glom--") {
        let element = scene.getObjectByName(name)
        element.material.color = glom_hovered_color
        element.geometry = glom_hovered_geometry
    }
}

// reset color and geometry on mouse leave
function restoreColor() {
    let name = this.id
    if (name == selected_glom) {
        return
    } else if (name != "glom--") {
        let element = scene.getObjectByName(name)
        element.material.color = glom_base_color
        element.geometry = glom_base_geometry
    }
}

// handle glomeruli selection
function selectGlom() {
    let name = this.id
    if (name == selected_glom) {
        return
    } else if (name == "glom--") {
        let old = scene.getObjectByName(selected_glom)
        old.material.color = glom_base_color
        old.geometry = glom_base_geometry
        selected_glom = "glom--"
        populateCellDropdown("mitr", [])
        populateCellDropdown("tmitr", [])
    } else {
        // reset previously selected cell
        if (selected_glom != "glom--") {
            let old = scene.getObjectByName(selected_glom)
            old.material.color = glom_base_color
            old.geometry = glom_base_geometry
        }
        selected_glom = name
        let element = scene.getObjectByName(name)
        element.material.color = glom_selected_color
        element.geometry = glom_selected_geometry

        // to be replaced with querying HPC
        if (name == "glom_0") {
            let mitral = cell_dict["glom_0"]["mitr"]
            let tmitral = cell_dict["glom_0"]["tmitr"]
            populateCellDropdown("mitr", mitral)
            populateCellDropdown("tmitr", tmitral)
        } else {
            populateCellDropdown("mitr", [])
            populateCellDropdown("tmitr", [])
        }
    }
}


// Animate
function animate() {
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

function populateCellDropdown(elType, elementList) {

    // elType is: "glom", "mitr", "tmitr"

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

    // Tuft Mitral Cells box
    let tmitrBox = cf('div')
    tmitrBox.id = "tmitr-box"
    tmitrBox.classList.add("tmitr-box")

    let tmitrBoxTitle = cf('h5')
    tmitrBoxTitle.innerHTML = "TMitral Cells"
    tmitrBoxTitle.classList.add('group-title')
    tmitrBox.appendChild(tmitrBoxTitle)

    //
    let listGroupsBox = cf('div')
    listGroupsBox.classList.add('row')

    let glomListBox = cf('div')
    glomListBox.classList.add('col')

    let mitrListBox = cf('div')
    mitrListBox.classList.add('col')

    let tmitrListBox = cf('div')
    tmitrListBox.classList.add('col')

    let boxButtonsAdd = cf('div')
    boxButtonsAdd.classList.add('row', 'cell-box-btn')

    let boxButtonsRemove = cf('div')
    boxButtonsRemove.classList.add('row', 'cell-box-btn')

    let addMitralBtn = cf('button')
    addMitralBtn.classList.add("btn", "btn-secondary", "cell-btn", "col")
    addMitralBtn.innerHTML = "Add Mitral Cell"
    addMitralBtn.id = "add-mitral-btn"
    addMitralBtn.addEventListener("click", getCellPosition)

    let addTmitralBtn = cf('button')
    addTmitralBtn.classList.add("btn", "btn-secondary", "cell-btn", "col")
    addTmitralBtn.innerHTML = "Add Tufted Mitral Cell"
    addTmitralBtn.id = "add-tmitral-btn"
    addTmitralBtn.addEventListener("click", getCellPosition)


    let remove_mitral_btn = cf('button')
    remove_mitral_btn.classList.add("btn", "btn-secondary", "cell-btn", "col")
    remove_mitral_btn.innerHTML = "Remove Mitral Cell"

    let remove_tmitral_btn = cf('button')
    remove_tmitral_btn.classList.add("btn", "btn-secondary", "cell-btn", "col")
    remove_tmitral_btn.innerHTML = "Remove Tufted Mitral Cell"

    boxButtonsAdd.appendChild(addMitralBtn)
    boxButtonsAdd.appendChild(addTmitralBtn)
    boxButtonsRemove.appendChild(remove_mitral_btn)
    boxButtonsRemove.appendChild(remove_tmitral_btn)

    glomListBox.appendChild(glomBox)
    mitrListBox.appendChild(mitrBox)
    tmitrListBox.appendChild(tmitrBox)

    listGroupsBox.appendChild(glomListBox)
    listGroupsBox.appendChild(mitrListBox)
    listGroupsBox.appendChild(tmitrListBox)

    ge("explorer-body").appendChild(listGroupsBox)
    ge("explorer-body").appendChild(boxButtonsAdd)
    ge("explorer-body").appendChild(boxButtonsRemove)
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

    let out_width = document.getElementById("params").clientWidth
    let out_height = document.getElementById("banner").clientHeight

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

/*  
 * PLOTTING FUNCTIONS  
 */

function createSticks(vertices, type, cell) {
    let allMeshes = []
    const endPoints = []
    const len = vertices.length

    for (let i = 0; i < len - 1; i += granularity) {
        let endIdx = Math.min(len-1, i + granularity)
        endPoints.push({ a_o: vertices[i], b_o: vertices[endIdx] })
    }
    
    for (let j = 0; j < endPoints.length; j++) {

        const { a_o, b_o } = endPoints[j]

        // stick has length equal to distance between endpoints
        const type_colors = { "dend": 0xbb8fce , "apic": 0x339999, "tuft": 0xc6ecc6, "soma": 0x0000ff }
        const a = new THREE.Vector3(a_o[0], a_o[1], a_o[2]);
        const b = new THREE.Vector3(b_o[0], b_o[1], b_o[2]);
        const a_radius = a_o[3]  * scale_factor
        const b_radius = b_o[3]  * scale_factor

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
        mesh.name = "stick"

        allMeshes.push(mesh)
        
        
    }

    return allMeshes
}

// plot glomeruli
function plotGlomeruli(data) {
    var glom_list = []
    for (var i = 0; i < data.length; i++) {
        var geometry = glom_base_geometry; // (radius, widthSegments, heightSegments)
        var material = new THREE.MeshStandardMaterial({ depthWrite:false, transparent: false, opacity: 1.0, wireframe: false, color: glom_base_color })
        var sphere = new THREE.Mesh(geometry, material)
        sphere.name = "glom_" + i.toString();
        glom_list.push(i)
        sphere.position.set(data[i][0], data[i][1], data[i][2]);
        scene.add(sphere);

        plottedNet[sphere.name] = {
            "mitr_obj": {},
        }
        
    }
    renderer.render(scene, camera);
    return glom_list
}

function plotCells(data, cell) {
    let allCellMeshes = []
    let keys = Object.keys(data["data"]["secs"])
    console.log(data)
    for (let k of keys) {
        let points_array = data["data"]["secs"][k]["geom"]["pt3d"]
        allCellMeshes.push(createSticks(points_array, k.slice(0, 4), cell))
    }

    for (let m of allCellMeshes) {
        for (let n of m) {

            scene.add(n)
        }        
    }
    renderer.render(scene, camera);
}