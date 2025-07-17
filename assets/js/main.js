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

  // Scroll event: fade navbar in/out
  let lastScrollTop = 0;
  const navbar = document.querySelector('.navbar');

  if (navbar) {
    window.addEventListener('scroll', () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      if (scrollTop > lastScrollTop) {
        // Scrolling down
        navbar.style.opacity = '0';
        navbar.style.transition = 'opacity 0.3s ease';
      } else {
        // Scrolling up
        navbar.style.opacity = '1';
        navbar.style.transition = 'opacity 0.3s ease';
      }
      lastScrollTop = Math.max(scrollTop, 0);
    }, false);
  }

  const navLinks = document.querySelectorAll(".nav-links a");
  if (navLinks.length) {
    navLinks.forEach(link => {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        const currentPage = window.location.pathname.split("/").pop();
        const targetPage = this.getAttribute("href");

        const pageOrder = ["home.html", "projects.html", "blog.html", "contact.html"];
        const currentIndex = pageOrder.indexOf(currentPage);
        const targetIndex = pageOrder.indexOf(targetPage);

        // 记录方向信息到 sessionStorage
        if (targetIndex > currentIndex) {
          sessionStorage.setItem("pageTransition", "slide-left");
        } else if (targetIndex < currentIndex) {
          sessionStorage.setItem("pageTransition", "slide-right");
        } else {
          sessionStorage.removeItem("pageTransition");
        }

        // 添加淡出效果再跳转
        document.body.classList.add("fade-out");
        setTimeout(() => {
          window.location.href = targetPage;
        }, 300);
      });
    });
  }

  // 页面载入时检查并添加动画类
  const transitionClass = sessionStorage.getItem("pageTransition");
  if (transitionClass) {
    document.body.classList.add(transitionClass);
    sessionStorage.removeItem("pageTransition");
  }
});


  document.addEventListener("DOMContentLoaded", function () {
    const params = new URLSearchParams(window.location.search);
    const from = params.get("from");

    const body = document.getElementById("home-body");
    if (from === "visit") {
      body.classList.add("fade-in");
    } else {
      // 预留接口：来自其他标签页后的动画逻辑
      // body.classList.add("from-nav");
    }
  });