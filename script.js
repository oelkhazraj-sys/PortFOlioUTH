(function () {
  window.__oeMainScriptLoaded = true;

  var root = document.documentElement;
  var header = document.querySelector(".site-header");
  var menuToggle = document.querySelector(".menu-toggle");
  var themeToggle = document.querySelector(".theme-toggle");
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav-link"));
  var sections = Array.prototype.slice.call(document.querySelectorAll("main section[id]"));
  var revealItems = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  var filterChips = Array.prototype.slice.call(document.querySelectorAll(".filter-chip"));
  var projectCards = Array.prototype.slice.call(document.querySelectorAll(".project-card"));
  var projectsEmpty = document.getElementById("projects-empty");
  var contactForm = document.querySelector('form[name="contact"]');
  var formStatus = document.getElementById("form-status");
  var yearNode = document.getElementById("year");
  var scrollProgress = document.querySelector(".scroll-progress");

  if (yearNode) {
    yearNode.textContent = String(new Date().getFullYear());
  }

  function readTheme() {
    var current = root.getAttribute("data-theme");
    if (current === "light" || current === "dark") {
      return current;
    }

    try {
      var stored = localStorage.getItem("oe_theme");
      if (stored === "light" || stored === "dark") {
        return stored;
      }
    } catch (error) {
      return "dark";
    }

    return "dark";
  }

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);

    try {
      localStorage.setItem("oe_theme", theme);
    } catch (error) {
      // Ignore storage limitations.
    }

    if (themeToggle) {
      var isLight = theme === "light";
      themeToggle.textContent = isLight ? "Dark mode" : "Light mode";
      themeToggle.setAttribute("aria-pressed", String(isLight));
    }
  }

  applyTheme(readTheme());

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      var nextTheme = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(nextTheme);
    });
  }

  function closeMenu() {
    if (!header || !menuToggle) {
      return;
    }

    header.classList.remove("menu-open");
    menuToggle.setAttribute("aria-expanded", "false");
  }

  if (menuToggle && header) {
    menuToggle.addEventListener("click", function () {
      var isOpen = header.classList.toggle("menu-open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
    });

    document.addEventListener("click", function (event) {
      if (!header.classList.contains("menu-open")) {
        return;
      }

      if (!header.contains(event.target)) {
        closeMenu();
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 960) {
        closeMenu();
      }
    });
  }

  navLinks.forEach(function (link) {
    link.addEventListener("click", closeMenu);
  });

  function setActiveSection(sectionId) {
    navLinks.forEach(function (link) {
      var isActive = link.getAttribute("href") === "#" + sectionId;
      link.classList.toggle("is-active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  if (sections.length > 0) {
    setActiveSection(sections[0].id);

    var ratios = new Map();
    sections.forEach(function (section) {
      ratios.set(section.id, 0);
    });

    var sectionObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          ratios.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
        });

        var bestId = sections[0].id;
        var bestRatio = 0;

        ratios.forEach(function (ratio, id) {
          if (ratio >= bestRatio) {
            bestId = id;
            bestRatio = ratio;
          }
        });

        if (bestRatio > 0) {
          setActiveSection(bestId);
        }
      },
      {
        threshold: [0, 0.2, 0.4, 0.6, 0.8, 1],
        rootMargin: "-35% 0px -50% 0px"
      }
    );

    sections.forEach(function (section) {
      sectionObserver.observe(section);
    });
  }

  if ("IntersectionObserver" in window) {
    var revealObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: "0px 0px -8% 0px"
      }
    );

    revealItems.forEach(function (item) {
      revealObserver.observe(item);
    });
  } else {
    revealItems.forEach(function (item) {
      item.classList.add("is-visible");
    });
  }

  var selectedFilters = {
    domain: "all",
    specialty: "all"
  };

  function applyProjectFilters() {
    var visibleCount = 0;

    projectCards.forEach(function (card) {
      var categories = (card.getAttribute("data-category") || "").split(" ").filter(Boolean);
      var specialties = (card.getAttribute("data-specialty") || "").split(" ").filter(Boolean);

      var domainMatch = selectedFilters.domain === "all" || categories.indexOf(selectedFilters.domain) !== -1;
      var specialtyMatch = selectedFilters.specialty === "all" || specialties.indexOf(selectedFilters.specialty) !== -1;
      var show = domainMatch && specialtyMatch;

      card.hidden = !show;
      if (show) {
        visibleCount += 1;
      }
    });

    if (projectsEmpty) {
      projectsEmpty.hidden = visibleCount > 0;
    }
  }

  filterChips.forEach(function (button) {
    button.setAttribute("aria-pressed", String(button.classList.contains("is-active")));
  });

  filterChips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      var group = chip.getAttribute("data-filter-group") || "domain";
      var selected = chip.getAttribute("data-filter") || "all";
      selectedFilters[group] = selected;

      filterChips.forEach(function (button) {
        var sameGroup = (button.getAttribute("data-filter-group") || "domain") === group;
        if (sameGroup) {
          var active = button === chip;
          button.classList.toggle("is-active", active);
          button.setAttribute("aria-pressed", String(active));
        }
      });

      applyProjectFilters();
    });
  });

  applyProjectFilters();

  function updateScrollProgress() {
    if (!scrollProgress) {
      return;
    }

    var scrollTop = window.scrollY || window.pageYOffset;
    var maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    var progress = maxScroll > 0 ? Math.min(1, Math.max(0, scrollTop / maxScroll)) : 0;
    scrollProgress.style.transform = "scaleX(" + progress + ")";
  }

  updateScrollProgress();
  window.addEventListener("scroll", updateScrollProgress, { passive: true });
  window.addEventListener("resize", updateScrollProgress);

  function encodeFormData(formData) {
    return new URLSearchParams(formData).toString();
  }

  if (contactForm && formStatus) {
    contactForm.addEventListener("submit", function (event) {
      event.preventDefault();
      formStatus.classList.remove("is-error");
      formStatus.textContent = "Sending your message...";

      var data = new FormData(contactForm);

      fetch("/", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: encodeFormData(data)
      })
        .then(function () {
          formStatus.textContent = "Thanks. Your message has been received.";
          contactForm.reset();
        })
        .catch(function () {
          formStatus.textContent = "Unable to submit right now. Please email elkhazrajothman@gmail.com.";
          formStatus.classList.add("is-error");
        });
    });
  }
})();
