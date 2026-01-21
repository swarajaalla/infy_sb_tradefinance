export const getUser = () => {
  const token = localStorage.getItem("access_token");
  const id = localStorage.getItem("user_id");
  const username = localStorage.getItem("username");
  const role = localStorage.getItem("role");

  if (!token || !id) return null;

  return {
    id: Number(id),
    username,
    role,
    token,
  };
};

export const logout = () => {
  localStorage.clear();
};
