import {
  getUsers,
  saveUsers,
  setCurrentUser,
  getCurrentUser,
  logoutUser,
} from "./storageService";

export function register(name, email, password) {
  const users = getUsers();

  const exists = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );

  if (exists) {
    throw new Error("Email already exists.");
  }

  const newUser = {
    id: Date.now(),
    name,
    email,
    password,
    role: "user",
  };

  users.push(newUser);

  saveUsers(users);

  return newUser;
}

export function login(email, password) {
  const users = getUsers();

  const user = users.find(
    (u) =>
      u.email === email &&
      u.password === password
  );

  if (!user) {
    throw new Error("Invalid email or password.");
  }

  setCurrentUser(user);

  return user;
}

export function logout() {
  logoutUser();
}

export function currentUser() {
  return getCurrentUser();
}

export function isLoggedIn() {
  return !!getCurrentUser();
}