import { auth, db } from "./firebase.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const activeTasks = document.getElementById("activeTasks");
const completedTasks = document.getElementById("completedTasks");
const activeCount = document.getElementById("activeCount");
const completedCount = document.getElementById("completedCount");

const taskModal = document.getElementById("taskModal");
const detailsModal = document.getElementById("detailsModal");
const completeModal = document.getElementById("completeModal");
const deleteModal = document.getElementById("deleteModal");
const overlay = document.getElementById("overlay");

const createTaskBtn = document.getElementById("createTaskBtn");
const saveTaskBtn = document.getElementById("saveTaskBtn");
const taskModalTitle = document.getElementById("taskModalTitle");

const taskName = document.getElementById("taskName");
const taskAddress = document.getElementById("taskAddress");
const taskNotes = document.getElementById("taskNotes");

const materialDropdownBtn = document.getElementById("materialDropdownBtn");
const materialDropdown = document.getElementById("materialDropdown");
const selectedMaterialsWrap = document.getElementById("selectedMaterials");

const detailsContent = document.getElementById("detailsContent");

const cancelComplete = document.getElementById("cancelComplete");
const confirmComplete = document.getElementById("confirmComplete");
const cancelDelete = document.getElementById("cancelDelete");
const confirmDelete = document.getElementById("confirmDelete");

const menuButton = document.getElementById("menuButton");
const menuPopup = document.getElementById("menuPopup");
const logoutBtn = document.getElementById("logoutBtn");

let materialNames = [];
let selectedMaterials = [];
let currentTaskId = null;
let pendingCompleteId = null;
let pendingDeleteId = null;

function anyModalOpen() {
  return [taskModal, detailsModal, completeModal, deleteModal].some(modal =>
    modal.classList.contains("active")
  );
}

function openOverlay() {
  overlay.classList.add("active");
}

function closeOverlayIfNeeded() {
  const menuOpen = menuPopup.classList.contains("active");
  if (!anyModalOpen() && !menuOpen) {
    overlay.classList.remove("active");
  }
}

function openModal(modal) {
  closeMenu(false);
  modal.classList.add("active");
  openOverlay();
}

function closeAllModals() {
  [taskModal, detailsModal, completeModal, deleteModal].forEach(modal => {
    modal.classList.remove("active");
  });
  materialDropdown.classList.remove("open");
  pendingCompleteId = null;
  pendingDeleteId = null;
  closeOverlayIfNeeded();
}

function closeMenu(updateOverlay = true) {
  menuPopup.classList.remove("active");
  menuButton.classList.remove("active");
  if (updateOverlay) {
    closeOverlayIfNeeded();
  }
}

function resetTaskForm() {
  currentTaskId = null;
  selectedMaterials = [];
  taskModalTitle.textContent = "Opret opgave";
  taskName.value = "";
  taskAddress.value = "";
  taskNotes.value = "";
  renderSelectedMaterials();
  renderMaterialDropdown();
}

function setDropdownButtonText() {
  if (selectedMaterials.length === 0) {
    materialDropdownBtn.textContent = "Vælg materialer";
  } else {
    materialDropdownBtn.textContent = `Valgt (${selectedMaterials.length})`;
  }
}

function renderSelectedMaterials() {
  selectedMaterialsWrap.innerHTML = "";

  selectedMaterials.forEach(material => {
    const tag = document.createElement("span");
    tag.className = "materialTag";
    tag.textContent = material;
    selectedMaterialsWrap.appendChild(tag);
  });

  setDropdownButtonText();
}

function renderMaterialDropdown() {
  materialDropdown.innerHTML = "";

  if (materialNames.length === 0) {
    const empty = document.createElement("div");
    empty.className = "materialItem";
    empty.textContent = "Ingen materialer fundet";
    materialDropdown.appendChild(empty);
    return;
  }

  materialNames.forEach(material => {
    const row = document.createElement("label");
    row.className = "materialItem";

    const checked = selectedMaterials.includes(material);

    row.innerHTML = `
      <input type="checkbox" ${checked ? "checked" : ""}>
      <span>${material}</span>
    `;

    const checkbox = row.querySelector("input");

    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        if (!selectedMaterials.includes(material)) {
          selectedMaterials.push(material);
        }
      } else {
        selectedMaterials = selectedMaterials.filter(item => item !== material);
      }

      renderSelectedMaterials();
      renderMaterialDropdown();
    });

    materialDropdown.appendChild(row);
  });
}

function buildBadges(materials = []) {
  if (!materials || materials.length === 0) {
    return "";
  }

  return `
    <div class="materialBadges">
      ${materials.map(material => `<span class="badge">${material}</span>`).join("")}
    </div>
  `;
}

function renderEmptyState(target, text) {
  target.innerHTML = `<div class="emptyState">${text}</div>`;
}

function openCreateTask() {
  resetTaskForm();
  openModal(taskModal);
}

function openEditTask(taskId, task) {
  currentTaskId = taskId;
  taskModalTitle.textContent = "Rediger opgave";
  taskName.value = task.name || "";
  taskAddress.value = task.address || "";
  taskNotes.value = task.notes || "";
  selectedMaterials = Array.isArray(task.materials) ? [...task.materials] : [];
  renderSelectedMaterials();
  renderMaterialDropdown();
  openModal(taskModal);
}

/* KUN MATEMATIKKEN ER ÆNDRET HER */
function calculateWorkedHours(start, end, pause) {
  if (!start || !end) return 0;

  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);

  let totalMinutes = (eh * 60 + em) - (sh * 60 + sm);
  totalMinutes -= Number(pause || 0);

  if (Number.isNaN(totalMinutes) || totalMinutes < 0) {
    return 0;
  }

  return totalMinutes;
}

async function openDetails(taskId, task) {
  const hoursQuery = query(
    collection(db, "time_entries"),
    where("taskId", "==", taskId)
  );

  const hoursSnapshot = await getDocs(hoursQuery);
  const employeeMap = new Map();

  hoursSnapshot.forEach(docSnap => {
    const data = docSnap.data();
    const userId = data.userId || "ukendt";
    const workedMinutes = calculateWorkedHours(data.start, data.end, data.pause);

    if (!employeeMap.has(userId)) {
      employeeMap.set(userId, 0);
    }

    employeeMap.set(userId, employeeMap.get(userId) + workedMinutes);
  });

  let employeesHtml = "<p>Ingen registrerede timer på denne opgave endnu.</p>";

  if (employeeMap.size > 0) {
    const rows = await Promise.all(
      Array.from(employeeMap.entries()).map(async ([userId, totalMinutes]) => {
        let displayName = "Ukendt medarbejder";

        try {
          const userSnap = await getDoc(doc(db, "users", userId));
          if (userSnap.exists()) {
            displayName = userSnap.data().name || "Ukendt medarbejder";
          }
        } catch {
          displayName = "Ukendt medarbejder";
        }

        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        const timeString = `${hours}:${minutes.toString().padStart(2, "0")}`;

        return `
          <div class="employeeRow">
            <span class="employeeName">${displayName}</span>
            <span class="employeeHours">${timeString} t</span>
          </div>
        `;
      })
    );

    employeesHtml = rows.join("");
  }

  detailsContent.innerHTML = `
    <div class="detailsBlock">
      <h4>Navn</h4>
      <p>${task.name || "-"}</p>
    </div>

    <div class="detailsBlock">
      <h4>Adresse</h4>
      <p>${task.address || "-"}</p>
    </div>

    <div class="detailsBlock">
      <h4>Noter</h4>
      <p>${task.notes || "-"}</p>
    </div>

    <div class="detailsBlock">
      <h4>Materialer</h4>
      ${
        task.materials && task.materials.length
          ? buildBadges(task.materials)
          : "<p>Ingen materialer valgt.</p>"
      }
    </div>

    <div class="detailsBlock">
      <h4>Medarbejdere og timer</h4>
      ${employeesHtml}
    </div>
  `;

  openModal(detailsModal);
}

function askCompleteTask(taskId) {
  pendingCompleteId = taskId;
  openModal(completeModal);
}

function askDeleteTask(taskId) {
  pendingDeleteId = taskId;
  openModal(deleteModal);
}

async function loadMaterials() {
  materialNames = [];
  const snapshot = await getDocs(collection(db, "materials"));

  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    if (data.name) {
      materialNames.push(data.name);
    }
  });

  materialNames.sort((a, b) => a.localeCompare(b, "da"));
  renderMaterialDropdown();
  renderSelectedMaterials();
}

function getSortableDate(task) {
  if (!task.created) return 0;
  if (typeof task.created.toMillis === "function") return task.created.toMillis();
  if (task.created instanceof Date) return task.created.getTime();
  return 0;
}

async function loadTasks() {
  activeTasks.innerHTML = "";
  completedTasks.innerHTML = "";

  const snapshot = await getDocs(collection(db, "tasks"));
  const active = [];
  const completed = [];

  snapshot.forEach(docSnap => {
    const task = docSnap.data();
    const item = { id: docSnap.id, ...task };

    if (task.status === "completed") {
      completed.push(item);
    } else {
      active.push(item);
    }
  });

  active.sort((a, b) => getSortableDate(b) - getSortableDate(a));
  completed.sort((a, b) => getSortableDate(b) - getSortableDate(a));

  activeCount.textContent = String(active.length);
  completedCount.textContent = String(completed.length);

  if (active.length === 0) {
    renderEmptyState(activeTasks, "Der er ingen aktive opgaver endnu.");
  }

  if (completed.length === 0) {
    renderEmptyState(completedTasks, "Der er ingen afsluttede opgaver endnu.");
  }

  active.forEach(task => {
    const card = document.createElement("div");
    card.className = "taskCard";

    card.innerHTML = `
      <div class="taskTop">
        <div class="taskMain">
          <h3>${task.name || "-"}</h3>
          <p>${task.address || "-"}</p>
        </div>
        <span class="statusPill active">Aktiv</span>
      </div>
      ${buildBadges(task.materials)}
    `;

    const buttons = document.createElement("div");
    buttons.className = "taskButtons";
    buttons.innerHTML = `
      <button class="editBtn" type="button">Rediger</button>
      <button class="detailBtn" type="button">Detaljer</button>
      <button class="finishBtn" type="button">Afslut</button>
    `;

    buttons.children[0].addEventListener("click", () => openEditTask(task.id, task));
    buttons.children[1].addEventListener("click", () => openDetails(task.id, task));
    buttons.children[2].addEventListener("click", () => askCompleteTask(task.id));

    card.appendChild(buttons);
    activeTasks.appendChild(card);
  });

  completed.forEach(task => {
    const card = document.createElement("div");
    card.className = "taskCard";

    card.innerHTML = `
      <div class="taskTop">
        <div class="taskMain">
          <h3>${task.name || "-"}</h3>
          <p>${task.address || "-"}</p>
        </div>
        <span class="statusPill completed">Afsluttet</span>
      </div>
      ${buildBadges(task.materials)}
    `;

    const buttons = document.createElement("div");
    buttons.className = "taskButtons twoButtons";
    buttons.innerHTML = `
      <button class="detailBtn" type="button">Detaljer</button>
      <button class="deleteBtn" type="button">Slet</button>
    `;

    buttons.children[0].addEventListener("click", () => openDetails(task.id, task));
    buttons.children[1].addEventListener("click", () => askDeleteTask(task.id));

    card.appendChild(buttons);
    completedTasks.appendChild(card);
  });
}

createTaskBtn.addEventListener("click", openCreateTask);

saveTaskBtn.addEventListener("click", async () => {
  const payload = {
    name: taskName.value.trim(),
    address: taskAddress.value.trim(),
    notes: taskNotes.value.trim(),
    materials: [...selectedMaterials]
  };

  if (!payload.name || !payload.address) {
    alert("Udfyld mindst navn og adresse.");
    return;
  }

  if (currentTaskId) {
    await updateDoc(doc(db, "tasks", currentTaskId), payload);
  } else {
    await addDoc(collection(db, "tasks"), {
      ...payload,
      status: "active",
      created: new Date()
    });
  }

  closeAllModals();
  resetTaskForm();
  await loadTasks();
});

materialDropdownBtn.addEventListener("click", (event) => {
  event.stopPropagation();
  materialDropdown.classList.toggle("open");
  openOverlay();
});

confirmComplete.addEventListener("click", async () => {
  if (!pendingCompleteId) return;

  await updateDoc(doc(db, "tasks", pendingCompleteId), {
    status: "completed"
  });

  closeAllModals();
  await loadTasks();
});

confirmDelete.addEventListener("click", async () => {
  if (!pendingDeleteId) return;

  await deleteDoc(doc(db, "tasks", pendingDeleteId));
  closeAllModals();
  await loadTasks();
});

cancelComplete.addEventListener("click", closeAllModals);
cancelDelete.addEventListener("click", closeAllModals);

document.querySelectorAll(".closeModal").forEach(button => {
  button.addEventListener("click", closeAllModals);
});

overlay.addEventListener("click", () => {
  closeAllModals();
  closeMenu();
});

document.addEventListener("click", (event) => {
  const insideDropdown =
    materialDropdown.contains(event.target) ||
    materialDropdownBtn.contains(event.target);

  if (!insideDropdown) {
    materialDropdown.classList.remove("open");
    closeOverlayIfNeeded();
  }
});

menuButton.addEventListener("click", (event) => {
  event.stopPropagation();

  const willOpen = !menuPopup.classList.contains("active");

  if (willOpen) {
    closeAllModals();
    menuPopup.classList.add("active");
    menuButton.classList.add("active");
    openOverlay();
  } else {
    closeMenu();
  }
});

menuPopup.querySelectorAll("button[data-link]").forEach(button => {
  button.addEventListener("click", () => {
    const link = button.dataset.link;
    if (link) {
      window.location.href = link;
    }
  });
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "login.html";
});

await loadMaterials();
await loadTasks();