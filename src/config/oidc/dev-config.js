export function getConfig() {
    return {
        authority: "https://iam-int.ebrains.eu/auth/realms/hbp",
        authorization_endpoint: "https://iam-int.ebrains.eu/auth/realms/hbp/protocol/openid-connect/auth",
        userinfo_endpoint: "https://iam-int.ebrains.eu/auth/realms/hbp/protocol/openid-connect/userinfo",
        client_id: "localhost-test-rsmir",
        redirect_uri: "https://localhost:8080/callback.html",
        silent_redirect_uri: "https://localhost:8080/silent-renew.html",
    }
}