(() => {
  const grid = document.getElementById("meeting-grid");
  const dialog = document.getElementById("notice");
  const message = document.getElementById("notice-message");
  const closeButton = document.getElementById("close-notice");
  if (!grid || !dialog || !message || !closeButton) return;

  const prefix = document.body.dataset.pathPrefix || "";
  const owner = "AidilYufiqhar";
  const repository = "pw-aidilyufiqhar041";
  const branch = "main";
  const excludedFolders = new Set(["web", "controller", "img", ".github"]);
  let folders = [];

  const showNotice = (text) => {
    message.textContent = text;
    if (dialog.showModal) dialog.showModal();
    else alert(text);
  };

  closeButton.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  const loadRepositoryFolders = async () => {
    const treeUrl = `https://api.github.com/repos/${owner}/${repository}/git/trees/${branch}?recursive=1`;
    const response = await fetch(treeUrl, {
      headers: { Accept: "application/vnd.github+json" },
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Repository tidak dapat dibaca dari GitHub.");
    const data = await response.json();
    if (data.truncated) throw new Error("Daftar folder repository dari GitHub tidak lengkap.");

    const rootFolders = new Set(
      data.tree
        .filter((item) => item.type === "tree" && !item.path.includes("/"))
        .map((item) => item.path),
    );

    return [...rootFolders]
      .filter((name) => !excludedFolders.has(name))
      .map((name) => {
        const match = name.match(/^pertemuan(\d+)$/i);
        const isExam = name.toLowerCase() === "folder_ujian";
        const page = data.tree
          .filter((item) => item.type === "blob" && item.path.startsWith(`${name}/`) && /\/index\.html$/i.test(item.path))
          .sort((a, b) => a.path.split("/").length - b.path.split("/").length)[0];
        return {
          folder: name,
          number: match ? Number(match[1]) : null,
          isExam,
          pagePath: page?.path || "",
        };
      })
      .sort((a, b) => a.folder.localeCompare(b.folder, "en", { numeric: true }));
  };

  const fallbackFolders = () => [
    { folder: "folder_ujian", number: null, isExam: true, pagePath: "folder_ujian/UTS-PW-NIM/index.html" },
    ...Array.from({ length: 16 }, (_, index) => {
      const number = index + 1;
      return {
        folder: `pertemuan${number}`,
        number,
        isExam: false,
        pagePath: number <= 4 ? `pertemuan${number}/index.html` : "",
      };
    }),
  ];

  const renderFolders = () => {
    const isEnglish = window.siteLanguage === "en";
    grid.replaceChildren();

    folders.forEach((item) => {
      const button = document.createElement("button");
      button.className = "meeting";
      button.type = "button";
      const badge = document.createElement("span");
      badge.className = item.isExam ? "number number-tag" : "number";
      badge.textContent = item.number === null ? (item.isExam ? "UTS" : "DIR") : String(item.number).padStart(2, "0");
      const label = document.createElement("span");
      label.className = "label";
      label.textContent = item.folder;
      const arrow = document.createElement("span");
      arrow.className = "arrow";
      arrow.setAttribute("aria-hidden", "true");
      arrow.textContent = "›";
      button.append(badge, label, arrow);
      button.setAttribute("aria-label", `${item.folder} — ${isEnglish ? "open folder" : "buka folder"}`);

      button.addEventListener("click", () => {
        if (!item.pagePath) {
          showNotice(isEnglish
            ? `${item.folder} does not contain an index.html page yet.`
            : `Folder ${item.folder} belum memiliki halaman index.html.`);
          return;
        }
        location.href = `${prefix}${item.pagePath}`;
      });
      grid.append(button);
    });
  };

  window.addEventListener("languagechange", renderFolders);
  loadRepositoryFolders()
    .then((items) => {
      folders = items;
      renderFolders();
    })
    .catch(() => {
      folders = fallbackFolders();
      renderFolders();
    });
})();