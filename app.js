// Global Modal Instances
let addRoomModal, addStudentModal;

document.addEventListener('DOMContentLoaded', () => {
    initApp();
    // Initialize Bootstrap Modals
    addRoomModal = new bootstrap.Modal(document.getElementById('addRoomModal'));
    addStudentModal = new bootstrap.Modal(document.getElementById('addStudentModal'));
});

function initApp() {
    const user = Auth.getCurrentUser();
    const loader = document.getElementById('loader');
    const authSection = document.getElementById('auth-section');
    const appSection = document.getElementById('app-section');

    setTimeout(() => {
        loader.classList.add('d-none');
        if (Auth.isLoggedIn()) {
            authSection.classList.add('d-none');
            appSection.classList.remove('d-none');
            setupDashboard(user);
        } else {
            authSection.classList.remove('d-none');
            appSection.classList.add('d-none');
        }
    }, 1000);

    setupEventListeners();
}

function setupEventListeners() {
    // Admin Login
    document.getElementById('adminLoginForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('adminEmail').value;
        const password = document.getElementById('adminPassword').value;
        const result = Auth.login('admin', { email, password });
        handleAuthResult(result);
    });

    // Student Login
    document.getElementById('studentLoginForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const rollNo = document.getElementById('studentRoll').value;
        const password = document.getElementById('studentPassword').value;
        const result = Auth.login('student', { rollNo, password });
        handleAuthResult(result);
    });

    // Sidebar Navigation
    document.querySelectorAll('.nav-link[data-view]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const view = link.getAttribute('data-view');
            renderView(view);

            // UI Updates
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            if (window.innerWidth < 992) {
                document.getElementById('sidebar').classList.remove('show');
            }
        });
    });

    // Sidebar Toggles
    document.getElementById('toggleSidebar')?.addEventListener('click', () => {
        document.getElementById('sidebar').classList.add('show');
    });

    document.getElementById('closeSidebar')?.addEventListener('click', () => {
        document.getElementById('sidebar').classList.remove('show');
    });

    // Room Form Submit
    document.getElementById('roomForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const roomData = {
            number: document.getElementById('roomNumber').value,
            type: document.getElementById('roomType').value,
            capacity: parseInt(document.getElementById('roomCapacity').value),
            occupied: 0,
            status: "Available"
        };
        Storage.add('rooms', roomData);
        addRoomModal.hide();
        renderView('rooms');
        Swal.fire('Success', 'Room added successfully', 'success');
    });

    // Student Form Submit
    document.getElementById('studentForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const roomNo = document.getElementById('studRoomSelect').value;
        const studentData = {
            name: document.getElementById('studName').value,
            rollNo: document.getElementById('studId').value,
            dept: document.getElementById('studDept').value,
            room: roomNo,
            phone: document.getElementById('studPhone').value,
            guardian: document.getElementById('studGuardian').value,
            feeStatus: "Due"
        };

        Storage.add('students', studentData);

        // Update room occupancy
        const rooms = Storage.getAll('rooms');
        const roomIndex = rooms.findIndex(r => r.number === roomNo);
        if (roomIndex !== -1) {
            rooms[roomIndex].occupied += 1;
            if (rooms[roomIndex].occupied >= rooms[roomIndex].capacity) {
                rooms[roomIndex].status = "Occupied";
            }
            const db = getData();
            db.rooms = rooms;
            saveData(db);
        }

        addStudentModal.hide();
        renderView('students');
        Swal.fire('Registered!', 'Student has been added to the system', 'success');
    });

    // Dark Mode Toggle
    document.getElementById('toggle-dark-mode')?.addEventListener('click', (e) => {
        e.preventDefault();
        const body = document.body;
        const isDark = body.getAttribute('data-theme') === 'dark';
        body.setAttribute('data-theme', isDark ? 'light' : 'dark');
        const icon = e.target.closest('a').querySelector('i');
        icon.className = isDark ? 'fas fa-moon me-2' : 'fas fa-sun me-2';
    });
}

function handleAuthResult(result) {
    if (result.success) {
        Swal.fire({
            icon: 'success',
            title: 'Welcome!',
            text: `Logged in as ${result.user.name}`,
            timer: 1500,
            showConfirmButton: false
        }).then(() => {
            window.location.reload();
        });
    } else {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: result.message
        });
    }
}

function handleLogout() {
    Swal.fire({
        title: 'Are you sure?',
        text: "You want to logout!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#4361ee',
        confirmButtonText: 'Yes, logout!'
    }).then((result) => {
        if (result.isConfirmed) {
            Auth.logout();
        }
    });
}

function setupDashboard(user) {
    document.getElementById('user-display-name').textContent = user.name;
    document.getElementById('user-display-role').textContent = user.role === 'admin' ? 'Hostel Warden' : 'Student';
    document.getElementById('user-avatar').src = `https://ui-avatars.com/api/?name=${user.name}&background=4361ee&color=fff`;

    if (user.role === 'admin') {
        document.getElementById('admin-nav').classList.remove('d-none');
        renderView('dashboard');
    } else {
        document.getElementById('student-nav').classList.remove('d-none');
        renderView('student-dashboard');
    }
}

function renderView(view) {
    const container = document.getElementById('view-container');
    const title = document.getElementById('view-title');
    container.innerHTML = '';

    container.classList.remove('fade-in');
    void container.offsetWidth;
    container.classList.add('fade-in');

    const views = {
        'dashboard': { title: 'Admin Dashboard', fn: renderAdminDashboard },
        'rooms': { title: 'Room Management', fn: renderRooms },
        'students': { title: 'Student Management', fn: renderStudents },
        'fees': { title: 'Fee Records', fn: renderFees },
        'attendance': { title: 'Attendance Tracking', fn: renderAttendance },
        'complaints': { title: 'Student Complaints', fn: renderComplaints },
        'notices': { title: 'Notices Board', fn: renderNotices },
        'student-dashboard': { title: 'Student Profile', fn: renderStudentDashboard },
        'student-complaints': { title: 'My Complaints', fn: renderStudentComplaints },
        'student-notices': { title: 'Notice Board', fn: renderStudentNotices }
    };

    if (views[view]) {
        title.textContent = views[view].title;
        views[view].fn(container);
    }
}

// --- ADMIN VIEWS ---

function renderAdminDashboard(container) {
    const rooms = Storage.getAll('rooms');
    const students = Storage.getAll('students');
    const complaints = Storage.getAll('complaints');

    const totalRooms = rooms.length;
    const availableRooms = rooms.filter(r => r.occupied < r.capacity).length;
    const pendingComplaints = complaints.filter(c => c.status === 'Pending').length;
    const dueStudents = students.filter(s => s.feeStatus === 'Due').length;

    container.innerHTML = `
        <div class="row g-4 mb-4">
            ${renderStatCard('Total Students', students.length, 'fa-users', 'primary')}
            ${renderStatCard('Available Rooms', availableRooms, 'fa-door-open', 'success')}
            ${renderStatCard('Pending Complaints', pendingComplaints, 'fa-exclamation-circle', 'warning')}
            ${renderStatCard('Fee Dues', dueStudents, 'fa-money-bill-wave', 'danger')}
        </div>
        <div class="row g-4">
            <div class="col-lg-8">
                <div class="card border-0 shadow-sm p-4 h-100" style="border-radius: 15px;">
                    <h5 class="mb-4 fw-bold">Room Occupancy Stat</h5>
                    <div style="max-width: 300px; margin: 0 auto;">
                        <canvas id="occupancyChart"></canvas>
                    </div>
                </div>
            </div>
            <div class="col-lg-4">
                <div class="card border-0 shadow-sm p-4 h-100" style="border-radius: 15px;">
                    <h5 class="mb-4 fw-bold">Recent Complaints</h5>
                    <div id="recent-complaints-list">
                        ${complaints.length ? complaints.slice(0, 4).map(c => `
                            <div class="mb-3 pb-3 border-bottom last-border-0">
                                <div class="d-flex justify-content-between">
                                    <small class="text-muted">${c.date}</small>
                                    <span class="badge ${c.status === 'Pending' ? 'bg-warning' : 'bg-success'} font-size-xs">${c.status}</span>
                                </div>
                                <h6 class="mb-1 mt-1 fw-bold">${c.category}</h6>
                                <p class="text-muted small mb-0">${c.desc}</p>
                            </div>
                        `).join('') : '<p class="text-muted">No recent complaints</p>'}
                    </div>
                </div>
            </div>
        </div>
    `;

    setTimeout(() => {
        const ctx = document.getElementById('occupancyChart')?.getContext('2d');
        if (ctx) {
            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Occupied', 'Available'],
                    datasets: [{
                        data: [totalRooms - availableRooms, availableRooms],
                        backgroundColor: ['#4361ee', '#4cc9f0'],
                        borderWidth: 0
                    }]
                },
                options: { cutout: '70%', plugins: { legend: { position: 'bottom' } } }
            });
        }
    }, 100);
}

function renderStatCard(title, value, icon, type) {
    return `
        <div class="col-md-6 col-lg-3">
            <div class="stats-card border-start border-4 border-${type}">
                <p class="text-muted mb-1 fw-medium">${title}</p>
                <h3 class="fw-bold mb-0">${value}</h3>
                <i class="fas ${icon} text-${type}"></i>
            </div>
        </div>
    `;
}

function renderRooms(container) {
    const rooms = Storage.getAll('rooms');
    container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h5 class="mb-0 fw-bold">Hostel Inventory</h5>
            <button class="btn btn-primary btn-sm" onclick="addRoomModal.show()"><i class="fas fa-plus me-1"></i> Add Room</button>
        </div>
        <div class="table-responsive custom-table">
            <table class="table table-hover mb-0">
                <thead><tr><th>Room #</th><th>Type</th><th>Capacity</th><th>Filled</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>${rooms.map(r => `
                    <tr>
                        <td class="fw-bold text-primary">${r.number}</td>
                        <td>${r.type}</td>
                        <td>${r.capacity}</td>
                        <td>${r.occupied}</td>
                        <td><span class="badge ${r.status === 'Available' ? 'badge-available' : 'badge-occupied'}">${r.status}</span></td>
                        <td>
                            <button class="btn btn-sm btn-light" onclick="deleteRoom(${r.id})"><i class="fas fa-trash text-danger"></i></button>
                        </td>
                    </tr>
                `).join('')}</tbody>
            </table>
        </div>
    `;
}

function renderStudents(container) {
    const students = Storage.getAll('students');
    container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h5 class="mb-0 fw-bold">Registered Scholars</h5>
            <button class="btn btn-primary btn-sm" onclick="showAddStudentModal()"><i class="fas fa-user-plus me-1"></i> New Student</button>
        </div>
        <div class="table-responsive custom-table">
            <table class="table table-hover mb-0">
                <thead><tr><th>ID</th><th>Name</th><th>Dept</th><th>Room</th><th>Phone</th><th>Fee</th><th>Actions</th></tr></thead>
                <tbody>${students.map(s => `
                    <tr>
                        <td><code>${s.rollNo}</code></td>
                        <td>${s.name}</td>
                        <td>${s.dept}</td>
                        <td>${s.room}</td>
                        <td>${s.phone}</td>
                        <td><span class="badge ${s.feeStatus === 'Paid' ? 'bg-success' : 'bg-danger'}">${s.feeStatus}</span></td>
                        <td>
                            <button class="btn btn-sm btn-light" onclick="deleteStudent(${s.id})"><i class="fas fa-user-minus text-danger"></i></button>
                        </td>
                    </tr>
                `).join('')}</tbody>
            </table>
        </div>
    `;
}

function renderFees(container) {
    const students = Storage.getAll('students');
    container.innerHTML = `
        <div class="card border-0 shadow-sm p-4 mb-4" style="border-radius: 15px;">
            <h5 class="fw-bold mb-4">Financial Records</h5>
            <div class="table-responsive">
                <table class="table align-middle">
                    <thead><tr><th>Student</th><th>Roll No</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead>
                    <tbody>${students.map(s => `
                        <tr>
                            <td>${s.name}</td>
                            <td><code>${s.rollNo}</code></td>
                            <td>PKR 12,000</td>
                            <td><span class="badge ${s.feeStatus === 'Paid' ? 'bg-success' : 'bg-warning'}">${s.feeStatus}</span></td>
                            <td>
                                ${s.feeStatus === 'Due' ? `<button class="btn btn-sm btn-success" onclick="updateFeeStatus('${s.rollNo}', 'Paid')">Mark Paid</button>` : `<button class="btn btn-sm btn-outline-secondary" disabled>Paid</button>`}
                            </td>
                        </tr>
                    `).join('')}</tbody>
                </table>
            </div>
        </div>
    `;
}

function renderAttendance(container) {
    const students = Storage.getAll('students');
    const today = new Date().toISOString().split('T')[0];
    container.innerHTML = `
        <div class="card border-0 shadow-sm p-4 mb-4" style="border-radius: 15px;">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h5 class="fw-bold mb-0">Daily Attendance - ${today}</h5>
                <button class="btn btn-primary btn-sm" onclick="saveAttendance()">Save Summary</button>
            </div>
            <div class="table-responsive">
                <table class="table">
                    <thead><tr><th>Roll No</th><th>Student Name</th><th>Room</th><th>Status</th></tr></thead>
                    <tbody>${students.map(s => `
                        <tr>
                            <td><code>${s.rollNo}</code></td>
                            <td>${s.name}</td>
                            <td>${s.room}</td>
                            <td>
                                <div class="btn-group btn-group-sm">
                                    <input type="radio" class="btn-check" name="att-${s.rollNo}" id="p-${s.rollNo}" checked>
                                    <label class="btn btn-outline-success" for="p-${s.rollNo}">Present</label>
                                    <input type="radio" class="btn-check" name="att-${s.rollNo}" id="a-${s.rollNo}">
                                    <label class="btn btn-outline-danger" for="a-${s.rollNo}">Absent</label>
                                </div>
                            </td>
                        </tr>
                    `).join('')}</tbody>
                </table>
            </div>
        </div>
    `;
}

function renderComplaints(container) {
    const complaints = Storage.getAll('complaints');
    container.innerHTML = `
        <div class="card border-0 shadow-sm p-4 mb-4" style="border-radius: 15px;">
            <h5 class="fw-bold mb-4">Grievance Management</h5>
            ${complaints.length ? complaints.map(c => `
                <div class="card mb-3 border bg-light-subtle">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <h6 class="fw-bold text-primary mb-0">${c.category}</h6>
                            <span class="badge ${c.status === 'Pending' ? 'bg-warning' : 'bg-success'}">${c.status}</span>
                        </div>
                        <p class="mb-2 small">${c.desc}</p>
                        <div class="d-flex justify-content-between align-items-center">
                            <small class="text-muted">By: ${c.studentId} | ${c.date}</small>
                            ${c.status === 'Pending' ? `<button class="btn btn-sm btn-outline-primary" onclick="resolveComplaint(${c.id})">Mark Resolved</button>` : ''}
                        </div>
                    </div>
                </div>
            `).join('') : '<p class="text-center text-muted py-4">No complaints recorded.</p>'}
        </div>
    `;
}

function renderNotices(container) {
    const notices = Storage.getAll('notices');
    container.innerHTML = `
        <div class="row g-4">
            <div class="col-md-4">
                <div class="card border-0 shadow-sm p-4" style="border-radius: 15px;">
                    <h5 class="fw-bold mb-3 text-primary">Post New Notice</h5>
                    <form id="noticeForm" onsubmit="handleNoticeSubmit(event)">
                        <div class="mb-3">
                            <label class="form-label small">Title</label>
                            <input type="text" class="form-control" id="noticeTitle" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label small">Priority</label>
                            <select class="form-select" id="noticePriority">
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label class="form-label small">Description</label>
                            <textarea class="form-control" id="noticeDesc" rows="3" required></textarea>
                        </div>
                        <button type="submit" class="btn btn-primary w-100 btn-sm">Publish Notice</button>
                    </form>
                </div>
            </div>
            <div class="col-md-8">
                <div class="card border-0 shadow-sm p-4" style="border-radius: 15px;">
                    <h5 class="fw-bold mb-4">Notice Archive</h5>
                    <div class="list-group">
                        ${notices.map(n => `
                            <div class="list-group-item list-group-item-action border-0 mb-2 bg-light rounded shadow-sm p-3">
                                <div class="d-flex w-100 justify-content-between align-items-center mb-2">
                                    <h6 class="mb-0 fw-bold">${n.title}</h6>
                                    <span class="badge ${n.priority === 'High' ? 'bg-danger' : 'bg-primary'} font-size-xs">${n.priority}</span>
                                </div>
                                <p class="mb-1 small text-muted">${n.desc}</p>
                                <small class="text-muted"><i class="far fa-calendar-alt me-1"></i> ${n.date}</small>
                            </div>
                        `).reverse().join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// --- STUDENT VIEWS ---

function renderStudentDashboard(container) {
    const user = Auth.getCurrentUser();
    container.innerHTML = `
        <div class="row g-4">
            <div class="col-lg-4">
                <div class="card border-0 shadow-sm p-4 text-center h-100" style="border-radius: 15px;">
                    <img src="https://ui-avatars.com/api/?name=${user.name}&background=4361ee&color=fff&size=128" class="rounded-circle mb-3 mx-auto shadow" width="100">
                    <h5 class="fw-bold mb-1">${user.name}</h5>
                    <p class="text-muted small mb-4">${user.rollNo}</p>
                    <div class="text-start">
                        <div class="mb-3 p-3 bg-light rounded">
                            <label class="small text-muted d-block">Room No</label>
                            <span class="fw-bold">Room ${user.room}</span>
                        </div>
                        <div class="mb-3 p-3 bg-light rounded">
                            <label class="small text-muted d-block">Department</label>
                            <span class="fw-bold">${user.dept}</span>
                        </div>
                        <div class="p-3 bg-light rounded">
                            <label class="small text-muted d-block">Fee Status</label>
                            <span class="badge ${user.feeStatus === 'Paid' ? 'bg-success' : 'bg-danger'}">${user.feeStatus}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-lg-8">
                 <div class="row g-4">
                    <div class="col-md-6">
                        <div class="card border-0 shadow-sm p-4 bg-primary text-white" style="border-radius: 15px;">
                            <h6 class="mb-4">Monthly Attendance</h6>
                            <h2 class="fw-bold mb-0">92%</h2>
                            <small class="opacity-75">Well done! Keep it up.</small>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card border-0 shadow-sm p-4 bg-info text-white" style="border-radius: 15px;">
                            <h6 class="mb-4">Pending Dues</h6>
                            <h2 class="fw-bold mb-0">${user.feeStatus === 'Paid' ? 'Rs 0' : 'Rs 12,000'}</h2>
                            <small class="opacity-75">Deadline: 5th of Month</small>
                        </div>
                    </div>
                    <div class="col-12">
                        <div class="card border-0 shadow-sm p-4" style="border-radius: 15px;">
                            <h6 class="fw-bold mb-3"><i class="fas fa-bullhorn text-primary me-2"></i>Recent Announcement</h6>
                            <div class="p-3 border rounded bg-light">
                                <h6 class="fw-bold mb-1">${Storage.getAll('notices')[0]?.title || 'No updates'}</h6>
                                <p class="text-muted small mb-0">${Storage.getAll('notices')[0]?.desc || ''}</p>
                            </div>
                        </div>
                    </div>
                 </div>
            </div>
        </div>
    `;
}

function renderStudentComplaints(container) {
    const user = Auth.getCurrentUser();
    const complaints = Storage.getAll('complaints').filter(c => c.studentId === user.rollNo);

    container.innerHTML = `
        <div class="row g-4">
            <div class="col-md-5">
                <div class="card border-0 shadow-sm p-4" style="border-radius: 15px;">
                    <h5 class="fw-bold mb-4">Lodge a Complaint</h5>
                    <form onsubmit="handleComplaintSubmit(event)">
                        <div class="mb-3">
                            <label class="form-label small">Issue Category</label>
                            <select class="form-select" id="compCategory">
                                <option value="Electricity">Electricity</option>
                                <option value="Water">Water</option>
                                <option value="Food/Mess">Food/Mess</option>
                                <option value="Cleaning">Cleaning</option>
                                <option value="Security">Security</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label class="form-label small">Detailed Description</label>
                            <textarea class="form-control" id="compDesc" rows="4" placeholder="Explain your issue..." required></textarea>
                        </div>
                        <button type="submit" class="btn btn-primary w-100">Submit Request</button>
                    </form>
                </div>
            </div>
            <div class="col-md-7">
                <div class="card border-0 shadow-sm p-4" style="border-radius: 15px;">
                    <h5 class="fw-bold mb-4">My Requests History</h5>
                    <div class="table-responsive">
                        <table class="table">
                            <thead><tr><th>Category</th><th>Status</th><th>Date</th></tr></thead>
                            <tbody>${complaints.length ? complaints.map(c => `
                                <tr>
                                    <td>${c.category}</td>
                                    <td><span class="badge ${c.status === 'Pending' ? 'bg-warning' : 'bg-success'}">${c.status}</span></td>
                                    <td><small>${c.date}</small></td>
                                </tr>
                            `).join('') : '<tr><td colspan="3" class="text-center">No history found</td></tr>'}</tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderStudentNotices(container) {
    const notices = Storage.getAll('notices');
    container.innerHTML = `
        <div class="card border-0 shadow-sm p-4" style="border-radius: 15px;">
            <h5 class="fw-bold mb-4">Campus Announcements</h5>
            <div class="row g-4">${notices.map(n => `
                <div class="col-md-6">
                    <div class="p-3 border rounded h-100 bg-white shadow-sm border-start border-4 border-${n.priority === 'High' ? 'danger' : 'primary'}">
                        <div class="d-flex justify-content-between mb-2">
                             <span class="badge ${n.priority === 'High' ? 'bg-danger' : 'bg-primary'}">${n.priority}</span>
                             <small class="text-muted">${n.date}</small>
                        </div>
                        <h6 class="fw-bold mb-2">${n.title}</h6>
                        <p class="text-muted small mb-0">${n.desc}</p>
                    </div>
                </div>
            `).reverse().join('')}</div>
        </div>
    `;
}

// --- HELPER LOGIC FUNCTIONS ---

function showAddStudentModal() {
    const rooms = Storage.getAll('rooms').filter(r => r.occupied < r.capacity);
    const select = document.getElementById('studRoomSelect');
    select.innerHTML = rooms.map(r => `<option value="${r.number}">Room ${r.number} (${r.capacity - r.occupied} left)</option>`).join('');
    addStudentModal.show();
}

function deleteRoom(id) {
    Swal.fire({ title: 'Delete Room?', text: "Removing room will affect student allocation!", icon: 'warning', showCancelButton: true }).then(res => {
        if (res.isConfirmed) { Storage.delete('rooms', id); renderView('rooms'); }
    });
}

function deleteStudent(id) {
    Swal.fire({ title: 'Remove Student?', text: "This will clear all records for this student.", icon: 'warning', showCancelButton: true }).then(res => {
        if (res.isConfirmed) {
            const students = Storage.getAll('students');
            const student = students.find(s => s.id === id);
            if (student) {
                // Free room space
                const rooms = Storage.getAll('rooms');
                const room = rooms.find(r => r.number === student.room);
                if (room) {
                    room.occupied -= 1;
                    room.status = "Available";
                    const db = getData();
                    db.rooms = rooms;
                    saveData(db);
                }
            }
            Storage.delete('students', id);
            renderView('students');
        }
    });
}

function updateFeeStatus(rollNo, status) {
    Storage.update('students', rollNo, { feeStatus: status });
    renderView('fees');
    Swal.fire('Updated', 'Fee status changed successfully', 'success');
}

function resolveComplaint(id) {
    Storage.update('complaints', id, { status: 'Resolved' });
    renderView('complaints');
}

function handleNoticeSubmit(e) {
    e.preventDefault();
    const notice = {
        title: document.getElementById('noticeTitle').value,
        priority: document.getElementById('noticePriority').value,
        desc: document.getElementById('noticeDesc').value,
        date: new Date().toISOString().split('T')[0]
    };
    Storage.add('notices', notice);
    renderView('notices');
    Swal.fire('Posted', 'Notice added to board', 'success');
}

function handleComplaintSubmit(e) {
    e.preventDefault();
    const user = Auth.getCurrentUser();
    const complaint = {
        studentId: user.rollNo,
        category: document.getElementById('compCategory').value,
        desc: document.getElementById('compDesc').value,
        status: 'Pending',
        date: new Date().toISOString().split('T')[0]
    };
    Storage.add('complaints', complaint);
    renderView('student-complaints');
    Swal.fire('Submitted', 'Your complaint has been logged.', 'success');
}

function saveAttendance() {
    Swal.fire('Saved!', 'Attendance summary recorded for today.', 'success');
}
