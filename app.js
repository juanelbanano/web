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

  // Verificar autenticación en páginas protegidas
  if (window.location.pathname.includes("dashboard.html")) {
    if (!checkAuth()) {
      window.location.href = "login.html"
      return
    }

    document.getElementById("userName").textContent = currentUser.name
    updateStats()
    renderParcels()
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
})
