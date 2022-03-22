import _ from 'lodash'
import './style.css'
import 'jquery'
import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css'
import { GUI } from 'dat.gui'

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { FlakesTexture } from 'three/examples/jsm/textures/FlakesTexture.js'
import { RGBMLoader } from 'three/examples/jsm/loaders/RGBMLoader.js'
import { Color, Sphere } from 'three'

/*
 * SET BULB'S ELEMENT GRAPHICS PROPERTIES
 */

const glom_base_color = new THREE.Color(0xe74c3c)
const glom_hovered_color = new THREE.Color(0x9a7d0a)
const glom_selected_color = new THREE.Color(0xffff00)

const glom_base_radius = 35
const glom_selected_radius = 68
const glom_base_geometry = new THREE.SphereGeometry(glom_base_radius, 15, 15);
const glom_hovered_geometry = new THREE.SphereGeometry(glom_selected_radius, 15, 15);
const glom_selected_geometry = new THREE.SphereGeometry(glom_selected_radius, 15, 15);

// Build the page DOM
buildDOM()

/*
 * SET SCENE PARAMETERS 
 */
const scene = new THREE.Scene();
const pointLight = new THREE.PointLight(0xffffff, 1)
const pointLight2 = new THREE.PointLight(0xffffff, 1)
var sizes = { width: 1000, height: 800 }
const camera = new THREE.PerspectiveCamera(20, sizes.width / sizes.height, 0.001, 200000)
const canvas = document.querySelector('#v_canvas')
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true
})
var controls = new OrbitControls(camera, renderer.domElement);



/*
 * SET GLOBAL VARIABLES 
 */
const axios = require('axios');
var selected_glom = "glom_no_selection";
var glom_0_mitr_list = ["0", "1", "2", "3", "4"]
var glom_0_tmitr_list = ["5", "6", "7", "8", "9"]

var glom_list;
var plottedELements = {}



window.addEventListener('resize', resize);

createScene()
resize();
animate()


axios.get('https://127.0.0.1:8000/ob/ob_dict')
    .then(res => {        
        //data = res.data.glom_coord;
        glom_list = plotGlomeruli(res.data.glom_coord);
        camera.position.set(6151, -9950, 3251);
    }).then(res2 => {
        createCellSelectionBox()
    }
    )
    .catch(err => {
        console.log('Error: ', err.message);
    });




/*
 * *********
 * FUNCTIONS
 * *********
 */

function getCellPosition() {
    console.log("inside")
    axios.get('https://127.0.0.1:8000/ob/example_mitral')
        .then(res => {
            plotCells(res);
        })
        .catch(err => {
            console.log('Error: ', err.message);
        });
}

function createScene() {
    // Lights
    pointLight.position.set(0, 0, 0)
    pointLight2.position.set(0, 0, 70000)
    scene.add(pointLight)
    scene.add(pointLight2)

   // Base camera
    scene.add(camera)

    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    controls.update()

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

function highlight_element() {
    let name = this.id
    if (name == selected_glom) {
        return
    } else if (name == "glom_no_selection" && selected_glom == "glom_no_selection") {
        return

    } else {
        let element = scene.getObjectByName(name)
        element.material.color = glom_hovered_color
        element.geometry = glom_hovered_geometry
    }
}

function restoreColor() {
    let name = this.id
    if (name == selected_glom) {
        return
    }
    let element = scene.getObjectByName(name)
    element.material.color = glom_base_color
    element.geometry = glom_base_geometry
}

function select_glom() {
    let name = this.id
    console.log(this.id)
    console.log(selected_glom)
    if (name == selected_glom) {
        return
    } else if (name == "glom_no_selection") {
        if (name == selected_glom) {
            return
        } else {
            let old = scene.getObjectByName(selected_glom)
            old.material.color = glom_base_color
            old.geometry = glom_base_geometry
            console.log(old)
        }
    } else {
        if (selected_glom != "glom_no_selection") {
            let old = scene.getObjectByName(selected_glom)
            old.material.color = glom_base_color
            old.geometry = glom_base_geometry
        }
            selected_glom = name
            let element = scene.getObjectByName(name)
            element.material.color = glom_selected_color
            element.geometry = glom_selected_geometry
        }
    }


// Animate
function animate() {
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

function create_cell_dropdown(el_id, box_title) {
    let container_div = cf('div')
    let list_title = cf('h5')
    list_title.innerHTML = box_title
    list_title.classList.add('group-title')

    container_div.appendChild(list_title)

    let cell_box_names = cf('div')
    cell_box_names.classList.add("list-group")
    cell_box_names.id = el_id

    var glom_a = cf('a')
    glom_a.classList.add("list-group-item", "list-group-item-action", el_id + "-class")
    glom_a.classList.add("active");
    glom_a.setAttribute("aria-current", "true");
    glom_a.setAttribute("href", "#")
    glom_a.setAttribute("data-bs-toggle", "list");
    glom_a.innerHTML = "--"
    glom_a.id = "glom_no_selection" 
    if (el_id == "glom") {
        glom_a.addEventListener("click", select_glom);
    }
    cell_box_names.appendChild(glom_a)


    for (let i = 0; i < glom_list.length; i++) {
        var glom_a = cf('a')        
        glom_a.classList.add("list-group-item", "list-group-item-action", el_id + "-class")        
        glom_a.setAttribute("href", "#")
        glom_a.setAttribute("data-bs-toggle", "list");
        glom_a.innerHTML = glom_list[i]
        if (el_id == "glom") {
            glom_a.addEventListener("mouseover", highlight_element);
            glom_a.addEventListener("mouseleave", restoreColor);
            glom_a.addEventListener("click", select_glom);
            glom_a.id = "glom_" + i.toString()
        }
        cell_box_names.appendChild(glom_a)
    }

    container_div.appendChild(cell_box_names)
    return container_div
    
}

//
function createCellSelectionBox() {
    let glom_names_a = create_cell_dropdown("glom", "Glomeruli (id)")
    let glom_names_b = create_cell_dropdown("mitr", "MitralCells (id)")
    let glom_names_c = create_cell_dropdown("tmitr", "TMitralCells (id)")

    let list_groups_box = cf('div')
    list_groups_box.classList.add('row')

    let glom_list_box = cf('div')
    glom_list_box.classList.add('col')

    let mitr_list_box = cf('div')
    mitr_list_box.classList.add('col')

    let tmitr_list_box = cf('div')
    tmitr_list_box.classList.add('col')

    let box_buttons_add = cf('div')
    box_buttons_add.classList.add('row', 'cell-box-btn')

    let box_buttons_remove = cf('div')
    box_buttons_remove.classList.add('row', 'cell-box-btn')

    let add_mitral_btn = cf('button')
    add_mitral_btn.classList.add("btn", "btn-secondary", "cell-btn", "col")
    add_mitral_btn.innerHTML = "Add Mitral Cell"
    add_mitral_btn.addEventListener("click", getCellPosition)

    let add_tmitral_btn = cf('button')
    add_tmitral_btn.classList.add("btn", "btn-secondary", "cell-btn", "col")
    add_tmitral_btn.innerHTML = "Add Tufted Mitral Cell"

    let remove_mitral_btn = cf('button')
    remove_mitral_btn.classList.add("btn", "btn-secondary", "cell-btn", "col")
    remove_mitral_btn.innerHTML = "Remove Mitral Cell"

    let remove_tmitral_btn = cf('button')
    remove_tmitral_btn.classList.add("btn", "btn-secondary", "cell-btn", "col")
    remove_tmitral_btn.innerHTML = "Remove Tufted Mitral Cell"

    box_buttons_add.appendChild(add_mitral_btn)
    box_buttons_add.appendChild(add_tmitral_btn)
    box_buttons_remove.appendChild(remove_mitral_btn)
    box_buttons_remove.appendChild(remove_tmitral_btn)


    glom_list_box.appendChild(glom_names_a)
    mitr_list_box.appendChild(glom_names_b)
    tmitr_list_box.appendChild(glom_names_c)

    list_groups_box.appendChild(glom_list_box)
    list_groups_box.appendChild(mitr_list_box)
    list_groups_box.appendChild(tmitr_list_box)

    ge("explorer-body").appendChild(list_groups_box)
    ge("explorer-body").appendChild(box_buttons_add)
    ge("explorer-body").appendChild(box_buttons_remove)
}



function buildDOM() {

    let page = cf('div')
    page.classList.add('container-fluid', 'page-container')
    page.id = "page"

    /*  Top banner  */
    let banner = cf('div')
    banner.classList.add('banner', 'row', 'd-flex', 'aligns-items-center', 'justify-content-center')
    banner.id = "banner"

    let b_logo = cf('div')
    b_logo.classList.add('col')

    let b_title = cf('div')
    b_title.classList.add('col-6', 'banner-title', 'flex-center')

    let b_links = cf('div')
    b_links.classList.add('col')

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

    banner.appendChild(b_logo)
    banner.appendChild(b_title)
    banner.appendChild(b_links)

    v_params.appendChild(v_accordion)
    visualizer.appendChild(v_params)

    visualizer.appendChild(v_canvas_div)

    page.appendChild(banner)
    page.appendChild(visualizer)

    b_title.innerHTML = "The Olfactory Bulb Explorer"
    b_logo.innerHTML = "EBRAINS logo"
    b_links.innerHTML = "links"

    document.body.appendChild(page)

    return ;
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


/*  
 * PLOTTING FUNCTIONS  
 */

function createSticks(vertices, type) {

    const endPoints = []
    for (let i = 0; i < vertices.length - 1; i++) {
        endPoints.push({ a_o: vertices[i], b_o: vertices[i + 1] })
    }

    for (let j = 0; j < endPoints.length; j++) {

        const { a_o, b_o } = endPoints[j]

        // stick has length equal to distance between endpoints
        const type_colors = { "dend": 0x339933, "apic": 0x339999, "tuft": 0xc6ecc6, "soma": 0x0000ff }
        const a = new THREE.Vector3(a_o[0], a_o[1], a_o[2]);
        const b = new THREE.Vector3(b_o[0], b_o[1], b_o[2]);
        const a_radius = a_o[3]
        const b_radius = b_o[3]

        const distance = a.distanceTo(b)
        const cylinder = new THREE.CylinderGeometry(a_radius, b_radius, distance, 70, 70)

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

        const material = new THREE.MeshBasicMaterial({ color: type_colors[type] });
        const mesh = new THREE.Mesh(cylinder, material);
        mesh.name = "stick"

        scene.add(mesh);
        renderer.render(scene, camera);
    }

    //return mesh;
}

// plot glomeruli
function plotGlomeruli(data) {
    var glom_list = []
    for (var i = 0; i < data.length; i++) {
        var geometry = glom_base_geometry; // (radius, widthSegments, heightSegments)
        var material = new THREE.MeshStandardMaterial({ opacity: 1.0, wireframe: false, color: glom_base_color })
        var sphere = new THREE.Mesh(geometry, material)
        sphere.name = "glom_" + i.toString();
        glom_list.push(i)
        sphere.position.set(data[i][0], data[i][1], data[i][2]);
        scene.add(sphere);
        renderer.render(scene, camera);
    }
    return glom_list

}

function plotCells(data) {
    let keys = Object.keys(data["data"]["secs"])

    for (var i = 0; i < keys.length; i++) {
        let points_array = data["data"]["secs"][keys[i]]["geom"]["pt3d"]
        createSticks(points_array, keys[i].slice(0, 4))
    }
}