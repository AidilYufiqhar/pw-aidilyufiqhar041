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
  const cacheKey = "repository-task-folders-v6";
  const excludedFolders = new Set(["web", "controller", "img", ".github"]);
  let folders = [];
  let lastKnownFolders = [];

  const showNotice = (text) => {
    message.textContent = text;
    if (dialog.showModal) dialog.showModal();
    else alert(text);
  };
  closeButton.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  const readFolderUpdate = async (folder) => {
    const url = `https://api.github.com/repos/${owner}/${repository}/commits?path=${encodeURIComponent(folder)}&per_page=1`;
    try {
      const response = await fetch(url, {
        headers: { Accept: "application/vnd.github+json" },
        cache: "no-store",
      });
      if (!response.ok) return "";
      const commits = await response.json();
      return commits[0]?.commit?.committer?.date || commits[0]?.commit?.author?.date || "";
    } catch {
      return "";
    }
  };

  const loadRepositoryFolders = async () => {
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const saved = JSON.parse(cached);
        if (Array.isArray(saved.folders)) {
          lastKnownFolders = saved.folders;
          if (Date.now() - saved.savedAt < 60000) return saved.folders;
        }
      }
    } catch {
      // Continue to the live repository request if browser storage is unavailable.
    }

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
    const candidates = [...rootFolders]
      .filter((name) => !excludedFolders.has(name))
      .map((name) => {
        const match = name.match(/^pertemuan(\d+)$/i);
        const isExam = name.toLowerCase() === "folder_ujian";
        const page = data.tree
          .filter((item) => item.type === "blob" && item.path.startsWith(`${name}/`) && /\/index\.html$/i.test(item.path))
          .sort((a, b) => a.path.split("/").length - b.path.split("/").length)[0];
        return { folder: name, number: match ? Number(match[1]) : null, isExam, pagePath: page?.path || "" };
      });

    const loaded = await Promise.all(candidates.map(async (item) => ({
      ...item,
      updatedAt: await readFolderUpdate(item.folder),
    })));
    loaded.sort((a, b) => {
      const timeA = Date.parse(a.updatedAt) || 0;
      const timeB = Date.parse(b.updatedAt) || 0;
      return timeB - timeA || a.folder.localeCompare(b.folder, "en", { numeric: true });
    });
    lastKnownFolders = loaded;
    try { sessionStorage.setItem(cacheKey, JSON.stringify({ savedAt: Date.now(), folders: loaded })); } catch {}
    return loaded;
  };

  const fallbackFolders = () => [
    { folder: "folder_ujian", number: null, isExam: true, pagePath: "folder_ujian/UTS-PW-2611500041/index.html", updatedAt: "" },
    ...Array.from({ length: 16 }, (_, index) => {
      const number = index + 1;
      return {
        folder: `pertemuan${number}`,
        number,
        isExam: false,
        pagePath: number <= 4 ? `pertemuan${number}/index.html` : "",
        updatedAt: "",
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
    .then((items) => { folders = items; renderFolders(); })
    .catch(() => {
      folders = lastKnownFolders.length ? lastKnownFolders : fallbackFolders();
      renderFolders();
    });
})();