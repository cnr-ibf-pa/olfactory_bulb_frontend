// import { buildDOM } from "./utils/domManager";
import { ObScene, PickHelper } from "./handlers/ob_scene";
import { ArcballControls } from "three/examples/jsm/controls/ArcballControls";


const obScene = new ObScene();


function getRandomInteger(min, max) {
    return Math.floor(Math.random() * (max - min) ) + min;
}

for (let i=0; i<100; i++) {
    let position = {
        x: getRandomInteger(-1000, 1000),
        y: getRandomInteger(-1000, 1000),
        z: getRandomInteger(-1000, 1000)
    };
    obScene.addGranuleCell("cell_" + i.toString(), position);
}


window.addEventListener("resize", () => {
    obScene.resize();
})


const pickHelper = new PickHelper();

const pickPosition = {x: 0, y: 0};
clearPickPosition();

var tempObject = undefined;

function getCanvasRelativePosition(event) {
  const canvas = document.getElementById("canvas");
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * canvas.width  / rect.width,
    y: (event.clientY - rect.top ) * canvas.height / rect.height,
  };
}
 
function setPickPosition(event) {
    const pos = getCanvasRelativePosition(event);
    pickPosition.x = (pos.x / canvas.width ) *  2 - 1;
    pickPosition.y = (pos.y / canvas.height) * -2 + 1;  // note we flip Y
}
 
function clearPickPosition() {
  // unlike the mouse which always has a position
  // if the user stops touching the screen we want
  // to stop picking. For now we just pick a value
  // unlikely to pick something
  pickPosition.x = -100000;
  pickPosition.y = -100000;
}
 
window.addEventListener("mousemove", setPickPosition);
window.addEventListener("mouseout", clearPickPosition);
window.addEventListener("mouseleave", clearPickPosition);

window.addEventListener("mousedown", () => {
    let object = pickHelper.getObject();
    if (object) {
        tempObject = object;
    }
})

window.addEventListener("mouseup", () => {
    let object = pickHelper.getObject();
    if (object && object == tempObject) {
        // obScene.focusOnObject(object);
        console.log(object);
    } else {
        tempObject = undefined;
    }
})

const control = new ArcballControls(
    obScene.camera,
    document.getElementById("canvas"),
    obScene.scene,
);

control.addEventListener("change", () => {
    obScene.render();
    const raycaster = control.getRaycaster();
    const objects = raycaster.intersectObjects(obScene.scene.children, false);
    if (objects.length == 1) {
        console.log("CAMERA: ", obScene.camera.position);
        console.log("OBEJCT: ", objects[0].object.position);
        console.log(objects[0].object.scale);
    }

});

control.setGizmosVisible(true);
control.adjustNearFar = true;


import { GUI } from 'dat.gui';

const gui = new GUI();
const aFolder = gui.addFolder("A Folder");