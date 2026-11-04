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
  let sessions = [];

  const showNotice = (text) => {
    message.textContent = text;
    if (dialog.showModal) dialog.showModal();
    else alert(text);
  };

  closeButton.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  const folderLabel = (name) => name
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

  const readPageTitle = async (path) => {
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repository}/${branch}/${path}`;
    try {
      const response = await fetch(rawUrl, { cache: "no-store" });
      if (!response.ok) return "";
      const source = await response.text();
      const page = new DOMParser().parseFromString(source, "text/html");
      const heading = page.querySelector("main h1, h1");
      const title = (heading?.textContent || page.title || "").replace(/\s+/g, " ").trim();
      if (!title || /^(doc|document|untitled)$/i.test(title)) return "";
      return title;
    } catch {
      return "";
    }
  };

  const loadRepositoryFolders = async () => {
    const treeUrl = `https://api.github.com/repos/${owner}/${repository}/git/trees/${branch}?recursive=1`;
    const response = await fetch(treeUrl, {
      headers: { Accept: "application/vnd.github+json" },
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Repository tidak dapat dibaca dari GitHub.");
    const data = await response.json();
    if (data.truncated) throw new Error("Daftar berkas repository dari GitHub tidak lengkap.");

    const topFolders = new Set(
      data.tree
        .filter((item) => item.type === "tree" && !item.path.includes("/"))
        .map((item) => item.path),
    );
    const candidates = [...topFolders]
      .filter((name) => name !== "web" && name !== "controller" && name !== "img")
      .map((name) => {
        const meeting = name.match(/^pertemuan(\d+)$/i);
        const pages = data.tree
          .filter((item) => item.type === "blob" && item.path.startsWith(`${name}/`) && /\/index\.html$/i.test(item.path))
          .sort((a, b) => a.path.split("/").length - b.path.split("/").length);
        const isExam = name.toLowerCase() === "folder_ujian";
        if (!meeting && !isExam && pages.length === 0) return null;
        return {
          folder: name,
          number: meeting ? Number(meeting[1]) : null,
          isExam,
          pagePath: pages[0]?.path || "",
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        if (a.number !== null && b.number !== null) return a.number - b.number;
        if (a.number !== null) return -1;
        if (b.number !== null) return 1;
        if (a.isExam !== b.isExam) return a.isExam ? -1 : 1;
        return a.folder.localeCompare(b.folder, "id", { numeric: true });
      });

    return Promise.all(candidates.map(async (item) => ({
      ...item,
      title: item.pagePath ? await readPageTitle(item.pagePath) : "",
    })));
  };

  const fallbackFolders = () => [
    ...Array.from({ length: 16 }, (_, index) => {
      const number = index + 1;
      return {
        folder: `pertemuan${number}`,
        number,
        isExam: false,
        pagePath: number <= 3 ? `pertemuan${number}/index.html` : "",
        title: `Pertemuan ${number}`,
      };
    }),
    {
      folder: "folder_ujian",
      number: null,
      isExam: true,
      pagePath: "folder_ujian/UTS-PW-NIM/index.html",
      title: "BF Comunitas",
    },
  ];

  const renderSessions = () => {
    const isEnglish = window.siteLanguage === "en";
    grid.replaceChildren();

    sessions.forEach((item) => {
      const button = document.createElement("button");
      button.className = "meeting";
      button.type = "button";
      const badge = document.createElement("span");
      badge.className = item.isExam ? "number number-tag" : "number";
      badge.textContent = item.number === null ? (item.isExam ? "UTS" : "•") : String(item.number).padStart(2, "0");
      const label = document.createElement("span");
      label.className = "label";
      label.textContent = item.title || (item.number === null ? folderLabel(item.folder) : `${isEnglish ? "Session" : "Pertemuan"} ${item.number}`);
      const arrow = document.createElement("span");
      arrow.className = "arrow";
      arrow.setAttribute("aria-hidden", "true");
      arrow.textContent = "›";
      button.append(badge, label, arrow);
      button.setAttribute("aria-label", `${label.textContent} — ${isEnglish ? "open folder" : "buka folder"}`);

      button.addEventListener("click", () => {
        if (!item.pagePath) {
          showNotice(isEnglish
            ? `${item.folder} exists in the repository, but it does not contain an index.html page yet.`
            : `Folder ${item.folder} ada di repository, tetapi belum memiliki halaman index.html.`);
          return;
        }
        location.href = `${prefix}${item.pagePath}`;
      });
      grid.append(button);
    });
  };

  window.addEventListener("languagechange", renderSessions);

  loadRepositoryFolders()
    .then((items) => {
      sessions = items;
      renderSessions();
    })
    .catch(() => {
      sessions = fallbackFolders();
      renderSessions();
    });
})();