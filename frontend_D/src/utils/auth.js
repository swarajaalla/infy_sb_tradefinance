export function isLoggedIn() {
  return !!localStorage.getItem("token");
}

export function getRole() {
  return localStorage.getItem("role");
}

export function logout() {
  localStorage.clear();
  window.location.href = "/";
}
