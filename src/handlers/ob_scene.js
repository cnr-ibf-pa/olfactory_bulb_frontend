import * as THREE from 'three';

const cameraSettings = {
    fov: 20,
    aspect: window.innerWidth / window.innerHeight,
    near: 1,
    far: 100000
}

const granuleConf = {
    radius: 15,
    widthSegment: 32,
    heightSegment: 16,
    color: 'white',
}


export class PickHelper {
    constructor() {
        this.raycaster = new THREE.Raycaster();
        this.pickedObject = null;
        this.pickedObjectSavedColor = 0;
    }

    pick(normalizedPosition, scene, camera) {
      // restore the color if there is a picked object
        if (this.pickedObject) {
            this.pickedObject.material.emissive.setHex(this.pickedObjectSavedColor);
            this.pickedObject = undefined;
        }
   
        // cast a ray through the frustum
        this.raycaster.setFromCamera(normalizedPosition, camera);
        // get the list of objects the ray intersected
        const intersectedObjects = this.raycaster.intersectObjects(scene.children);
        if (intersectedObjects.length) {
            // pick the first object. It's the closest one
            this.pickedObject = intersectedObjects[0].object;
            // save its color
            this.pickedObjectSavedColor = this.pickedObject.material.emissive.getHex();
            // set its emissive color to flashing red/yellow
            // this.pickedObject.material.emissive.setHex((time * 8) % 2 > 1 ? 0xFFFF00 : 0xFF0000);
            this.pickedObject.material.emissive.setHex(0xff0000);
        }
    }

    getObject() {
        return this.pickedObject;
    }
}


export class ObScene {

    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(
            cameraSettings.fov,
            cameraSettings.aspect,
            cameraSettings.near,
            cameraSettings.far
        );
        this.camera.position.z = 1000;
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.domElement.id = "canvas";
        document.body.appendChild(this.renderer.domElement);

        
        this.cameraPole = new THREE.Object3D();
        this.scene.add(this.cameraPole);
        this.cameraPole.add(this.camera);

        // const light = new THREE.HemisphereLight(0xafafaf, 0x0c0c0c, 1.5);
        this.light = new THREE.PointLight(0xffffff, 1);
        this.scene.add(this.camera);
        this.cameraPole.add(this.light);

        this.scene.background = new THREE.Color("white");
    }

    addGranuleCell(name, position={x: 0, y: 0, z: 0}) {
        let geometry = new THREE.SphereGeometry(
            granuleConf.radius, 
            granuleConf.widthSegment,
            granuleConf.heightSegment
        );
        let material = new THREE.MeshPhongMaterial({color: granuleConf.color});
        let granuleCell = new THREE.Mesh(geometry, material);

        granuleCell.position.set(position.x, position.y, position.z);
        granuleCell.name = name;

        this.scene.add(granuleCell);
    }

    removeCell(name) {
        let cell = this.scene.getObjectByName(name);
        this.scene.remove(cell);
    }


    resize() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    render() {
        this.light.position.set(
            this.camera.position.x,
            this.camera.position.y,
            this.camera.position.z + 10);
        this.renderer.render(this.scene, this.camera);
    }
}
