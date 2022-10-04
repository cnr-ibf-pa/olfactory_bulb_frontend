
export function setExpirationTime() {
    var today = new Date();
    var priorDate = new Date(new Date().setDate(today.getDate() - 30));
    let YY = priorDate.getFullYear()
    let MM = priorDate.getMonth()
    let HH = priorDate.getHours()
    let mm = priorDate.getMinutes()
    let ss = priorDate.getSeconds()
    let allTime = [YY, MM, HH, mm, ss]
    return allTime
}

// generate simulation name
export function generateSimulationId() {
    let now = new Date();
    let yyyy = now.getFullYear();
    let mm = String(now.getMonth() + 1).padStart(2, '0'); //January is 0!
    let dd = String(now.getDate()).padStart(2, '0');
    let hh = String(now.getHours()).padStart(2, '0');
    let min = String(now.getMinutes()).padStart(2, '0');
    let sec = String(now.getSeconds()).padStart(2, '0');
    return "OB_" + yyyy + mm + dd + hh + min + sec;
}

export function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

// Get dimensions of the THREE.JS main canvas
export function getCanvasDimension() {
    return [document.getElementById("params").clientWidth, document.getElementById("banner").clientHeight]
}

