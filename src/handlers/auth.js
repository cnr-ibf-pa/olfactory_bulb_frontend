import { UserManager, WebStorageStateStore, Log } from "oidc-client";
import * as dev from "./dev-config.js";
import * as prod from "./prod-config.js"

Log.logger = console;


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


function getUserManagerSettings() {
    /*** these fields are taken from dev-config or prod-config ***
    authority,
    authorization_endpoint,
    userinfo_endpoint,
    client_id,
    redirect_uri,
    silent_redirect_uri,
    */

    let generalConfig = {
        automaticSilentRenew: true,
        scope: 'openid profile email',
        response_type: 'id_token token',
        userStore: new WebStorageStateStore({ store : window.localStorage })
    }

    if (window.location.href.includes("localhost")) {
        return Object.assign(generalConfig, dev.getConfig());
    } 
    return Object.assign(generalConfig, prod.getConfig());
}


export default class OidcManager {

    #mgr = null;
    #user = null;

    constructor() {
        this.#mgr = new UserManager(getUserManagerSettings());
        this.loadUser();
        this.#mgr.getUser().then(user =>{
            if (user == null || user.expired) {
                this.#mgr.signinRedirect();
            }
            this.#user = user;
        });

        this.#mgr.events.addSilentRenewError((error) => {
            console.log("ERROR ON SILENT LOGIN");
            console.log(error);
            console.log(this.#user);
            console.log(this.#user.expired);
        })

        this.#mgr.events.addAccessTokenExpiring(() => {
            console.log("THE TOKEN IS EXPIRING");
        })
        this.#mgr.events.addAccessTokenExpired(() => {
            console.log("THE TOKEN IS EXPIRED");
            this.silentLogin();
        })
    }

    async loadUser() {
        await this.#mgr.getUser().then(user => {
            if (user == null || user.expired) {
                this.#mgr.signinRedirect();
            }
            this.#user = user;
        })
    }

    silentLogin() {
        this.#mgr.signinSilent();
    }

    getUserManager() {
        return this.#mgr;
    }

    getAccessToken() {
        return this.#user.access_token;
    }

    getUser() {
        return this.#user;
    }
}