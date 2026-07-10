const API_BASE = '/api/employees';

const form = document.getElementById('employee-form');
const tableBody = document.getElementById('employee-table-body');
const statusMessage = document.getElementById('status-message');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const formTitle = document.getElementById('form-title');
const idField = document.getElementById('employee-id');

function showStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.className = isError ? 'error' : 'success';
  setTimeout(() => { statusMessage.textContent = ''; }, 3000);
}

async function fetchEmployees() {
  try {
    const res = await fetch(API_BASE);
    if (!res.ok) throw new Error('Failed to fetch employees');
    const employees = await res.json();
    renderTable(employees);
  } catch (err) {
    showStatus(err.message, true);
  }
}

function renderTable(employees) {
  tableBody.innerHTML = '';
  employees.forEach((emp) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${emp.id}</td>
      <td>${escapeHtml(emp.name)}</td>
      <td>${escapeHtml(emp.email)}</td>
      <td>${escapeHtml(emp.department || '')}</td>
      <td>${escapeHtml(emp.position || '')}</td>
      <td>${emp.salary != null ? emp.salary : ''}</td>
      <td>
        <button class="action-btn edit-btn" onclick="editEmployee(${emp.id})">Edit</button>
        <button class="action-btn delete-btn" onclick="deleteEmployee(${emp.id})">Delete</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    name: document.getElementById('name').value,
    email: document.getElementById('email').value,
    department: document.getElementById('department').value,
    position: document.getElementById('position').value,
    salary: document.getElementById('salary').value || null
  };

  const id = idField.value;
  try {
    let res;
    if (id) {
      res = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } else {
      res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Request failed');
    }
    showStatus(id ? 'Employee updated' : 'Employee added');
    resetForm();
    fetchEmployees();
  } catch (err) {
    showStatus(err.message, true);
  }
});

async function editEmployee(id) {
  try {
    const res = await fetch(`${API_BASE}/${id}`);
    if (!res.ok) throw new Error('Failed to load employee');
    const emp = await res.json();
    idField.value = emp.id;
    document.getElementById('name').value = emp.name;
    document.getElementById('email').value = emp.email;
    document.getElementById('department').value = emp.department || '';
    document.getElementById('position').value = emp.position || '';
    document.getElementById('salary').value = emp.salary || '';
    formTitle.textContent = 'Edit Employee';
    submitBtn.textContent = 'Update Employee';
    cancelBtn.style.display = 'inline-block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (err) {
    showStatus(err.message, true);
  }
}

async function deleteEmployee(id) {
  if (!confirm('Delete this employee?')) return;
  try {
    const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete employee');
    showStatus('Employee deleted');
    fetchEmployees();
  } catch (err) {
    showStatus(err.message, true);
  }
}

function resetForm() {
  form.reset();
  idField.value = '';
  formTitle.textContent = 'Add Employee';
  submitBtn.textContent = 'Add Employee';
  cancelBtn.style.display = 'none';
}

cancelBtn.addEventListener('click', resetForm);

fetchEmployees();
