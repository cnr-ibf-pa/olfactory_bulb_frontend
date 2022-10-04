
import _ from 'lodash'
import '../../static/style.css'

//import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.css'
import { Modal } from 'bootstrap'

import EBRAINS_logo from '../../static/img/ebrains_logo.svg'
import infoLogo from '../../static/img/info-circle.svg'
import colorMap from '../../static/img/colorMap.svg'

import { GUI } from 'dat.gui'
import Gradient from 'javascript-color-gradient'

const mhe = require('./manageHtmlElements')
const obmod = require('./obModals')


// Create the DOM elements
export function buildDOM() {

    let page = mhe.cf('div')
    page.classList.add('container-fluid', 'page-container')
    page.id = "page"

    /*  Top banner  */
    let banner = mhe.cf('div')
    banner.classList.add('banner', 'row', 'd-flex', 'align-items-center')
    banner.id = "banner"

    let bannerLogo = mhe.cf('div')
    bannerLogo.classList.add('col', 'banner-element', 'align-left')

    let bannerLogoLink = mhe.cf('a')
    bannerLogoLink.setAttribute('href', 'https://ebrains.eu/')
    bannerLogoLink.setAttribute('target', '_blank')


    let bannerLogoImg = new Image()
    bannerLogoImg.src = EBRAINS_logo
    bannerLogoImg.height = 32;

    bannerLogoLink.appendChild(bannerLogoImg)
    bannerLogo.appendChild(bannerLogoLink)

    let b_title = mhe.cf('div')
    b_title.classList.add('col-6', 'banner-element', 'title')

    let bannerInfo = mhe.cf('div')
    bannerInfo.classList.add('col', 'banner-element', 'align-right')

    let bannerInfoLink = mhe.cf('a')
    bannerInfoLink.setAttribute('type', 'button')
    bannerInfoLink.setAttribute('data-bs-toggle', 'modal')
    bannerInfoLink.setAttribute('data-bs-target', '#guidebook-modal')

    let bannerInfoImg = new Image()
    bannerInfoImg.src = infoLogo
    bannerInfoImg.height = 18

    bannerInfoLink.appendChild(bannerInfoImg)
    bannerInfo.appendChild(bannerInfoLink)

    // visualizer container
    let visualizer = mhe.cf('div')
    visualizer.classList.add('row')

    let v_params = mhe.cf('div')
    v_params.classList.add('col', 'params')
    v_params.id = "params"

    // accordion
    let v_accordion = mhe.cf('div')
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
    let v_canvas_div = mhe.cf('div')
    v_canvas_div.classList.add('col-9', "canvas-container")

    let v_canvas = mhe.cf('canvas')
    v_canvas.id = "v_canvas"
    v_canvas.classList.add('webgl')

    v_canvas_div.appendChild(v_canvas)

    let guidebookModal = obmod.createGuidebookModal("guidebook-modal", "guidebook-modal-title")
    let waitingModal = obmod.createWaitingModal("waiting-modal", "waiting-modal-title", "waiting-modal-msg")
    let messageModal = obmod.createMessageModal("message-modal", "message-modal-title", "message-modal-msg")

    banner.appendChild(bannerLogo)
    banner.appendChild(b_title)
    banner.appendChild(bannerInfo)

    v_params.appendChild(v_accordion)
    visualizer.appendChild(v_params)

    visualizer.appendChild(v_canvas_div)

    page.appendChild(banner)
    page.appendChild(guidebookModal)
    page.appendChild(waitingModal)
    page.appendChild(messageModal)
    page.appendChild(visualizer)

    b_title.innerHTML = "OLFACTORY BULB EXPLORER"

    document.body.appendChild(page)

    // Populate collapsible panels
    // createCellSelectionBox()
    // populateSubmitPanel()
    // populateFetchPanel()

    return;
}

// Create the collapsible items for the control menu
function createAccordionItem(header_id, collapse_id, button_content,
    accordion_id, item_content, content_classes, button_classes, body_id) {

    let item = mhe.cf('div')
    item.classList.add("accordion-item")

    let header = mhe.cf('div')
    header.classList.add("accordion-header")
    header.id = header_id

    let button = mhe.cf('button')
    button.classList.add("accordion-button")
    for (let i = 0; i < button_classes.length; i++) {
        button.classList.add(button_classes[i])
    }
    button.id = header_id + "-btn"
    button.setAttribute("type", "button")
    button.setAttribute("data-bs-toggle", "collapse")
    button.setAttribute("data-bs-target", "#" + collapse_id)
    button.setAttribute("aria-expanded", "true")
    button.setAttribute("aria-controls", collapse_id)
    button.innerHTML = button_content

    let content = mhe.cf('div')
    content.id = collapse_id
    content.classList.add("accordion-collapse")
    for (let i = 0; i < content_classes.length; i++) {
        content.classList.add(content_classes[i])
    }
    content.setAttribute("aria-labelledby", header_id)
    content.setAttribute("data-bs-parent", "#" + accordion_id)

    let body = mhe.cf('div')
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