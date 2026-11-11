
const reports = [
  {
    id: 1,
    title: "Trash on the floor",
    location: "Main Building",
    category: "Cleanliness",
    status: "In Progress",
    date: "Today, 10:24 AM"
  },
  {
    id: 2,
    title: "Overflowing trash bins",
    location: "Canteen",
    category: "Cleanliness",
    status: "Pending",
    date: "Today, 9:12 AM"
  },
  {
    id: 3,
    title: "Dirty tables",
    location: "Library",
    category: "Cleanliness",
    status: "Resolved",
    date: "Yesterday, 4:32 PM"
  }
];

const icons = {
  "Main Building": "⌂",
  "Canteen": "▣",
  "Library": "▤",
  "Computer Laboratory": "⌘",
  "Gymnasium": "▥",
  "Comfort Room": "♧",
  "Outdoor / Grounds": "♧",
  "Other": "▧"
};

const $ = id => document.getElementById(id);

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function statusClass(status) {
  if (status === "Resolved") return "resolved";
  if (status === "In Progress") return "in-progress";
  return "pending";
}

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// Navigation
function navigate(page) {
  document.querySelectorAll(".page").forEach(section => {
    section.classList.toggle(
      "hidden",
      section.id !== page
    );
  });

  document.querySelectorAll("nav button").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.page === page
    );
  });

  const labels = {
    home: "Overview",
    report: "Report an Issue",
    reports: "All Reports",
    maintenance: "Maintenance"
  };

  $("breadcrumb").textContent = labels[page] || "Overview";

  if (page === "home" || page === "reports" ||
      page === "maintenance") {
    render();
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.addEventListener("click", event => {
  const button = event.target.closest("[data-page]");

  if (button) {
    navigate(button.dataset.page);
  }
});

// Create report card HTML
function reportCard(report, maintenance = false) {
  const icon = icons[report.location] || "▤";

  return `
    <article class="report-row">
      <div class="report-icon">${icon}</div>

      <div class="report-info">
        <strong>${escapeHTML(report.title)}</strong>
        <p>
          ${escapeHTML(report.location)} ·
          ${escapeHTML(report.category)} ·
          ${escapeHTML(report.date)}
        </p>
      </div>

      ${
        maintenance
          ? `<select class="maintenance-status"
               data-status-id="${report.id}"
               aria-label="Update status">
               ${["Pending", "In Progress", "Resolved"]
                 .map(status => `
                   <option value="${status}"
                     ${report.status === status ? "selected" : ""}>
                     ${status}
                   </option>
                 `).join("")}
             </select>`
          : `<span class="status ${statusClass(report.status)}">
               ${escapeHTML(report.status)}
             </span>`
      }
    </article>
  `;
}

// Update dashboard statistics
function updateCounts() {
  const total = reports.length;
  const progress = reports.filter(
    report => report.status === "In Progress"
  ).length;
  const resolved = reports.filter(
    report => report.status === "Resolved"
  ).length;

  $("totalCount").textContent = total;
  $("progressCount").textContent = progress;
  $("resolvedCount").textContent = resolved;

  $("maintenanceTotal").textContent = total;
  $("maintenanceProgress").textContent = progress;
  $("maintenanceResolved").textContent = resolved;
}

// Render all pages
function render() {
  updateCounts();

  $("recentReports").innerHTML = reports
    .slice(0, 3)
    .map(report => reportCard(report))
    .join("");

  const search = $("search").value.toLowerCase();
  const filter = $("filter").value;

  const filteredReports = reports.filter(report => {
    const matchesSearch =
      `${report.title} ${report.location} ${report.category}`
        .toLowerCase()
        .includes(search);

    const matchesStatus =
      filter === "All" || report.status === filter;

    return matchesSearch && matchesStatus;
  });

  $("allReports").innerHTML = filteredReports.length
    ? filteredReports.map(report => reportCard(report)).join("")
    : '<div class="empty">No reports found.</div>';

  const maintenanceSearch =
    $("maintenanceSearch").value.toLowerCase();

  const maintenanceReports = reports.filter(report =>
    `${report.title} ${report.location} ${report.category}`
      .toLowerCase()
      .includes(maintenanceSearch)
  );

  $("maintenanceReports").innerHTML = maintenanceReports.length
    ? maintenanceReports
        .map(report => reportCard(report, true))
        .join("")
    : '<div class="empty">No issues found.</div>';
}

// Search and filtering
$("search").addEventListener("input", render);
$("filter").addEventListener("change", render);
$("maintenanceSearch").addEventListener("input", render);

// Update maintenance status
document.addEventListener("change", event => {
  if (!event.target.matches("[data-status-id]")) return;

  const id = Number(event.target.dataset.statusId);
  const report = reports.find(item => item.id === id);

  if (report) {
    report.status = event.target.value;
    render();
    showToast("Report status updated successfully.");
  }
});

// Validate photo uploads
$("photo").addEventListener("change", event => {
  const file = event.target.files[0];

  if (!file) return;

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp"
  ];

  if (!allowedTypes.includes(file.type)) {
    event.target.value = "";
    showToast("Please select a JPG, PNG, or WEBP photo.");
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    event.target.value = "";
    showToast("Photo must be smaller than 5 MB.");
  }
});

// Submit a new report
$("reportForm").addEventListener("submit", event => {
  event.preventDefault();

  const location = $("location").value;
  const category = $("category").value;
  const description = $("description").value.trim();

  if (!location || !category || description.length < 8) {
    showToast("Please complete all required fields.");
    return;
  }

  const photo = $("photo").files[0];

  reports.unshift({
    id: Date.now(),
    title: description.length > 45
      ? description.slice(0, 42) + "..."
      : description,
    location,
    category,
    status: "Pending",
    date: "Just now",
    photoName: photo ? photo.name : ""
  });

  $("reportForm").reset();

  render();
  navigate("reports");
  showToast("Your report was submitted successfully!");
});

// Initial display
render();
navigate("home");
