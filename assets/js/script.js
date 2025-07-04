let notes = [];
let editingNoteId = null;
let currentFilter = "all";
const COLOR_THEMES = {
  blue: "#4194e2",
  orange: "#F5871E",
  yellow: "#FCC419",
  green: "#83C70E",
  purple: "#CC5DE8",
  pink: "#ED64C8",
};
function loadNotes() {
  const savedNotes = localStorage.getItem("quickNotes");
  return savedNotes ? JSON.parse(savedNotes) : [];
}
function showCustomAlert(
  title,
  message,
  isConfirmation = false,
  confirmCallback = null
) {
  const alertBox = document.getElementById("customAlert");
  const alertTitle = document.getElementById("alertTitle");
  const alertMessage = document.getElementById("alertMessage");
  const confirmBtn = document.getElementById("confirmAlertBtn");
  const cancelBtn = document.getElementById("cancelAlertBtn");
  const alertButtons = document.querySelector(".alert-buttons");
  alertTitle.textContent = title;
  alertMessage.textContent = message;
  confirmBtn.className = "alert-btn";
  cancelBtn.className = "alert-btn cancel";
  confirmBtn.removeAttribute("style");
  cancelBtn.removeAttribute("style");
  alertTitle.removeAttribute("style");
  const isError = /error|failed|duplicate|no notes/i.test(title.toLowerCase());
  if (isError) {
    alertTitle.style.color = "#e74c3c";
    confirmBtn.classList.add("error");
  } else {
    alertTitle.style.color = getComputedStyle(document.body).getPropertyValue(
      "--brand-color"
    );
    confirmBtn.classList.add("confirm");
  }
  if (isConfirmation) {
    alertButtons.style.display = "flex";
    confirmBtn.textContent = "Confirm";
    confirmBtn.classList.add("error");
    cancelBtn.style.display = "block";
    if (confirmCallback) {
      confirmBtn.onclick = function () {
        confirmCallback();
        closeCustomAlert();
      };
    } else {
      confirmBtn.onclick = closeCustomAlert;
    }
    cancelBtn.onclick = closeCustomAlert;
  } else {
    alertButtons.style.display = "flex";
    confirmBtn.textContent = "OK";
    cancelBtn.style.display = "none";
    confirmBtn.onclick = closeCustomAlert;
  }
  alertBox.classList.remove("hidden");
}
function closeCustomAlert() {
  document.getElementById("customAlert").classList.add("hidden");
}
function saveNote(event) {
  event.preventDefault();
  const title = document.getElementById("noteTitle").value.trim();
  const content = document.getElementById("noteContent").value.trim();
  const keywordsInput = document.getElementById("noteKeywords").value.trim();
  const rawKeywords = keywordsInput
    ? keywordsInput
        .split(",")
        .map((k) => k.trim().toLowerCase())
        .filter(Boolean)
    : [];
  const uniqueKeywords = [...new Set(rawKeywords)];
  const MAX_KEYWORDS = 5;
  if (rawKeywords.length !== uniqueKeywords.length) {
    showCustomAlert(
      "Duplicate Keywords",
      "You have entered duplicate keywords. Only unique keywords will be saved.",
      false
    );
  }
  if (uniqueKeywords.length > MAX_KEYWORDS) {
    showCustomAlert(
      "Too Many Keywords",
      `You can only add up to ${MAX_KEYWORDS} keywords. The first ${MAX_KEYWORDS} will be used.`,
      false
    );
    uniqueKeywords.splice(MAX_KEYWORDS);
  }
  const now = new Date().toISOString();
  if (editingNoteId) {
    const noteIndex = notes.findIndex((note) => note.id === editingNoteId);
    notes[noteIndex] = {
      ...notes[noteIndex],
      title,
      content,
      modifiedAt: now,
      keywords: uniqueKeywords,
    };
  } else {
    notes.unshift({
      id: generateId(),
      title,
      content,
      createdAt: now,
      modifiedAt: now,
      keywords: uniqueKeywords,
      pinned: false,
      archived: false,
    });
  }
  closeNoteDialog();
  saveNotes();
  renderNotes();
  document.getElementById("searchInput").value = "";
}
function generateId() {
  return Date.now().toString();
}
function saveNotes() {
  localStorage.setItem("quickNotes", JSON.stringify(notes));
}
function deleteNote(noteId) {
  notes = notes.filter((note) => note.id !== noteId);
  saveNotes();
  renderNotes();
}
function deleteAllNotes() {
  if (notes.length === 0) {
    showCustomAlert("No Notes", "There are no notes to delete.", false);
    return;
  }
  showCustomAlert(
    "Delete All Notes?",
    "Are you sure you want to delete ALL notes? This action cannot be undone.",
    true,
    function () {
      notes = [];
      saveNotes();
      renderNotes();
    }
  );
}
function togglePin(noteId) {
  const note = notes.find((n) => n.id === noteId);
  if (note) {
    note.pinned = !note.pinned;
    note.modifiedAt = new Date().toISOString();
    saveNotes();
    renderNotes();
  }
}
function toggleArchive(noteId) {
  const note = notes.find((n) => n.id === noteId);
  if (note) {
    note.archived = !note.archived;
    note.modifiedAt = new Date().toISOString();
    saveNotes();
    renderNotes();
  }
}
function renderNotes(filteredNotes) {
  const container = document.getElementById("notesContainer");
  let notesToRender = Array.isArray(filteredNotes) ? filteredNotes : notes;
  if (currentFilter === "statistics") {
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.justifyContent = "center";
    container.style.alignItems = "center";
    const total = notes.length;
    const active = notes.filter((n) => !n.archived).length;
    const archived = notes.filter((n) => n.archived).length;
    const pinned = notes.filter((n) => n.pinned).length;
    const keywords = new Set(notes.flatMap((n) => n.keywords)).size;
    container.innerHTML = ` <div class="stats-view active"> <h2 class="stats-title"> Statistics</h2> <div class="stats-grid"> <div class="stat-card"> <i class="ri-file-list-3-line stat-icon"></i> <h3>Total Notes</h3> <p class="stat-number" data-value="${total}">0</p> </div> <div class="stat-card"> <i class="ri-edit-2-line stat-icon"></i> <h3>Active Notes</h3> <p class="stat-number" data-value="${active}">0</p> </div> <div class="stat-card"> <i class="ri-archive-line stat-icon"></i> <h3>Archived</h3> <p class="stat-number" data-value="${archived}">0</p> </div> <div class="stat-card"> <i class="ri-pushpin-line stat-icon"></i> <h3>Pinned</h3> <p class="stat-number" data-value="${pinned}">0</p> </div> <div class="stat-card"> <i class="ri-price-tag-3-line stat-icon"></i> <h3>Unique Keywords</h3> <p class="stat-number" data-value="${keywords}">0</p> </div> </div> </div> `;
    container.querySelectorAll(".stat-number").forEach((el) => {
      const target = +el.dataset.value;
      let count = 0;
      const step = Math.max(1, Math.floor(target / 30));
      const interval = setInterval(() => {
        count += step;
        if (count >= target) {
          el.textContent = target;
          clearInterval(interval);
        } else {
          el.textContent = count;
        }
      }, 50);
    });
    return;
  }
  if (currentFilter === "archived") {
    notesToRender = notesToRender.filter((note) => note.archived);
  } else {
    notesToRender = notesToRender.filter((note) => !note.archived);
  }
  if (notesToRender.length === 0) {
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.justifyContent = "center";
    container.style.alignItems = "center";
    container.innerHTML = ` <div class="empty-state"> <img class="no-notes-image" src="assets/images/no-item.webp" alt="No Notes" /> <p>${
      currentFilter === "archived"
        ? "<h1>No archived notes found.</h1><br> Create a new note, or archive some existing notes!"
        : "<h1>No notes found.</h1><br> Create your first note to get started!"
    }</p> <button class="add-note-btn" onclick="openNoteDialog()"> <i class="ri-add-line"></i> Add Your First Note </button> </div> `;
    return;
  }
  const sortedNotes = [...notesToRender].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
  container.style.display = "grid";
  container.style.gridTemplateColumns = "repeat(auto-fill, minmax(350px, 1fr))";
  container.style.gap = "1.5rem";
  container.style.alignItems = "start";
  container.style.justifyContent = "center";
  container.style.padding = "1rem";
  container.innerHTML = sortedNotes
    .map(
      (note) =>
        ` <div class="note-card"> <div class="note-body"> <h3 class="note-title"> <i class="pin-icon ri-${
          note.pinned ? "pushpin-fill" : "pushpin-line"
        }" onclick="togglePin('${note.id}')" title="${
          note.pinned ? "Unpin Note" : "Pin Note"
        }" style="cursor: pointer; margin-right: 0.5rem; vertical-align: middle;"></i> ${
          note.title
        } </h3> <hr class="note-separator" /> <p class="note-content">${
          note.content
        }</p> </div> <div class="note-keywords"> ${note.keywords
          .map((kw) => `<span class="keyword-tag">${kw}</span>`)
          .join(
            ""
          )} </div> <div class="note-actions"> <button class="edit-btn" onclick="openNoteDialog('${
          note.id
        }')" title="Edit Note"> <i class="ri-pencil-line"></i> </button> <button class="edit-btn" onclick="toggleArchive('${
          note.id
        }')" title="${
          note.archived ? "Unarchive Note" : "Archive Note"
        }"> <i class="ri-archive-${
          note.archived ? "line" : "fill"
        }"></i> </button> <button class="delete-btn" onclick="deleteNote('${
          note.id
        }')" title="Delete Note"> <i class="ri-delete-bin-6-line"></i> </button> </div> </div> `
    )
    .join("");
}
function filterNotes(query) {
  const lowerQuery = query.toLowerCase().trim();
  if (currentFilter === "statistics") return notes;
  return notes.filter((note) => {
    if (note.archived && currentFilter === "all") return false;
    if (!note.archived && currentFilter === "archived") return false;
    const searchableString = [note.title, note.content, note.keywords.join(" ")]
      .join(" ")
      .toLowerCase();
    return searchableString.includes(lowerQuery);
  });
}
function openNoteDialog(noteId = null) {
  const dialog = document.getElementById("noteDialog");
  const titleInput = document.getElementById("noteTitle");
  const contentInput = document.getElementById("noteContent");
  const keywordsInput = document.getElementById("noteKeywords");
  if (noteId) {
    const noteToEdit = notes.find((note) => note.id === noteId);
    editingNoteId = noteId;
    document.getElementById("dialogTitle").textContent = "Edit Note";
    titleInput.value = noteToEdit.title;
    contentInput.value = noteToEdit.content;
    keywordsInput.value = noteToEdit.keywords.join(", ");
  } else {
    editingNoteId = null;
    document.getElementById("dialogTitle").textContent = "Add New Note";
    titleInput.value = "";
    contentInput.value = "";
    keywordsInput.value = "";
  }
  dialog.showModal();
  titleInput.focus();
}
function closeNoteDialog() {
  document.getElementById("noteDialog").close();
}
function updateThemeIcon() {
  const isDark = document.body.classList.contains("dark-theme");
  const themeBtn = document.getElementById("themeToggleBtn");
  themeBtn.innerHTML = `<i class="ri-${isDark ? "sun" : "moon"}-line"></i>`;
}
function toggleTheme() {
  const isDark = document.body.classList.toggle("dark-theme");
  localStorage.setItem("theme", isDark ? "dark" : "light");
  updateThemeIcon();
}
function applyStoredTheme() {
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-theme");
  }
  updateThemeIcon();
}
function applyStoredColorTheme() {
  const storedColor = localStorage.getItem("colorTheme");
  if (storedColor) {
    document.body.classList.add(`${storedColor}-theme`);
    setActiveColorCircle(storedColor);
    updateFaviconAndLogo(storedColor);
  } else {
    document.body.classList.add("blue-theme");
    setActiveColorCircle("blue");
    updateFaviconAndLogo("blue");
  }
}
function changeColorTheme(colorName) {
  for (const theme in COLOR_THEMES) {
    document.body.classList.remove(`${theme}-theme`);
  }
  document.body.classList.add(`${colorName}-theme`);
  localStorage.setItem("colorTheme", colorName);
  setActiveColorCircle(colorName);
  updateFaviconAndLogo(colorName);
  renderNotes();
}
function setActiveColorCircle(colorName) {
  const colorCircles = document.querySelectorAll(".color-circle");
  colorCircles.forEach((circle) => {
    circle.classList.remove("active");
    if (circle.classList.contains(colorName)) {
      circle.classList.add("active");
    }
  });
}
function updateFaviconAndLogo(colorName) {
  const faviconLink = document.querySelector("link[rel='icon']");
  if (faviconLink) {
    faviconLink.href = `assets/images/logo/favicon-${colorName}.ico`;
  }
  const appLogo = document.getElementById("appLogo");
  if (appLogo) {
    appLogo.src = `assets/images/logo/note-logo-${colorName}.webp`;
  }
}
function setFilter(filterType) {
  currentFilter = filterType;
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.classList.remove("active");
  });
  document
    .querySelector(`.filter-btn[onclick="setFilter('${filterType}')"]`)
    .classList.add("active");
  document.getElementById("searchInput").value = "";
  renderNotes();
}
document.addEventListener("DOMContentLoaded", () => {
  notes = loadNotes();
  renderNotes();
  applyStoredTheme();
  applyStoredColorTheme();
  document.getElementById("noteForm").addEventListener("submit", saveNote);
  document
    .getElementById("themeToggleBtn")
    .addEventListener("click", toggleTheme);
  document.getElementById("noteDialog").addEventListener("click", (event) => {
    if (event.target === event.currentTarget) {
      closeNoteDialog();
    }
  });
  document.getElementById("searchInput").addEventListener("input", (event) => {
    const query = event.target.value.trim();
    if (query === "") {
      renderNotes();
    } else {
      const filtered = filterNotes(query);
      renderNotes(filtered);
    }
  });
  document.getElementById("customAlert").addEventListener("click", (event) => {
    const box = document.getElementById("customAlertBox");
    if (!box.contains(event.target)) {
      closeCustomAlert();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeNoteDialog();
      closeCustomAlert();
    }
  });
  document.getElementById("exportNotesBtn").addEventListener("click", () => {
    if (notes.length === 0) {
      showCustomAlert("No Notes", "There are no notes to export.", false);
      return;
    }
    const dataStr = JSON.stringify(notes, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "quick-notes-export.json";
    a.click();
    URL.revokeObjectURL(url);
  });
  document.getElementById("importNotesBtn").addEventListener("click", () => {
    document.getElementById("importNotesInput").click();
  });
  document
    .getElementById("importNotesInput")
    .addEventListener("change", (event) => {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedNotes = JSON.parse(e.target.result);
          if (!Array.isArray(importedNotes)) {
            throw new Error(
              "Invalid format: JSON should be an array of notes."
            );
          }
          let newNotesCount = 0;
          importedNotes.forEach((note) => {
            if (
              note.id &&
              note.title &&
              note.content &&
              typeof note.createdAt === "string" &&
              typeof note.modifiedAt === "string" &&
              Array.isArray(note.keywords) &&
              typeof note.pinned === "boolean" &&
              typeof note.archived === "boolean"
            ) {
              if (!notes.find((n) => n.id === note.id)) {
                notes.push(note);
                newNotesCount++;
              }
            }
          });
          if (newNotesCount === 0) {
            showCustomAlert(
              "Operation Failed",
              "No new notes were imported (all duplicates).",
              false
            );
          } else {
            showCustomAlert(
              "Operation Succeeded",
              `${newNotesCount} note(s) imported successfully.`,
              false
            );
            saveNotes();
            renderNotes();
          }
        } catch (error) {
          showCustomAlert(
            "Operation Failed",
            "Failed to import notes: Invalid JSON file.",
            false
          );
        }
      };
      reader.readAsText(file);
      event.target.value = "";
    });
  document
    .getElementById("deleteAllNotesBtn")
    .addEventListener("click", deleteAllNotes);
  document.querySelectorAll(".color-circle").forEach((circle) => {
    circle.addEventListener("click", () => {
      const color = circle.dataset.color;
      const colorName = Object.keys(COLOR_THEMES).find(
        (key) => COLOR_THEMES[key] === color
      );
      if (colorName) {
        changeColorTheme(colorName);
      }
    });
  });
});
