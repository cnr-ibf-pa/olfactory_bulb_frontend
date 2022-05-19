import  Oidc from 'oidc-client';

// comes from rollup.config.js
// declare var processEnvs: any

function createAuthConfig(clientId, redirUrl) {

  const settings = {
    authority: 'https://iam.ebrains.eu/auth/realms/hbp',
    authorization_endpoint: 'https://iam.ebrains.eu/auth/realms/hbp/protocol/openid-connect/auth', 
    userinfo_endpoint: 'https://iam.ebrains.eu/auth/realms/hbp/protocol/openid-connect/userinfo',
    //client_id: 'localhost-test-2',
    //redirect_uri: 'http://localhost:8080/callback.html',
      client_id: clientId,
      redirect_uri: redirUrl,
    scope: 'openid profile email',    
    response_type: 'id_token token',
    userStore: new Oidc.WebStorageStateStore({ store : window.localStorage }),
  }
  return settings;
}

async function login(authMgr) {
  saveUrl(window.location.href);
  return authMgr.signinRedirect();
}

async function loginSilent() {
    const authMgr = createAuthManager(clientId, redirUrl);
  await authMgr.signinSilent();
}

function createAuthManager(clientId, redirUrl) {
    const oidcConfig = createAuthConfig(clientId, redirUrl);
  const authMgr = new Oidc.UserManager(oidcConfig);
  return authMgr;
}

function init(clientId, redirUrl) {
  clientId = clientId
  redirUrl = redirUrl
    const authMgr = createAuthManager(clientId, redirUrl);
  return login(authMgr);
}

async function getUserInfo() {
    const authMgr = createAuthManager(clientId, redirUrl);
  const user = await authMgr.getUser();
  return user;
}


export const storageKeys = {
  SAVED_URL: 'urlParam',
  SELECTED_USECASE: 'selectedUsecase',
  RETURN_LOGIN: 'returnFromLogin',
  MODELS_LIST: 'modelsList',
  SELECTED_COLLAB: 'selectedCollab',
  SELECTED_CATEGORY: 'selectedCategory',
};

export function saveUrl(url) {
  sessionStorage.setItem(storageKeys.SAVED_URL, url);
}
export function getSavedUrl() {
  return sessionStorage.getItem(storageKeys.SAVED_URL);
}


export default init;

export {
  init,
  getUserInfo,
  loginSilent,
}