let notes = [];
let editingNoteId = null;
let currentFilter = "all"; // 'all' or 'archived'

function loadNotes() {
  const savedNotes = localStorage.getItem("quickNotes");
  return savedNotes ? JSON.parse(savedNotes) : [];
}

function showCustomAlert(title, message) {
  const alertBox = document.getElementById("customAlert");
  const alertTitle = document.getElementById("alertTitle");
  const alertButton = document.getElementById("closeAlertBtn");

  alertTitle.textContent = title;
  document.getElementById("alertMessage").textContent = message;

  // Determine if it's an error or a success/info message
  const isError = /error|duplicate|too many|failed|no notes/i.test(title);

  if (isError) {
    alertTitle.style.color = "#e74c3c";
    alertButton.style.backgroundColor = "#e74c3c";
    alertButton.classList.remove("blue-btn"); // REMOVE hover class for red
  } else {
    alertTitle.style.color = "#62a4e2";
    alertButton.style.backgroundColor = "#62a4e2";
    alertButton.classList.add("blue-btn"); // ADD hover class for blue
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
      "You have entered duplicate keywords. Only unique keywords will be saved."
    );
  }

  if (uniqueKeywords.length > MAX_KEYWORDS) {
    showCustomAlert(
      "Too Many Keywords",
      `You can only add up to ${MAX_KEYWORDS} keywords. The first ${MAX_KEYWORDS} will be used.`
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

  // Filter notes based on current filter (all or archived)
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
    container.innerHTML = `
      <div class="empty-state">
        <img class="no-notes-image" src="assets/images/no-item.webp" alt="No Notes" />
        <p>${currentFilter === "archived"
        ? "<h1>No archived notes found.</h1><br> Create a new note, or archive some existing notes!"
        : "<h1>No notes found.</h1><br> Create your first note to get started!"
      }</p>
        <button class="add-note-btn" onclick="openNoteDialog()">
          <i class="ri-add-line"></i> Add Your First Note
        </button>
      </div>
    `;
    return;
  }

  // Sort pinned first, then newest first
  const sortedNotes = [...notesToRender].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  container.style.display = "grid";
  container.style.gridTemplateColumns = "repeat(auto-fill, minmax(350px, 1fr))";
  container.style.gap = "1.5rem";
  container.style.alignItems = "center";
  container.style.justifyContent = "center";
  container.style.padding = "1rem";

  container.innerHTML = sortedNotes
    .map(
      (note) => `
      <div class="note-card">
        <div class="note-body">
          <h3 class="note-title">
            <i class="pin-icon ri-${note.pinned ? "pushpin-fill" : "pushpin-line"
        }" 
            onclick="togglePin('${note.id}')" 
            title="${note.pinned ? "Unpin Note" : "Pin Note"}"
            style="cursor: pointer; margin-right: 0.5rem; vertical-align: middle;"></i>
            ${note.title}
          </h3>
          <hr class="note-separator" />
          <p class="note-content">${note.content}</p>
        </div>

        <div class="note-keywords">
          ${note.keywords
          .map((kw) => `<span class="keyword-tag">${kw}</span>`)
          .join("")}
        </div>
        <div class="note-actions">
          <button class="edit-btn" onclick="openNoteDialog('${note.id
        }')" title="Edit Note">
            <i class="ri-pencil-line"></i>
          </button>
          <button class="edit-btn" onclick="toggleArchive('${note.id
        }')" title="${note.archived ? "Unarchive Note" : "Archive Note"}">
            <i class="ri-archive-${note.archived ? "line" : "fill"}"></i>
          </button>
          <button class="delete-btn" onclick="deleteNote('${note.id
        }')" title="Delete Note">
            <i class="ri-delete-bin-6-line"></i>
          </button>
        </div>
      </div>
    `
    )
    .join("");
}

function filterNotes(query) {
  const lowerQuery = query.toLowerCase().trim();

  return notes.filter((note) => {
    // Filter out archived notes when in 'all' mode, and vice versa handled in renderNotes()
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

function setFilter(filterType) {
  currentFilter = filterType;

  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.classList.remove("active");
  });

  document
    .querySelector(`.filter-btn[onclick="setFilter('${filterType}')"]`)
    .classList.add("active");

  // Clear search input on filter change
  document.getElementById("searchInput").value = "";

  renderNotes();
}

document.addEventListener("DOMContentLoaded", () => {
  notes = loadNotes();
  renderNotes();
  applyStoredTheme();

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
});

// --- IMPORT / EXPORT NOTES FEATURE ---

document.getElementById("exportNotesBtn").addEventListener("click", () => {
  if (notes.length === 0) {
    showCustomAlert("No Notes", "There are no notes to export.");
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
          throw new Error("Invalid format: JSON should be an array of notes.");
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
            "No new notes were imported (all duplicates)."
          );
        } else {
          showCustomAlert(
            "Operation Succeeded",
            `${newNotesCount} note(s) imported successfully.`
          );
          saveNotes();
          renderNotes();
        }
      } catch (error) {
        showCustomAlert(
          "Operation Failed",
          "Failed to import notes: Invalid JSON file."
        );
      }
    };
    reader.readAsText(file);

    event.target.value = "";
  });
