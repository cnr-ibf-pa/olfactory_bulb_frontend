export function getConfig() {
    return {
        authority: "https://iam.ebrains.eu/auth/realms/hbp",
        authorization_endpoint: "https://iam.ebrains.eu/auth/realms/hbp/protocol/openid-connect/auth",
        userinfo_endpoint: "https://iam.ebrains.eu/auth/realms/hbp/protocol/openid-connect/userinfo",
        client_id: "localhost-test-2",
        redirect_uri: "http://localhost:8080/callback.html",
        silent_redirect_uri: "https://localhost:8080/silent-renew.html",
    }
}