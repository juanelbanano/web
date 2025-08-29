// Simulación de base de datos local
let users = [
  { id: 1, name: "Administrador", email: "admin@techlog.com", password: "admin123", role: "admin" },
  { id: 2, name: "Usuario Demo", email: "user@demo.com", password: "demo123", role: "user" },
]

let parcels = [
  {
    id: 1,
    recipient: "Juan Pérez",
    address: "Av. Principal 123",
    weight: 2.5,
    status: "Entregado",
    userId: 2,
    createdAt: "2024-01-15",
  },
  {
    id: 2,
    recipient: "María García",
    address: "Calle Secundaria 456",
    weight: 1.2,
    status: "En Tránsito",
    userId: 2,
    createdAt: "2024-01-16",
  },
  {
    id: 3,
    recipient: "Carlos López",
    address: "Plaza Central 789",
    weight: 3.8,
    status: "Procesando",
    userId: 2,
    createdAt: "2024-01-17",
  },
]

let fileSystem = {
  folders: [
    { id: 1, name: "Documentos", parentId: null, createdAt: "2024-01-15" },
    { id: 2, name: "Reportes", parentId: null, createdAt: "2024-01-16" },
    { id: 3, name: "Contratos", parentId: 1, createdAt: "2024-01-17" },
  ],
  files: [
    {
      id: 1,
      name: "Manual_Usuario.pdf",
      folderId: 1,
      size: "2.5 MB",
      type: "pdf",
      uploadedAt: "2024-01-15",
      uploadedBy: "admin@techlog.com",
    },
    {
      id: 2,
      name: "Reporte_Mensual.xlsx",
      folderId: 2,
      size: "1.2 MB",
      type: "excel",
      uploadedAt: "2024-01-16",
      uploadedBy: "admin@techlog.com",
    },
    {
      id: 3,
      name: "Contrato_Servicios.docx",
      folderId: 3,
      size: "856 KB",
      type: "word",
      uploadedAt: "2024-01-17",
      uploadedBy: "admin@techlog.com",
    },
  ],
}

let currentFolder = null
let viewMode = "list"

let currentUser = null

// Funciones de autenticación
function login(email, password) {
  const user = users.find((u) => u.email === email && u.password === password)
  if (user) {
    currentUser = user
    localStorage.setItem("currentUser", JSON.stringify(user))
    return true
  }
  return false
}

function register(name, email, password) {
  if (users.find((u) => u.email === email)) {
    return false // Usuario ya existe
  }

  const newUser = {
    id: users.length + 1,
    name,
    email,
    password,
    role: "user",
  }

  users.push(newUser)
  localStorage.setItem("users", JSON.stringify(users))
  return true
}

function logout() {
  currentUser = null
  localStorage.removeItem("currentUser")
  window.location.href = "index.html"
}

function checkAuth() {
  const stored = localStorage.getItem("currentUser")
  if (stored) {
    currentUser = JSON.parse(stored)
    return true
  }
  return false
}

// Funciones de encomiendas
function createParcel(recipient, address, weight, status) {
  if (!currentUser) return false

  const newParcel = {
    id: parcels.length + 1,
    recipient,
    address,
    weight: Number.parseFloat(weight),
    status,
    userId: currentUser.id,
    createdAt: new Date().toISOString().split("T")[0],
  }

  parcels.push(newParcel)
  localStorage.setItem("parcels", JSON.stringify(parcels))
  return true
}

function getUserParcels() {
  if (!currentUser) return []
  return parcels.filter((p) => p.userId === currentUser.id)
}

function updateStats() {
  const userParcels = getUserParcels()
  const delivered = userParcels.filter((p) => p.status === "Entregado").length
  const transit = userParcels.filter((p) => p.status === "En Tránsito").length
  const processing = userParcels.filter((p) => p.status === "Procesando").length

  document.getElementById("totalParcels").textContent = userParcels.length
  document.getElementById("deliveredParcels").textContent = delivered
  document.getElementById("pendingParcels").textContent = transit
  document.getElementById("processingParcels").textContent = processing
}

function renderParcels() {
  const container = document.getElementById("parcelsList")
  if (!container) return

  const userParcels = getUserParcels()

  if (userParcels.length === 0) {
    container.innerHTML = '<p class="text-muted">No tienes encomiendas registradas.</p>'
    return
  }

  container.innerHTML = userParcels
    .map(
      (parcel) => `
        <div class="parcel-item">
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <h6 class="mb-1">${parcel.recipient}</h6>
                    <small class="text-muted">${parcel.address}</small>
                    <br>
                    <small class="text-muted">${parcel.weight} kg - ${parcel.createdAt}</small>
                </div>
                <span class="status-badge status-${parcel.status.toLowerCase().replace(" ", "")}">${parcel.status}</span>
            </div>
        </div>
    `,
    )
    .join("")
}

function createFolder() {
  const folderName = document.getElementById("newFolderName").value.trim()
  if (!folderName) {
    alert("Por favor ingresa un nombre para la carpeta")
    return
  }

  const newFolder = {
    id: fileSystem.folders.length + 1,
    name: folderName,
    parentId: currentFolder,
    createdAt: new Date().toISOString().split("T")[0],
  }

  fileSystem.folders.push(newFolder)
  localStorage.setItem("fileSystem", JSON.stringify(fileSystem))

  document.getElementById("newFolderName").value = ""
  updateFolderSelect()
  renderFiles()

  alert("Carpeta creada exitosamente")
}

function uploadFiles() {
  const fileInput = document.getElementById("fileUpload")
  const selectedFolder = document.getElementById("folderSelect").value

  if (fileInput.files.length === 0) {
    alert("Por favor selecciona al menos un archivo")
    return
  }

  Array.from(fileInput.files).forEach((file) => {
    const fileExtension = file.name.split(".").pop().toLowerCase()
    let fileType = "document"

    if (["pdf"].includes(fileExtension)) fileType = "pdf"
    else if (["xlsx", "xls"].includes(fileExtension)) fileType = "excel"
    else if (["docx", "doc"].includes(fileExtension)) fileType = "word"
    else if (["jpg", "jpeg", "png", "gif"].includes(fileExtension)) fileType = "image"

    const newFile = {
      id: fileSystem.files.length + 1,
      name: file.name,
      folderId: selectedFolder === "root" ? null : Number.parseInt(selectedFolder),
      size: formatFileSize(file.size),
      type: fileType,
      uploadedAt: new Date().toISOString().split("T")[0],
      uploadedBy: currentUser.email,
    }

    fileSystem.files.push(newFile)
  })

  localStorage.setItem("fileSystem", JSON.stringify(fileSystem))
  fileInput.value = ""
  renderFiles()

  alert(`${fileInput.files.length} archivo(s) subido(s) exitosamente`)
}

function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

function getFileIcon(type) {
  const icons = {
    pdf: "bi-file-earmark-pdf text-danger",
    excel: "bi-file-earmark-excel text-success",
    word: "bi-file-earmark-word text-primary",
    image: "bi-file-earmark-image text-info",
    document: "bi-file-earmark text-secondary",
  }
  return icons[type] || icons.document
}

function navigateToFolder(folderId) {
  currentFolder = folderId === "root" ? null : Number.parseInt(folderId)
  renderFiles()
  updateBreadcrumb()
}

function updateBreadcrumb() {
  const breadcrumb = document.getElementById("breadcrumb")
  const path = []
  let folder = currentFolder

  while (folder) {
    const folderObj = fileSystem.folders.find((f) => f.id === folder)
    if (folderObj) {
      path.unshift(folderObj)
      folder = folderObj.parentId
    } else {
      break
    }
  }

  breadcrumb.innerHTML = `
    <li class="breadcrumb-item"><a href="#" onclick="navigateToFolder('root')">Inicio</a></li>
    ${path.map((f) => `<li class="breadcrumb-item active">${f.name}</li>`).join("")}
  `
}

function updateFolderSelect() {
  const select = document.getElementById("folderSelect")
  if (!select) return

  const folders = fileSystem.folders.filter((f) => f.parentId === currentFolder)

  select.innerHTML = '<option value="root">Raíz</option>'
  folders.forEach((folder) => {
    select.innerHTML += `<option value="${folder.id}">${folder.name}</option>`
  })
}

function toggleView(mode) {
  viewMode = mode
  const container = document.getElementById("filesContainer")
  const gridBtn = document.getElementById("gridViewBtn")
  const listBtn = document.getElementById("listViewBtn")

  if (mode === "grid") {
    container.className = "files-grid-view"
    gridBtn.classList.add("active")
    listBtn.classList.remove("active")
  } else {
    container.className = "files-list-view"
    listBtn.classList.add("active")
    gridBtn.classList.remove("active")
  }

  renderFiles()
}

function renderFiles() {
  const container = document.getElementById("filesContainer")
  if (!container) return

  const folders = fileSystem.folders.filter((f) => f.parentId === currentFolder)
  const files = fileSystem.files.filter((f) => f.folderId === currentFolder)

  if (folders.length === 0 && files.length === 0) {
    container.innerHTML = '<p class="text-muted text-center py-4">Esta carpeta está vacía</p>'
    return
  }

  let html = ""

  // Renderizar carpetas
  folders.forEach((folder) => {
    if (viewMode === "grid") {
      html += `
        <div class="file-item file-grid-item" onclick="navigateToFolder(${folder.id})">
          <div class="file-icon">
            <i class="bi bi-folder-fill text-warning"></i>
          </div>
          <div class="file-info">
            <div class="file-name">${folder.name}</div>
            <div class="file-meta">Carpeta</div>
          </div>
        </div>
      `
    } else {
      html += `
        <div class="file-item file-list-item" onclick="navigateToFolder(${folder.id})">
          <div class="file-icon">
            <i class="bi bi-folder-fill text-warning"></i>
          </div>
          <div class="file-info">
            <div class="file-name">${folder.name}</div>
            <div class="file-meta">Carpeta • ${folder.createdAt}</div>
          </div>
          <div class="file-actions">
            <button class="btn btn-sm btn-outline-danger" onclick="event.stopPropagation(); deleteFolder(${folder.id})">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>
      `
    }
  })

  // Renderizar archivos
  files.forEach((file) => {
    if (viewMode === "grid") {
      html += `
        <div class="file-item file-grid-item">
          <div class="file-icon">
            <i class="bi ${getFileIcon(file.type)}"></i>
          </div>
          <div class="file-info">
            <div class="file-name">${file.name}</div>
            <div class="file-meta">${file.size}</div>
          </div>
        </div>
      `
    } else {
      html += `
        <div class="file-item file-list-item">
          <div class="file-icon">
            <i class="bi ${getFileIcon(file.type)}"></i>
          </div>
          <div class="file-info">
            <div class="file-name">${file.name}</div>
            <div class="file-meta">${file.size} • ${file.uploadedAt} • ${file.uploadedBy}</div>
          </div>
          <div class="file-actions">
            <button class="btn btn-sm btn-outline-primary me-1" onclick="downloadFile(${file.id})">
              <i class="bi bi-download"></i>
            </button>
            ${
              currentUser && currentUser.role === "admin"
                ? `
              <button class="btn btn-sm btn-outline-danger" onclick="deleteFile(${file.id})">
                <i class="bi bi-trash"></i>
              </button>
            `
                : ""
            }
          </div>
        </div>
      `
    }
  })

  container.innerHTML = html
}

function deleteFolder(folderId) {
  if (confirm("¿Estás seguro de que quieres eliminar esta carpeta y todo su contenido?")) {
    // Eliminar archivos de la carpeta
    fileSystem.files = fileSystem.files.filter((f) => f.folderId !== folderId)

    // Eliminar subcarpetas recursivamente
    const subfolders = fileSystem.folders.filter((f) => f.parentId === folderId)
    subfolders.forEach((subfolder) => deleteFolder(subfolder.id))

    // Eliminar la carpeta
    fileSystem.folders = fileSystem.folders.filter((f) => f.id !== folderId)

    localStorage.setItem("fileSystem", JSON.stringify(fileSystem))
    renderFiles()
    updateFolderSelect()
  }
}

function deleteFile(fileId) {
  if (confirm("¿Estás seguro de que quieres eliminar este archivo?")) {
    fileSystem.files = fileSystem.files.filter((f) => f.id !== fileId)
    localStorage.setItem("fileSystem", JSON.stringify(fileSystem))
    renderFiles()
  }
}

function downloadFile(fileId) {
  const file = fileSystem.files.find((f) => f.id === fileId)
  if (file) {
    alert(`Descargando: ${file.name}\n(En una aplicación real, esto iniciaría la descarga del archivo)`)
  }
}

// Event listeners
document.addEventListener("DOMContentLoaded", () => {
  // Cargar datos del localStorage
  const storedUsers = localStorage.getItem("users")
  if (storedUsers) {
    users = JSON.parse(storedUsers)
  }

  const storedParcels = localStorage.getItem("parcels")
  if (storedParcels) {
    parcels = JSON.parse(storedParcels)
  }

  const storedFileSystem = localStorage.getItem("fileSystem")
  if (storedFileSystem) {
    fileSystem = JSON.parse(storedFileSystem)
  }

  // Verificar autenticación en páginas protegidas
  if (window.location.pathname.includes("dashboard.html")) {
    if (!checkAuth()) {
      window.location.href = "login.html"
      return
    }

    document.getElementById("userName").textContent = currentUser.name

    if (currentUser.role === "admin") {
      document.getElementById("fileManagementSection").style.display = "block"
    }

    updateStats()
    renderParcels()
    updateFolderSelect()
    renderFiles()
  }

  // Formulario de login
  const loginForm = document.getElementById("loginForm")
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault()
      const email = document.getElementById("email").value
      const password = document.getElementById("password").value

      if (login(email, password)) {
        window.location.href = "dashboard.html"
      } else {
        alert("Credenciales incorrectas")
      }
    })
  }

  // Formulario de registro
  const registerForm = document.getElementById("registerForm")
  if (registerForm) {
    registerForm.addEventListener("submit", (e) => {
      e.preventDefault()
      const name = document.getElementById("name").value
      const email = document.getElementById("email").value
      const password = document.getElementById("password").value
      const confirmPassword = document.getElementById("confirmPassword").value

      if (password !== confirmPassword) {
        alert("Las contraseñas no coinciden")
        return
      }

      if (register(name, email, password)) {
        alert("Registro exitoso. Ahora puedes iniciar sesión.")
        window.location.href = "login.html"
      } else {
        alert("El email ya está registrado")
      }
    })
  }

  // Formulario de nueva encomienda
  const parcelForm = document.getElementById("parcelForm")
  if (parcelForm) {
    parcelForm.addEventListener("submit", (e) => {
      e.preventDefault()
      const recipient = document.getElementById("recipient").value
      const address = document.getElementById("address").value
      const weight = document.getElementById("weight").value
      const status = document.getElementById("status").value

      if (createParcel(recipient, address, weight, status)) {
        alert("Encomienda creada exitosamente")
        parcelForm.reset()
        updateStats()
        renderParcels()
      } else {
        alert("Error al crear la encomienda")
      }
    })
  }

  // Event listeners para el sistema de archivos
  const folderForm = document.getElementById("folderForm")
  if (folderForm) {
    folderForm.addEventListener("submit", (e) => {
      e.preventDefault()
      createFolder()
    })
  }

  const fileUploadForm = document.getElementById("fileUploadForm")
  if (fileUploadForm) {
    fileUploadForm.addEventListener("submit", (e) => {
      e.preventDefault()
      uploadFiles()
    })
  }

  const gridViewBtn = document.getElementById("gridViewBtn")
  if (gridViewBtn) {
    gridViewBtn.addEventListener("click", () => {
      toggleView("grid")
    })
  }

  const listViewBtn = document.getElementById("listViewBtn")
  if (listViewBtn) {
    listViewBtn.addEventListener("click", () => {
      toggleView("list")
    })
  }
})
