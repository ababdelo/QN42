let notes = []
let editingNoteId = null

function loadNotes() {
  const savedNotes = localStorage.getItem('quickNotes')
  return savedNotes ? JSON.parse(savedNotes) : []
}

function saveNote(event) {
  event.preventDefault()

  const title = document.getElementById('noteTitle').value.trim()
  const content = document.getElementById('noteContent').value.trim()

  if (editingNoteId) {
    const noteIndex = notes.findIndex(note => note.id === editingNoteId)
    notes[noteIndex] = {
      ...notes[noteIndex],
      title,
      content
    }
  } else {
    notes.unshift({
      id: generateId(),
      title,
      content
    })
  }

  closeNoteDialog()
  saveNotes()
  renderNotes()
}

function generateId() {
  return Date.now().toString()
}

function saveNotes() {
  localStorage.setItem('quickNotes', JSON.stringify(notes))
}

function deleteNote(noteId) {
  notes = notes.filter(note => note.id !== noteId)
  saveNotes()
  renderNotes()
}

function renderNotes() {
  const container = document.getElementById('notesContainer')
  const wrapper = document.getElementById('mainWrapper')

  if (notes.length === 0) {
    // Switch to flex layout for empty state
    container.style.display = 'flex'
    container.style.flexDirection = 'column'
    container.style.justifyContent = 'center'
    container.style.alignItems = 'center'
    container.innerHTML = `
      <div class="empty-state">
        <img class="no-notes-image" src="assets/images/no-item.webp" alt="No Notes" />
        <p>Create your first note to get started!</p>
        <button class="add-note-btn" onclick="openNoteDialog()">
          <i class="ri-add-line"></i> Add Your First Note
        </button>
      </div>
    `
  } else {
    // Switch back to grid layout for displaying notes
    container.style.display = 'grid'
    container.style.gridTemplateColumns = 'repeat(auto-fill, minmax(300px, 1fr))'
    container.style.gap = '1.5rem'
    container.style.alignItems = 'center'
    container.style.justifyContent = 'center'
    container.style.padding = '1rem'

    container.innerHTML = notes.map(note => `
      <div class="note-card">
        <h3 class="note-title">${note.title}</h3>
        <p class="note-content">${note.content}</p>
        <div class="note-actions">
          <button class="edit-btn" onclick="openNoteDialog('${note.id}')" title="Edit Note">
            <i class="ri-pencil-line"></i>
          </button>
          <button class="delete-btn" onclick="deleteNote('${note.id}')" title="Delete Note">
            <i class="ri-delete-bin-6-line"></i>
          </button>
        </div>
      </div>
    `).join('')
  }
}

function openNoteDialog(noteId = null) {
  const dialog = document.getElementById('noteDialog')
  const titleInput = document.getElementById('noteTitle')
  const contentInput = document.getElementById('noteContent')

  if (noteId) {
    const noteToEdit = notes.find(note => note.id === noteId)
    editingNoteId = noteId
    document.getElementById('dialogTitle').textContent = 'Edit Note'
    titleInput.value = noteToEdit.title
    contentInput.value = noteToEdit.content
  } else {
    editingNoteId = null
    document.getElementById('dialogTitle').textContent = 'Add New Note'
    titleInput.value = ''
    contentInput.value = ''
  }

  dialog.showModal()
  titleInput.focus()
}

function closeNoteDialog() {
  document.getElementById('noteDialog').close()
}

function updateThemeIcon() {
  const isDark = document.body.classList.contains('dark-theme')
  const themeBtn = document.getElementById('themeToggleBtn')
  themeBtn.innerHTML = `<i class="ri-${isDark ? 'sun' : 'moon'}-line"></i>`
}

function toggleTheme() {
  const isDark = document.body.classList.toggle('dark-theme')
  localStorage.setItem('theme', isDark ? 'dark' : 'light')
  updateThemeIcon()
}

function applyStoredTheme() {
  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-theme')
  }
  updateThemeIcon()
}

document.addEventListener('DOMContentLoaded', () => {
  notes = loadNotes()
  renderNotes()
  applyStoredTheme()

  document.getElementById('noteForm').addEventListener('submit', saveNote)
  document.getElementById('themeToggleBtn').addEventListener('click', toggleTheme)

  document.getElementById('noteDialog').addEventListener('click', (event) => {
    if (event.target === event.currentTarget) {
      closeNoteDialog()
    }
  })
})
