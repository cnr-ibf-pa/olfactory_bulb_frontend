const mhe = require('./manageHtmlElements')

module.exports = { createGuidebookModal, createWaitingModal, setModalMessage, createMessageModal }

function setModalMessage(modalMessageId, message) {
    mhe.ge(modalMessageId).innerHTML = message
}

function createGuidebookModal(modalId, modalTitleId) {
    let modalDiv = mhe.cf("div")
    modalDiv.id = modalId
    modalDiv.classList.add("modal", "fade", "ob-modal")
    modalDiv.setAttribute("data-bs-backdrop", "static")
    modalDiv.setAttribute("data-bs-keyboard", "false")
    modalDiv.setAttribute("tabindex", "-1")
    modalDiv.setAttribute("aria-labelledby", modalTitleId)
    modalDiv.setAttribute("aria-hidden", "true")

    let modalDialog = mhe.cf("div")
    modalDialog.classList.add("modal-dialog")

    let modalContent = mhe.cf("div")
    modalContent.classList.add("modal-content")

    let modalHeader = mhe.cf("div")
    modalHeader.classList.add("modal-header")

    let modalTitle = mhe.cf("h5")
    modalTitle.classList.add("modal-title")
    modalTitle.innerHTML = "OLFACTORY BULB EXPLORER Guidebook"
    modalTitle.id = modalTitleId

    let modalBody = mhe.cf("div")
    modalBody.classList.add("modal-body")
    modalBody.innerHTML = "The OLFACTORY BULB EXPLORER web application \
    allows to run a simulation of the olfactory bulb on the CSCS DAINT HPC system \
    fetch the simulation results and interactively visualize the simulated glomeruli, \
    mitral and tufted cells. \
    <br>The olfactory bulb simulator is implemented as a \
    Python library available at this <a target='_blank' \
    href='https://github.com/HumanBrainProject/olfactory-bulb-3d'>link</a>. \
    <br><br>The left menu contains three panels for each type of operation \
    the users can perform. \
    <br><br>The <strong>EXPLORER CONTROLS</strong> panel allows to select the \
    simulated glomeruli and the relative mitral and tufted cells for visualization. \
    The users can also visualize the synaptic strength for every section via a colorbar.\
    <br>The <strong>RUN SIMULATION</strong> panel allows to select the odor stimulus \
    and the glomeruli to be taken into account for the simulation. The odor stimulus interval \
    can be set. As well as the The user can define the sniffing interval (in ms). The simulation \
    duration is currently set to 1000 s.\
    <br>The <strong>FETCH RESULTS</strong> panel allows to check the status of the \
    submitted jobs, fetch the needed file for the circuit visualization and download the \
    simulation results. \
    <br><br>For support or questions, please write to <i>support [AT] ebrains.eu</i>.\
    "

    let modalFooter = mhe.cf("div")
    modalFooter.classList.add("modal-footer")

    let modalFooterBtn = mhe.cf("button")
    modalFooterBtn.classList.add("btn", "btn-secondary")
    modalFooterBtn.setAttribute("data-bs-dismiss", "modal")
    modalFooterBtn.innerHTML = "Close"

    //
    modalDiv.appendChild(modalDialog)
    modalDiv.appendChild(modalContent)
    modalDiv.appendChild(modalHeader)
    modalDiv.appendChild(modalBody)
    modalDiv.appendChild(modalFooter)

    modalHeader.appendChild(modalTitle)

    modalFooter.appendChild(modalFooterBtn)

    return modalDiv
}




//Modal for displaying loading messages
function createWaitingModal(modalId, modalTitleId, modalMessageId) {
    let modalDiv = mhe.cf("div")
    modalDiv.id = modalId
    modalDiv.classList.add("modal", "fade", "waiting-modal")
    modalDiv.setAttribute("data-bs-backdrop", "static")
    modalDiv.setAttribute("data-bs-keyboard", "false")
    modalDiv.setAttribute("tabindex", "-1")
    modalDiv.setAttribute("aria-labelledby", modalTitleId)
    modalDiv.setAttribute("aria-hidden", "true")

    let modalDialog = mhe.cf("div")
    modalDialog.classList.add("modal-dialog")

    let modalContent = mhe.cf("div")
    modalContent.classList.add("modal-content")

    let modalBody = mhe.cf("div")
    modalBody.classList.add("modal-body", "waiting")
    modalBody.innerHTML = "<div class='spinner-border text-warning' role='status'></div>\
    <div id=" + modalMessageId + ">Loading model data<br>Please wait ...</div>"
    //
    modalDiv.appendChild(modalDialog)
    modalDiv.appendChild(modalContent)
    modalDiv.appendChild(modalBody)

    return modalDiv
}


//Modal for displaying loading messages
function createMessageModal(modalId, modalTitleId, modalMessageId) {
    let modalDiv = mhe.cf("div")
    modalDiv.id = modalId
    modalDiv.classList.add("modal", "fade", "waiting-modal")
    modalDiv.setAttribute("data-bs-backdrop", "static")
    modalDiv.setAttribute("data-bs-keyboard", "false")
    modalDiv.setAttribute("tabindex", "-1")
    modalDiv.setAttribute("aria-labelledby", modalTitleId)
    modalDiv.setAttribute("aria-hidden", "true")

    let modalDialog = mhe.cf("div")
    modalDialog.classList.add("modal-dialog")

    let modalContent = mhe.cf("div")
    modalContent.classList.add("modal-content")

    let modalBody = mhe.cf("div")
    modalBody.classList.add("modal-body", "message")
    modalBody.innerHTML = "<div id=" + modalMessageId + "></div>"

    let modalFooter = mhe.cf("div")
    modalFooter.classList.add("modal-footer")

    let modalFooterBtn = mhe.cf("button")
    modalFooterBtn.classList.add("btn", "btn-secondary")
    modalFooterBtn.setAttribute("data-bs-dismiss", "modal")
    modalFooterBtn.innerHTML = "Close"

    //
    modalDiv.appendChild(modalDialog)
    modalDiv.appendChild(modalContent)
    modalDiv.appendChild(modalBody)
    modalDiv.appendChild(modalFooter)
    modalFooter.appendChild(modalFooterBtn)

    return modalDiv
}