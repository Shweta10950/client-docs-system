const API_BASE_URL = "http://localhost:5000";
const token = localStorage.getItem('token');
if (!token) {
  alert("You are not logged in.");
  window.location.href = "login.html";
}


let currentEditId = null;
let documents = [];

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("filterClient").addEventListener("input", applyFilter);
  document.getElementById("filterDate").addEventListener("change", applyFilter);
  document.getElementById("filterType").addEventListener("change", applyFilter);
  applyFilter(); // Fetch all on load
});

function applyFilter() {
  const client = document.getElementById("filterClient").value.trim();
  const expiry = document.getElementById("filterDate").value;
  const type = document.getElementById("filterType").value;

  const filters = {};
  if (client) filters.client = client;
  if (expiry) filters.expiry = expiry;
  if (type) filters.type = type;

  fetchDocuments(filters);
}

function fetchDocuments(filters = {}) {
  const query = new URLSearchParams(filters).toString();
  fetch(`${API_BASE_URL}/api/admin/documents?${query}`, {
    headers: {
  'Authorization': `Bearer ${token}`
}

  })
    .then(res => {
      if (!res.ok) throw new Error("Failed to fetch documents");
      return res.json();
    })
    .then(data => {
      console.log("Fetched Docs from Server:", data);
      documents = data;
      renderTable(documents);
    })
    .catch(err => {
      console.error("Error fetching documents:", err);
      alert("Failed to fetch documents. Check console for details.");
    });
}

function renderTable(docs) {
  const table = document.getElementById("adminDocsTable");
  table.innerHTML = "";

  if (docs.length === 0) {
    table.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-gray-500">No documents found</td></tr>`;
    return;
  }

  docs.forEach(doc => {
    table.innerHTML += `
      <tr class="border-b">
        <td class="p-3">${doc.clientEmail}</td>
        <td class="p-3">${doc.name}</td>
        <td class="p-3">${doc.type}</td>
        <td class="p-3">${new Date(doc.expiry).toLocaleDateString()}</td>
        <td class="p-3 space-x-2">
          <button onclick="sendReminder('${doc._id}')" class="bg-blue-500 text-white px-2 py-1 rounded text-xs">Remind</button>
          <button onclick="editDoc('${doc._id}', \`${doc.name}\`, '${doc.expiry}')" class="bg-yellow-500 text-white px-2 py-1 rounded text-xs">Edit</button>
          <button onclick="deleteDoc('${doc._id}')" class="bg-red-500 text-white px-2 py-1 rounded text-xs">Delete</button>
        </td>
      </tr>`;
  });
}

function sendReminder(id) {
  fetch(`${API_BASE_URL}/api/send-reminder`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + localStorage.getItem('token')
    },
    body: JSON.stringify({ documentId: id })
  })
    .then(res => res.json())
    .then(msg => alert(msg.message))
    .catch(err => alert("Error sending reminder"));
}

function deleteDoc(id) {
  if (confirm("Are you sure you want to delete this document?")) {
    fetch(`${API_BASE_URL}/api/admin/documents/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: 'Bearer ' + localStorage.getItem('token')
      }
    }).then(() => applyFilter());
  }
}

function editDoc(id, name, expiry) {
  currentEditId = id;
  document.getElementById("editName").value = name;
  document.getElementById("editExpiry").value = expiry.split("T")[0];
  document.getElementById("editModal").classList.remove("hidden");
}

function submitEdit() {
  const updatedName = document.getElementById("editName").value;
  const updatedExpiry = document.getElementById("editExpiry").value;

  fetch(`${API_BASE_URL}/api/documents/${currentEditId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + localStorage.getItem('token')
    },
    body: JSON.stringify({ name: updatedName, expiry: updatedExpiry })
  })
    .then(res => res.json())
    .then(() => {
      closeEditModal();
      applyFilter();
    })
    .catch(err => {
      console.error("Update failed", err);
      alert("Update failed.");
    });
}

function closeEditModal() {
  document.getElementById("editModal").classList.add("hidden");
}

function logout() {
  localStorage.removeItem("token");
  window.location.href = "login.html";
}
