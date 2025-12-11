const API = "http://127.0.0.1:8000";

function register() {
    fetch(API + "/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            username: r_username.value,
            password: r_password.value,
            role: r_role.value,
            org_name: r_org.value
        })
    })
    .then(res => res.json())
    .then(data => {
        register_result.innerText = "Registered: " + data.username;
    })
    .catch(err => {
        register_result.innerText = "Error";
    });
}

function login() {
    fetch(API + "/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            username: l_username.value,
            password: l_password.value
        })
    })
    .then(res => res.json())
    .then(data => {
        login_result.innerText = "Token received ✅";
        localStorage.setItem("token", data.access_token);
    })
    .catch(err => {
        login_result.innerText = "Login failed ❌";
    });
}
