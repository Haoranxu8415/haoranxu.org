document.addEventListener("DOMContentLoaded", function () {
  const visitButton = document.querySelector(".visit-button");

  if (visitButton) {
    visitButton.addEventListener("click", function (e) {
      e.preventDefault();

      // Add fade-out animation to body
      document.body.style.transition = "opacity 0.5s ease";
      document.body.style.opacity = 0;

      // After transition, navigate to home.html
      setTimeout(() => {
        window.location.href = "home.html";
      }, 500);
    });
  }
});
