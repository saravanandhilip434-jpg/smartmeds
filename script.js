
const form = document.getElementById("medicineForm");
const list = document.getElementById("medicineList");

let medicines = JSON.parse(
  localStorage.getItem("smartmeds_medicines") || "[]"
);
let editingId = null;
let takenToday = JSON.parse(
  localStorage.getItem("smartmeds_taken") || "{}"
);
let currentDay = new Date().toDateString();

function saveData() {
  localStorage.setItem(
    "smartmeds_medicines",
    JSON.stringify(medicines)
  );
  localStorage.setItem(
    "smartmeds_taken",
    JSON.stringify(takenToday)
  );
}

function checkNewDay() {
  const savedDay = localStorage.getItem("smartmeds_day");

  if (savedDay !== currentDay) {
    takenToday = {};
    localStorage.setItem("smartmeds_day", currentDay);
    saveData();
  }
}

function updateDashboard() {
  document.getElementById("total").textContent = medicines.length;

  document.getElementById("pending").textContent =
    medicines.filter(m => !takenToday[m.id]).length;

  document.getElementById("low").textContent =
    medicines.filter(m => m.quantity <= m.limit).length;
}

function renderMedicines() {
  checkNewDay();
  updateDashboard();

  if (medicines.length === 0) {
    list.innerHTML = `
      <div class="empty">
        <h3>💊 No medicines added yet</h3>
        <p>Click "Add Medicine" to create your first reminder.</p>
      </div>`;
    return;
  }

  list.innerHTML = medicines.map(m => {
    const isTaken = Boolean(takenToday[m.id]);
    const isLow = m.quantity <= m.limit;

    return `
      <div class="medicine-item">
        <div>
          <h3>💊 ${escapeHTML(m.name)}</h3>
          <p>Dosage: ${escapeHTML(m.dosage)}</p>
          <p>Reminder: ${escapeHTML(m.time || "Not set")}</p>
          <p>Remaining stock: ${m.quantity}</p>
          ${isLow
            ? '<span class="warning">Low stock — refill needed</span>'
            : ""}
          <p class="status">
            ${isTaken ? "✓ Marked as taken today" : "● Pending today"}
          </p>
        </div>

        <div class="medicine-actions">
          <button class="small-btn" data-action="taken" data-id="${m.id}">
            ${isTaken ? "Undo taken" : "Mark taken"}
          </button>
          <button class="small-btn secondary"
            data-action="edit" data-id="${m.id}">Edit</button>
          <button class="small-btn delete-btn"
            data-action="delete" data-id="${m.id}">Delete</button>
        </div>
      </div>`;
  }).join("");
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

document.getElementById("addBtn").addEventListener("click", () => {
  editingId = null;
  form.reset();
  document.getElementById("quantity").value = 30;
  document.getElementById("formTitle").textContent = "Add a medicine";
  form.hidden = false;
  document.getElementById("name").focus();
});

document.getElementById("cancelBtn").addEventListener("click", () => {
  form.hidden = true;
  editingId = null;
});

form.addEventListener("submit", event => {
  event.preventDefault();

  const name = document.getElementById("name").value.trim();
  const dosage = document.getElementById("dosage").value.trim();
  const quantity = Number(document.getElementById("quantity").value);
  const time = document.getElementById("time").value;

  if (!name || !dosage || !Number.isInteger(quantity) || quantity < 0) {
    alert("Please enter valid medicine details.");
    return;
  }

  if (editingId !== null) {
    medicines = medicines.map(m =>
      m.id === editingId
        ? { ...m, name, dosage, quantity, time }
        : m
    );
  } else {
    medicines.push({
      id: Date.now(),
      name,
      dosage,
      quantity,
      time,
      limit: 5
    });
  }

  saveData();
  renderMedicines();
  form.hidden = true;
  editingId = null;
  form.reset();
});

list.addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const id = Number(button.dataset.id);
  const action = button.dataset.action;
  const medicine = medicines.find(m => m.id === id);

  if (!medicine) return;

  if (action === "taken") {
    if (takenToday[id]) {
      delete takenToday[id];
    } else {
      if (medicine.quantity < 1) {
        alert("No stock remaining. Please refill before marking taken.");
        return;
      }

      const confirmed = confirm(
        "Have you actually taken this medicine? This demo will reduce stock by one."
      );

      if (!confirmed) return;

      takenToday[id] = true;
      medicine.quantity -= 1;
    }
  }

  if (action === "edit") {
    editingId = id;
    document.getElementById("name").value = medicine.name;
    document.getElementById("dosage").value = medicine.dosage;
    document.getElementById("quantity").value = medicine.quantity;
    document.getElementById("time").value = medicine.time;
    document.getElementById("formTitle").textContent = "Edit medicine";
    form.hidden = false;
    document.getElementById("name").focus();
    return;
  }

  if (action === "delete") {
    if (!confirm(`Delete ${medicine.name}?`)) return;

    medicines = medicines.filter(m => m.id !== id);
    delete takenToday[id];
  }

  saveData();
  renderMedicines();
});

checkNewDay();
renderMedicines();
