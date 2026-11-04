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
  const cacheKey = "repository-task-folders-v4";
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

  const readPageTitle = async (path) => {
    const url = `https://raw.githubusercontent.com/${owner}/${repository}/${branch}/${path}`;
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) return "";
      const source = await response.text();
      const page = new DOMParser().parseFromString(source, "text/html");
      const heading = page.querySelector("main h1, h1");
      const title = (heading?.textContent || page.title || "").replace(/\s+/g, " ").trim();
      return /^(doc|document|untitled)$/i.test(title) ? "" : title;
    } catch {
      return "";
    }
  };

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
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        const saved = JSON.parse(cached);
        if (Date.now() - saved.savedAt < 60000 && Array.isArray(saved.folders)) return saved.folders;
      } catch {
        sessionStorage.removeItem(cacheKey);
      }
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

    const loaded = await Promise.all(candidates.map(async (item) => {
      const [title, updatedAt] = await Promise.all([
        item.pagePath ? readPageTitle(item.pagePath) : Promise.resolve(""),
        readFolderUpdate(item.folder),
      ]);
      return { ...item, title, updatedAt };
    }));
    loaded.sort((a, b) => {
      const timeA = Date.parse(a.updatedAt) || 0;
      const timeB = Date.parse(b.updatedAt) || 0;
      return timeB - timeA || a.folder.localeCompare(b.folder, "en", { numeric: true });
    });
    try { sessionStorage.setItem(cacheKey, JSON.stringify({ savedAt: Date.now(), folders: loaded })); } catch {}
    return loaded;
  };

  const fallbackFolders = () => [
    { folder: "folder_ujian", number: null, isExam: true, pagePath: "folder_ujian/UTS-PW-NIM/index.html", title: "BF Comunitas", updatedAt: "" },
    ...Array.from({ length: 16 }, (_, index) => {
      const number = index + 1;
      return {
        folder: `pertemuan${number}`,
        number,
        isExam: false,
        pagePath: number <= 4 ? `pertemuan${number}/index.html` : "",
        title: number === 2 ? "Profil Mahasiswa" : number === 3 ? "Contoh Formulir" : `Pertemuan ${number}`,
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

      const details = document.createElement("span");
      details.className = "meeting-details";
      const label = document.createElement("span");
      label.className = "label";
      label.textContent = item.title || item.folder;
      details.append(label);
      if (item.updatedAt) {
        const date = new Date(item.updatedAt);
        const updated = document.createElement("small");
        updated.className = "meeting-updated";
        updated.textContent = `${isEnglish ? "Updated" : "Diperbarui"} ${new Intl.DateTimeFormat(isEnglish ? "en-US" : "id-ID", { dateStyle: "medium" }).format(date)}`;
        details.append(updated);
      }

      const arrow = document.createElement("span");
      arrow.className = "arrow";
      arrow.setAttribute("aria-hidden", "true");
      arrow.textContent = "›";
      button.append(badge, details, arrow);
      button.setAttribute("aria-label", `${label.textContent} — ${isEnglish ? "open folder" : "buka folder"}`);
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
    .catch(() => { folders = fallbackFolders(); renderFolders(); });
})();