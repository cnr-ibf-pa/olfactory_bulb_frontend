export function getConfig() {
    return {
        authority: "https://iam.ebrains.eu/auth/realms/hbp",
        authorization_endpoint: "https://iam.ebrains.eu/auth/realms/hbp/protocol/openid-connect/auth",
        userinfo_endpoint: "https://iam.ebrains.eu/auth/realms/hbp/protocol/openid-connect/userinfo",
        client_id: "olfactory-bulb",
        redirect_uri: "https://olfactory-bulb.cineca.it/callback.html",
        silent_redirect_uri: "https://olfactory-bulb.cineca.it/silent-renew.html",
    }
}