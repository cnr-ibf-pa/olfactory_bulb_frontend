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

// Build the page DOM
build_DOM();

// Create scene
const scene = new THREE.Scene();

// Canvas
const canvas = document.querySelector('#v_canvas')

// Lights
const pointLight = new THREE.PointLight("#d68f0b", 1)
pointLight.position.set(0, 0, 0)
scene.add(pointLight)

const pointLight2 = new THREE.PointLight("#d68f0b", 1)
pointLight2.position.set(0, 0, 20000)
scene.add(pointLight2)

// sizes
var sizes = {
    width: window.innerWidth,
    height: window.innerHeigth
}

// Base camera
const camera = new THREE.PerspectiveCamera(20, sizes.width / sizes.height, 0.001, 200000)

scene.add(camera)

// Renderer
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true
})

renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
var controls = new OrbitControls(camera, renderer.domElement);
controls.update()

renderer.render(scene, camera);




// Animate
function animate() {
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

resize();
animate()

const axios = require('axios');
axios.get('https://127.0.0.1:8000/ob/ob_dict')
    .then(res => {        
        //data = res.data.glom_coord;
        plot_glomeruli(res.data.glom_coord);
        camera.position.set(6151, -9950, 3251);

    })
    .catch(err => {
        console.log('Error: ', err.message);
    });

axios.get('https://127.0.0.1:8000/ob/example_mitral')
    .then(res => {
        plot_single_mitral(res);
    })
    .catch(err => {
        console.log('Error: ', err.message);
    });

function plot_glomeruli(data) {
    for (var i = 0; i < data.length; i++) {
        var geometry1 = new THREE.SphereGeometry(30, 20, 20); // (radius, widthSegments, heightSegments)
        var material1 = new THREE.MeshStandardMaterial({ opacity: 1.0, wireframe:false })
        var sphere1 = new THREE.Mesh(geometry1, material1)
        sphere1.position.set(data[i][0], data[i][1], data[i][2]);
        scene.add(sphere1);
        renderer.render(scene, camera);
    }
}

function plot_single_mitral(data) {
    let keys = Object.keys(data["data"]["secs"])
    for (var i = 0; i < keys.length; i++) {

        if (keys[i].slice(0, 4) == "dend" | keys[i].slice(0, 4) == "apic") {
            let points_array = data["data"]["secs"][keys[i]]["geom"]["pt3d"]
            createSticks(points_array)
            /*for (let j = 0; j < points_array.length; j++) {
                let point = points_array[j]
                const geometry = new THREE.CylinderGeometry(5, 5, 20, 32,30, false, );
                const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
                const cylinder = new THREE.Mesh(geometry, material);
                scene.add(cylinder);
                cylinder.position.set(point[0], point[1], point[2]);
                
                scene.add(createSticks(points_array));
        renderer.render(scene, camera);
        }
        */
        
        }
    }
}

function build_DOM() {

    let page = document.createElement('div')
    page.classList.add('container-fluid', 'page-container')

    // top banner
    let banner = document.createElement('div')
    banner.classList.add('banner', 'row')

    let b_logo = document.createElement('div')
    b_logo.classList.add('col')

    let b_title = document.createElement('div')
    b_title.classList.add('col-6')

    let b_links = document.createElement('div')
    b_links.classList.add('col')

    // visualizer container
    let visualizer = document.createElement('div')
    visualizer.classList.add('row')

    let v_params = document.createElement('div')
    v_params.classList.add('col', 'params')

    // accordion
    let v_accordion = document.createElement('div')
    v_accordion.id = "action-accordion"
    v_accordion.classList.add('accordion')

    let explorer_item = create_accordion_item("explorer-header", "explorer-collapse", "Explorer Controls",
        "action-accordion", "Content Explorer", ["collapse", "show"], [])
    
    let submit_item = create_accordion_item("submit-header", "submit-collapse", "Submit Simulation",
        "action-accordion", "Content", ["collapse"], ["collapsed"])

    let fetch_item = create_accordion_item("fetch-header", "fetch-collapse", "Fetch Simulation Results",
        "action-accordion", "Fetch Simulation Results", ["collapse"], ["collapsed"])


    // append items to accordion
    v_accordion.appendChild(explorer_item)
    v_accordion.appendChild(submit_item)
    v_accordion.appendChild(fetch_item)



    //
    let v_canvas_div = document.createElement('div')
    v_canvas_div.classList.add('col-9')

    let v_canvas = document.createElement('canvas')
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

function canvas_el() {
    // Title div

}


window.addEventListener('resize', resize);

function resize() {
    // Update sizes
    var win_h = window.innerHeight;
    var win_w = window.innerWidth;

    sizes.height = win_h;
    sizes.width = win_w;
    document.getElementById("v_canvas").width = sizes.width
    document.getElementById("v_canvas").height = sizes.height


    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
}

const gui = new GUI()

const cameraFolder = gui.addFolder('Camera Controls')

cameraFolder.add(camera.position, 'x', -100000, 100000).listen()
cameraFolder.add(camera.position, 'y', -100000, 100000).listen()
cameraFolder.add(camera.position, 'z', -200000, 200000).listen()
cameraFolder.open()

function create_accordion_item(header_id, collapse_id, button_content,
    accordion_id, item_content, content_classes, button_classes) {

    let item = document.createElement('div')
    item.classList.add("accordion-item")

    let header = document.createElement('div')
    header.classList.add("accordion-header")
    header.id = header_id

    let button = document.createElement('button')
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

    let content = document.createElement('div')
    content.id = collapse_id
    content.classList.add("accordion-collapse")
    for (let i = 0; i < content_classes.length; i++) {
        content.classList.add(content_classes[i])
    }
    content.setAttribute("aria-labelledby", header_id)
    content.setAttribute("data-bs-parent", "#" + accordion_id)

    let body = document.createElement('div')
    body.classList.add("accordion-body")
    body.innerHTML = item_content

    header.appendChild(body)
    header.appendChild(button)

    content.appendChild(body)

    item.appendChild(header)
    item.appendChild(content)

    return item
}

function createSticks(vertices) {

    const geometries = []
    // const vertices = EnsembleManager.getSingleCentroidVerticesWithTrace(trace)

    const endPoints = []
    for (let i = 0; i < vertices.length - 1; i++) {
        endPoints.push({ a_o: vertices[i], b_o: vertices[i + 1] })
    }

    for (let { a_o, b_o } of endPoints) {

        // stick has length equal to distance between endpoints

        const a = new THREE.Vector3(a_o[0], a_o[1], a_o[2]);
        const b = new THREE.Vector3(b_o[0], b_o[1], b_o[2]);
        const a_radius = a_o[3]
        const b_radius = b_o[3]

        const distance = a.distanceTo(b)
        const cylinder = new THREE.CylinderGeometry(a_radius, b_radius, distance, 80, 80)

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

        const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        const mesh = new THREE.Mesh(cylinder, material);
        scene.add(mesh);
        renderer.render(scene, camera);
        // add to geometry list
        //geometries.push(cylinder)

    }

    // Aggregate geometry list into single BufferGeometry
    //const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    //const mesh = new THREE.Mesh(geometries[0], material);
    //mesh.name = 'stick';
    //console.log(mesh)

    //return mesh;
}