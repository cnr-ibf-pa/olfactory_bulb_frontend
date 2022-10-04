module.exports = { cf, ge, gecn }

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