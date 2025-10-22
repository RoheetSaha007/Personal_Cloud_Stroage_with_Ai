// ============================================
// CLOUDVAULT - PREMIUM INTERACTIVE SCRIPT
// Enhanced Animations & Particle Effects
// ============================================

// --- CONFIG ---
const API_URL = "http://127.0.0.1:8000"
const feather = window.feather // Declare feather variable

class UserManager {
  constructor() {
    this.currentUser = {
      id: "roheet-001",
      name: "ROHEET",
      email: "roheetsaha2955@gmail.com",
      createdAt: new Date().toISOString(),
    }
  }

  getUserData() {
    return this.currentUser
  }
}

const userManager = new UserManager()

// --- ENHANCED PARTICLE SYSTEM ---
class ParticleSystem {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext("2d")
    this.particles = []
    this.resizeCanvas()
    window.addEventListener("resize", () => this.resizeCanvas())
    this.animate()
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth
    this.canvas.height = window.innerHeight
  }

  createParticles() {
    const particleCount = Math.floor(window.innerWidth / 45)
    const colors = ["#10b981", "#f59e0b", "#f43f5e", "#059669"]

    for (let i = 0; i < particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        radius: Math.random() * 2,
        opacity: Math.random() * 0.6 + 0.2,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: Math.random() * 100 + 50,
        maxLife: 150,
      })
    }
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    if (this.particles.length === 0) {
      this.createParticles()
    }

    this.particles.forEach((particle, index) => {
      particle.x += particle.vx
      particle.y += particle.vy
      particle.life--

      if (particle.x < 0 || particle.x > this.canvas.width) particle.vx *= -1
      if (particle.y < 0 || particle.y > this.canvas.height) particle.vy *= -1

      const fadeOpacity = particle.opacity * (particle.life / particle.maxLife)
      this.ctx.fillStyle = particle.color
      this.ctx.globalAlpha = fadeOpacity
      this.ctx.beginPath()
      this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
      this.ctx.fill()

      if (particle.life <= 0) {
        this.particles.splice(index, 1)
      }
    })

    this.ctx.globalAlpha = 1
    requestAnimationFrame(() => this.animate())
  }
}

// Initialize particle system
const particleCanvas = document.getElementById("particle-canvas")
if (particleCanvas) {
  new ParticleSystem(particleCanvas)
}

// --- Added scroll progress indicator ---
window.addEventListener("scroll", () => {
  const scrollIndicator = document.querySelector(".scroll-indicator")
  const scrollPercentage = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
  if (scrollIndicator) {
    scrollIndicator.style.width = scrollPercentage + "%"
  }
})

// --- DOM ELEMENTS ---
const headerNav = document.querySelector("header nav")
const tabButtons = document.querySelectorAll("header nav button[data-tab]")
const tabContents = document.querySelectorAll(".tab-content")

// Dashboard Elements
const statsTotalFiles = document.getElementById("total-files")
const statsTotalStorage = document.getElementById("total-storage")
const statsFileTypes = document.getElementById("file-types")

// Upload Elements
const uploadArea = document.querySelector(".upload-area-premium")
const fileInput = document.getElementById("file-input")
const browseButton = document.getElementById("browse-button")
const uploadProgressContainer = document.getElementById("upload-progress-container")
const uploadFilename = document.getElementById("upload-filename")
const uploadProgressBar = document.getElementById("upload-progress-bar")
const uploadPercentage = document.getElementById("upload-percentage")
const uploadResult = document.getElementById("upload-result")

// Files Elements
const searchInput = document.getElementById("search-input")
const searchButton = document.getElementById("search-button")
const fileListContainer = document.getElementById("file-list")

const previewModal = document.getElementById("preview-modal")
const previewImage = document.getElementById("preview-image")
const previewFilename = document.getElementById("preview-filename")
const previewSummary = document.getElementById("preview-summary")
const previewCloseBtn = document.getElementById("preview-close")

// PDF Preview Elements
const pdfModal = document.getElementById("pdf-preview-modal")
const pdfFilename = document.getElementById("pdf-preview-filename")
const pdfCloseBtn = document.getElementById("pdf-preview-close")

// --- ENHANCED COUNTER ANIMATION ---
function animateCounter(element, target, duration = 1200) {
  const start = 0
  const increment = target / (duration / 16)
  let current = start

  const counter = setInterval(() => {
    current += increment
    if (current >= target) {
      element.textContent = target
      clearInterval(counter)
      element.style.animation = "pulse-number 0.6s ease-out"
    } else {
      element.textContent = Math.floor(current)
    }
  }, 16)
}

const style = document.createElement("style")
style.textContent = `
  @keyframes pulse-number {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
  }
`
document.head.appendChild(style)

async function fetchStats() {
  try {
    const response = await fetch(`${API_URL}/stats`)
    if (!response.ok) throw new Error("Failed to fetch stats")
    const stats = await response.json()
    updateStatsUI(stats)
  } catch (error) {
    console.error("Error fetching stats:", error)
    if (statsFileTypes) statsFileTypes.textContent = "Error loading stats"
  }
}

async function fetchFiles(query = null) {
  if (!fileListContainer) return
  fileListContainer.innerHTML = '<p class="loading-msg">Loading files...</p>'

  try {
    let url = `${API_URL}/files`
    if (query) {
      url = `${API_URL}/search?q=${encodeURIComponent(query)}`
    }

    const response = await fetch(url)
    if (!response.ok) throw new Error("Failed to fetch files")
    const files = await response.json()

    renderFiles(files, query)
  } catch (error) {
    console.error("Error fetching files:", error)
    fileListContainer.innerHTML =
      '<p class="error-msg">Error loading files. Make sure backend is running on http://127.0.0.1:8000</p>'
  }
}

async function handleDelete(fileId, fileName) {
  if (!confirm(`Are you sure you want to delete "${fileName}"?`)) {
    return
  }
  try {
    const response = await fetch(`${API_URL}/files/${fileId}`, {
      method: "DELETE",
    })

    if (!response.ok) throw new Error("Failed to delete file")

    fetchFiles(searchInput.value.trim() || null)
    fetchStats()
  } catch (error) {
    console.error("Error deleting file:", error)
    alert("Failed to delete file.")
  }
}

function handleUpload(file) {
  if (!file) return

  const formData = new FormData()
  formData.append("file", file)

  uploadFilename.textContent = file.name
  uploadProgressBar.style.width = "0%"
  uploadPercentage.textContent = "0%"
  uploadResult.textContent = ""
  uploadProgressContainer.style.display = "block"

  const xhr = new XMLHttpRequest()

  xhr.upload.addEventListener("progress", (e) => {
    if (e.lengthComputable) {
      const percentage = Math.round((e.loaded / e.total) * 100)
      uploadProgressBar.style.width = `${percentage}%`
      uploadPercentage.textContent = `${percentage}%`
    }
  })

  xhr.addEventListener("load", () => {
    uploadProgressContainer.style.display = "none"
    if (xhr.status >= 200 && xhr.status < 300) {
      try {
        const result = JSON.parse(xhr.responseText)
        uploadResult.innerHTML = `<span style="color:var(--accent-emerald);">✓ Upload Successful!</span> Summary: ${escapeHtml(result.summary)}, Tags: ${result.tags.join(", ")}`
        fetchFiles()
        fetchStats()
      } catch (e) {
        uploadResult.innerHTML = `<span style="color:var(--accent-rose);">Error: Invalid response from server.</span>`
      }
    } else {
      uploadResult.innerHTML = `<span style="color:var(--accent-rose);">Upload failed. Status: ${xhr.status}</span>`
    }
  })

  xhr.addEventListener("error", () => {
    uploadProgressContainer.style.display = "none"
    uploadResult.innerHTML = `<span style="color:var(--accent-rose);">Upload failed. Network error.</span>`
  })

  xhr.open("POST", `${API_URL}/upload`)
  xhr.send(formData)
}

// --- UI UPDATE FUNCTIONS ---
function updateStatsUI(stats) {
  if (statsTotalFiles) {
    const fileCount = stats.total_files ?? 0
    animateCounter(statsTotalFiles, fileCount)
  }
  if (statsTotalStorage) {
    const storageUsed = stats.total_mb_used ?? 0
    statsTotalStorage.textContent = `${storageUsed.toFixed(2)} MB`
  }

  const types =
    stats.file_type_counts && Object.keys(stats.file_type_counts).length > 0
      ? Object.entries(stats.file_type_counts)
          .map(([type, count]) => `${count} ${type}(s)`)
          .join(", ")
      : "No files yet"

  if (statsFileTypes) statsFileTypes.textContent = types
}

// PDF Preview functionality
let pdfDoc = null
let currentPage = 1

async function openPDFPreview(fileId, fileName) {
  const pdfModal = document.getElementById("pdf-preview-modal")
  const pdfFilename = document.getElementById("pdf-preview-filename")

  pdfFilename.textContent = fileName
  pdfModal.classList.add("active")

  try {
    const response = await fetch(`${API_URL}/download/${fileId}`)
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)

    // Load PDF using canvas rendering
    const fileReader = new FileReader()
    fileReader.onload = async (e) => {
      const typedarray = new Uint8Array(e.target.result)
      // Note: This requires PDF.js library - for now we'll show a message
      const canvas = document.getElementById("pdf-canvas")
      const ctx = canvas.getContext("2d")
      canvas.width = 600
      canvas.height = 800
      ctx.fillStyle = "#1a1f2e"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = "#10b981"
      ctx.font = "20px Arial"
      ctx.textAlign = "center"
      ctx.fillText("PDF Preview", canvas.width / 2, 50)
      ctx.fillStyle = "#a0aec0"
      ctx.font = "14px Arial"
      ctx.fillText("PDF file: " + fileName, canvas.width / 2, 100)
      ctx.fillText("Click download button to view full PDF", canvas.width / 2, 150)
    }
    fileReader.readAsArrayBuffer(blob)
  } catch (error) {
    console.error("Error loading PDF:", error)
  }
}

function closePDFPreview() {
  const pdfModal = document.getElementById("pdf-preview-modal")
  pdfModal.classList.remove("active")
  pdfDoc = null
  currentPage = 1
}

function renderFiles(files, currentQuery) {
  if (!fileListContainer) return
  if (!files || files.length === 0) {
    fileListContainer.innerHTML = `<p class="info-msg">${currentQuery ? "No files match your search." : "No files found. Try uploading some!"}</p>`
    return
  }

  fileListContainer.innerHTML = ""

  files.forEach((file, index) => {
    const fileItem = document.createElement("div")
    fileItem.className = "file-item"
    fileItem.style.animationDelay = `${index * 0.08}s`

    const isImage = file.content_type && file.content_type.startsWith("image/")
    const isPDF = file.content_type && file.content_type.includes("pdf")
    const isPreviewable = isImage || isPDF

    const iconHtml = isImage
      ? `<img src="${API_URL}/preview/${file.id}" alt="Preview" loading="lazy" class="preview-thumbnail">`
      : `<span class="file-emoji-icon">${getFileIconEmoji(file.content_type)}</span>`

    const tagsHtml =
      file.tags && Array.isArray(file.tags) ? file.tags.map((tag) => `<span>#${escapeHtml(tag)}</span>`).join("") : ""

    fileItem.innerHTML = `
            <div class="file-item-header">
                <div class="file-item-icon ${isPreviewable ? "preview-trigger" : ""}" data-file-id="${file.id}" data-file-name="${escapeHtml(file.name)}" data-file-summary="${escapeHtml(file.summary || "")}" data-file-type="${file.content_type || ""}">${iconHtml}</div>
                <div class="file-item-actions">
                    <a href="${API_URL}/download/${file.id}" download="${escapeHtml(file.name)}" class="download-button" title="Download File">
                        <i data-feather="download"></i>
                    </a>
                    <button class="delete-button" data-id="${file.id}" data-name="${escapeHtml(file.name)}" title="Delete File">
                        <i data-feather="trash-2"></i>
                    </button>
                </div>
            </div>
            <div class="file-item-info">
                <h4>${escapeHtml(file.name)}</h4>
                <p>${escapeHtml(file.summary || "File uploaded successfully")}</p>
            </div>
            <div class="file-item-tags">${tagsHtml}</div>
        `
    fileListContainer.appendChild(fileItem)
  })

  const previewTriggers = fileListContainer.querySelectorAll(".preview-trigger")
  previewTriggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const fileId = trigger.getAttribute("data-file-id")
      const fileName = trigger.getAttribute("data-file-name")
      const fileSummary = trigger.getAttribute("data-file-summary")
      const fileType = trigger.getAttribute("data-file-type")

      if (fileType && fileType.includes("pdf")) {
        openPDFPreview(fileId, fileName)
      } else {
        openPreview(fileId, fileName, fileSummary)
      }
    })
  })

  feather.replace()
}

function openPreview(fileId, fileName, fileSummary) {
  previewImage.src = `${API_URL}/preview/${fileId}`
  previewFilename.textContent = fileName
  previewSummary.textContent = fileSummary
  previewModal.classList.add("active")
}

function closePreview() {
  previewModal.classList.remove("active")
}

if (previewCloseBtn) {
  previewCloseBtn.addEventListener("click", closePreview)
}

if (previewModal) {
  previewModal.addEventListener("click", (e) => {
    if (e.target === previewModal) {
      closePreview()
    }
  })
}

if (pdfCloseBtn) {
  pdfCloseBtn.addEventListener("click", closePDFPreview)
}

if (pdfModal) {
  pdfModal.addEventListener("click", (e) => {
    if (e.target === pdfModal) {
      closePDFPreview()
    }
  })
}

function getFileIconEmoji(contentType) {
  if (!contentType) return "❓"
  if (contentType.startsWith("image/")) return "🖼️"
  if (contentType.startsWith("video/")) return "🎬"
  if (contentType.startsWith("audio/")) return "🎵"
  if (contentType.includes("pdf")) return "📄"
  if (contentType.startsWith("text/")) return "📝"
  if (contentType.includes("zip") || contentType.includes("rar")) return "📦"
  if (contentType.includes("spreadsheet") || contentType.includes("excel")) return "📊"
  if (contentType.includes("presentation") || contentType.includes("powerpoint")) return "📽️"
  if (contentType.includes("document") || contentType.includes("word")) return "📑"
  return "📁"
}

function escapeHtml(unsafe) {
  if (typeof unsafe !== "string") return ""
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

// --- TAB SWITCHING LOGIC ---
function switchTab(targetTab) {
  tabContents.forEach((content) => {
    content.style.display = "none"
    content.classList.remove("active")
  })
  tabButtons.forEach((button) => {
    button.classList.remove("active")
  })

  const activeContent = document.getElementById(`${targetTab}-section`)
  const activeButton = document.querySelector(`header nav button[data-tab="${targetTab}"]`)

  if (activeContent) {
    activeContent.style.display = "block"
    activeContent.classList.add("active")
  }
  if (activeButton) {
    activeButton.classList.add("active")
  }

  if (targetTab === "dashboard") fetchStats()
  if (targetTab === "files") fetchFiles(searchInput.value.trim() || null)
}

// --- EVENT LISTENERS ---
if (headerNav) {
  headerNav.addEventListener("click", (e) => {
    if (e.target.tagName === "BUTTON" && e.target.dataset.tab) {
      switchTab(e.target.dataset.tab)
    }
  })
}

if (searchButton) {
  searchButton.addEventListener("click", () => {
    fetchFiles(searchInput.value.trim())
  })
}

if (searchInput) {
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      fetchFiles(searchInput.value.trim())
    }
  })
}

if (fileListContainer) {
  fileListContainer.addEventListener("click", (e) => {
    const deleteButton = e.target.closest(".delete-button")
    if (deleteButton) {
      const fileId = deleteButton.getAttribute("data-id")
      const fileName = deleteButton.getAttribute("data-name")
      handleDelete(fileId, fileName)
    }
  })
}

if (uploadArea) {
  browseButton.addEventListener("click", () => fileInput.click())
  fileInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      handleUpload(e.target.files[0])
    }
  })

  uploadArea.addEventListener("dragover", (e) => {
    e.preventDefault()
    uploadArea.classList.add("dragover")
  })
  uploadArea.addEventListener("dragleave", (e) => {
    e.preventDefault()
    uploadArea.classList.remove("dragover")
  })
  uploadArea.addEventListener("drop", (e) => {
    e.preventDefault()
    uploadArea.classList.remove("dragover")
    if (e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files[0])
    }
  })
}

// --- SMOOTH SCROLL ANIMATIONS ---
const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -50px 0px",
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = "1"
      entry.target.style.transform = "translateY(0)"
    }
  })
}, observerOptions)

// Observe all animated elements
document.addEventListener("DOMContentLoaded", () => {
  const animatedElements = document.querySelectorAll(".stat-card-premium, .file-item, .feature-item, .quick-stat")
  animatedElements.forEach((el) => {
    el.style.opacity = "0"
    el.style.transform = "translateY(20px)"
    el.style.transition = "opacity 0.6s ease-out, transform 0.6s ease-out"
    observer.observe(el)
  })

  switchTab("dashboard")

  // Star rating functionality
  const starRating = document.getElementById("star-rating")
  const ratingFeedback = document.getElementById("rating-feedback")
  let currentRating = 0

  if (starRating) {
    const stars = starRating.querySelectorAll(".star-dashboard")

    stars.forEach((star) => {
      star.addEventListener("click", () => {
        currentRating = Number.parseInt(star.getAttribute("data-value"))
        updateStarRating(currentRating)
        ratingFeedback.textContent = `Thank you! You rated us ${currentRating} star${currentRating !== 1 ? "s" : ""}`
        ratingFeedback.classList.add("rated")
      })

      star.addEventListener("mouseenter", () => {
        const hoverValue = Number.parseInt(star.getAttribute("data-value"))
        updateStarRating(hoverValue, true)
      })
    })

    starRating.addEventListener("mouseleave", () => {
      updateStarRating(currentRating)
    })
  }

  function updateStarRating(rating, isHover = false) {
    const stars = starRating.querySelectorAll(".star-dashboard")
    stars.forEach((star) => {
      const value = Number.parseInt(star.getAttribute("data-value"))
      if (value <= rating) {
        star.classList.add("active")
        star.style.fill = "var(--accent-gold)"
      } else {
        star.classList.remove("active")
        star.style.fill = "none"
      }
    })
  }
})
