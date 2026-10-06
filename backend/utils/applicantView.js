// Makes a guest application look like a normal one to the frontend:
// if there is no linked user account, build a `user` object from the
// applicant fields, so pages that read app.user.name / app.user.email keep working.
export function withApplicant(application) {
  const app = application?.toObject ? application.toObject() : application;
  if (!app || app.user) return app;

  return {
    ...app,
    user: {
      name: app.applicantName,
      email: app.applicantEmail,
      phone: app.applicantPhone,
      location: app.applicantAddress,
      isGuest: true,
    },
  };
}