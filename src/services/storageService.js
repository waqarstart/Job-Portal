const USERS_KEY = "jobportal_users";
const CURRENT_USER_KEY = "jobportal_current_user";
const APPLICATIONS_KEY = "jobportal_applications";

function initialize() {
  if (!localStorage.getItem(USERS_KEY)) {
    const admin = [
      {
        id: 1,
        name: "Administrator",
        email: "admin@jobportal.com",
        password: "admin123",
        role: "admin",
      },
    ];

    localStorage.setItem(USERS_KEY, JSON.stringify(admin));
  }

  if (!localStorage.getItem(APPLICATIONS_KEY)) {
    localStorage.setItem(APPLICATIONS_KEY, JSON.stringify([]));
  }
}

initialize();

export function getUsers() {
  return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
}

export function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getCurrentUser() {
  return JSON.parse(localStorage.getItem(CURRENT_USER_KEY));
}

export function setCurrentUser(user) {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}

export function logoutUser() {
  localStorage.removeItem(CURRENT_USER_KEY);
}

export function getApplications() {
  return JSON.parse(localStorage.getItem(APPLICATIONS_KEY)) || [];
}

export function saveApplications(applications) {
  localStorage.setItem(
    APPLICATIONS_KEY,
    JSON.stringify(applications)
  );
}