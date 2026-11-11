(() => {
  const toggle = document.getElementById("language-toggle");
  let language = "id";

  try {
    language = localStorage.getItem("site-language") || "id";
  } catch {
    // Keep Indonesian as the default when storage is unavailable.
  }

  const applyLanguage = (value) => {
    language = value === "en" ? "en" : "id";
    document.documentElement.lang = language;

    document.querySelectorAll("[data-id][data-en]").forEach((element) => {
      element.innerHTML = language === "en" ? element.dataset.en : element.dataset.id;
    });

    document.querySelectorAll("[data-aria-id][data-aria-en]").forEach((element) => {
      element.setAttribute(
        "aria-label",
        language === "en" ? element.dataset.ariaEn : element.dataset.ariaId,
      );
    });

    if (toggle) {
      toggle.textContent = language === "id" ? "EN" : "ID";
      toggle.setAttribute(
        "aria-label",
        language === "id" ? "Switch language to English" : "Ganti bahasa ke Indonesia",
      );
    }

    window.siteLanguage = language;
    window.dispatchEvent(new Event("languagechange"));
  };

  if (toggle) {
    toggle.addEventListener("click", () => {
      const nextLanguage = window.siteLanguage === "id" ? "en" : "id";
      try {
        localStorage.setItem("site-language", nextLanguage);
      } catch {
        // The language still changes for this page when storage is unavailable.
      }
      applyLanguage(nextLanguage);
    });
  }

  applyLanguage(language);
})();
