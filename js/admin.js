// Password Toggle Function
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const icon = event.currentTarget.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Admin Data Management
const adminData = {
    complaints: [],
    suggestions: [],
    users: [],
    settings: {
        emailNotifications: 'all',
        sessionTimeout: 30
    }
};

// Session Management
let sessionTimeout = 30 * 60; // 30 minutes in seconds
let sessionTimer;
let lastActivity = Date.now();

function startSessionTimer() {
    updateSessionTimer();
    document.addEventListener('mousemove', resetSessionTimer);
    document.addEventListener('keypress', resetSessionTimer);
}

function updateSessionTimer() {
    const minutes = Math.floor(sessionTimeout / 60);
    const seconds = sessionTimeout % 60;
    document.getElementById('sessionTime').textContent = 
        `${minutes}:${seconds.toString().padStart(2, '0')}`;

    if (sessionTimeout > 0) {
        sessionTimeout--;
        sessionTimer = setTimeout(updateSessionTimer, 1000);
    } else {
        handleLogout();
    }
}

function resetSessionTimer() {
    if (Date.now() - lastActivity > 1000) {
        sessionTimeout = 30 * 60;
        lastActivity = Date.now();
    }
}

// Authentication UI Functions
function showAdminLogin() {
    document.getElementById('adminLogin').style.display = 'flex';
    document.getElementById('forgotPassword').style.display = 'none';
    document.getElementById('adminSignup').style.display = 'none';
    resetForm('adminLoginForm');
    resetForm('forgotPasswordForm');
    resetForm('adminSignupForm');
}

function showForgotPassword() {
    document.getElementById('adminLogin').style.display = 'none';
    document.getElementById('forgotPassword').style.display = 'flex';
    document.getElementById('adminSignup').style.display = 'none';
    resetForm('adminLoginForm');
    resetForm('forgotPasswordForm');
    resetForm('adminSignupForm');
}

function showAdminSignup() {
    document.getElementById('adminLogin').style.display = 'none';
    document.getElementById('forgotPassword').style.display = 'none';
    document.getElementById('adminSignup').style.display = 'flex';
    resetForm('adminLoginForm');
    resetForm('forgotPasswordForm');
    resetForm('adminSignupForm');
}

// Authentication Handlers
async function handleAdminLogin(event) {
    if (!window.firebaseServices) {
        showNotification('error', 'App Error', 'Firebase is not initialized. Please refresh the page.');
        return;
    }
    const auth = window.firebaseServices.auth;
    const db = window.firebaseServices.db;
    event.preventDefault();
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            throw new Error('Invalid credentials');
        }

        const data = await response.json();
        if (data.role !== 'admin' && data.role !== 'agency_official') {
            throw new Error('Access denied. This portal is for administrators only.');
        }

        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminName', data.name);
        localStorage.setItem('adminDepartment', data.agencyAffiliation);
        
        showDashboard();
        startSessionTimer();
        resetForm('adminLoginForm');
    } catch (error) {
        showNotification('error', 'Login Failed', error.message);
    }
}

async function handleForgotPassword(event) {
    event.preventDefault();
    const email = document.getElementById('resetEmail').value;

    try {
        const response = await fetch('/api/auth/forgot-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        if (!response.ok) {
            throw new Error('Failed to send reset instructions');
        }

        showNotification('success', 'Reset Link Sent', 'If an account exists with this email, you will receive password reset instructions shortly.');
        setTimeout(showAdminLogin, 2000);
        resetForm('forgotPasswordForm');
    } catch (error) {
        showNotification('error', 'Reset Failed', error.message);
    }
}

async function handleAdminSignup(event) {
    if (!window.firebaseServices) {
        showNotification('error', 'App Error', 'Firebase is not initialized. Please refresh the page.');
        return;
    }
    const auth = window.firebaseServices.auth;
    const db = window.firebaseServices.db;
    event.preventDefault();
    
    try {
        // Show loading state
        const submitButton = event.target.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.innerHTML;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
        submitButton.disabled = true;

        const formData = {
            name: `${document.getElementById('firstName').value} ${document.getElementById('lastName').value}`,
            email: document.getElementById('signupEmail').value,
            password: document.getElementById('signupPassword').value,
            role: 'admin',
            agencyAffiliation: document.getElementById('signupDepartment').value,
            employeeId: document.getElementById('employeeId').value,
            phone: document.getElementById('phone')?.value || '',
            address: {}
        };

        // Client-side validation
        if (!formData.name || !formData.email || !formData.password) {
            throw new Error('Please fill in all required fields');
        }

        if (formData.password !== document.getElementById('confirmPassword').value) {
            throw new Error('Passwords do not match');
        }

        if (formData.password.length < 6) {
            throw new Error('Password must be at least 6 characters long');
        }

        if (!formData.agencyAffiliation || !formData.employeeId) {
            throw new Error('Department affiliation and Employee ID are required for administrators');
        }

        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            throw new Error('Server returned an invalid response format');
        }
        
        if (!response.ok) {
            throw new Error(data?.message || 'Failed to create account');
        }

        showNotification('success', 'Account Created', data.message || 'Your administrator account has been created successfully. Please login.');
        
        // Clear form and redirect to login after a short delay
        setTimeout(() => {
            resetForm('adminSignupForm');
            showAdminLogin();
        }, 2000);

    } catch (error) {
        console.error('Registration error:', error);
        showNotification('error', 'Registration Failed', error.message || 'An unexpected error occurred. Please try again.');
    } finally {
        // Restore button state
        const submitButton = event.target.querySelector('button[type="submit"]');
        submitButton.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
        submitButton.disabled = false;
    }
}

function handleLogout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminName');
    localStorage.removeItem('adminDepartment');
    clearTimeout(sessionTimer);
    window.location.reload();
}

// Dashboard Navigation
function showDashboard() {
    document.getElementById('adminLogin').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'block';
    document.getElementById('adminName').textContent = localStorage.getItem('adminName');
    loadDashboardData();
}

function showDashboardSection(section) {
    const sections = ['overview', 'complaints', 'suggestions', 'reports', 'settings'];
    sections.forEach(s => {
        const sectionElement = document.getElementById(`${s}Section`);
        if (sectionElement) {
            sectionElement.style.display = s === section ? 'block' : 'none';
        }
    });

    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('href') === `#${section}`) {
            item.classList.add('active');
        }
    });

    // Load section specific data
    if (section === 'suggestions') {
        loadSuggestions();
    }

    // Close sidebar on mobile after selection
    if (window.innerWidth <= 768) {
        document.querySelector('.sidebar').classList.remove('show');
    }
}

// Data Sync
async function syncWithMainSite() {
    if (!window.firebaseServices) {
        showNotification('error', 'App Error', 'Firebase is not initialized. Please refresh the page.');
        return false;
    }
    try {
        const response = await fetch('/api/complaints', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch complaints');
        }

        const data = await response.json();
        adminData.complaints = data;
        return true;
    } catch (error) {
        console.error('Error syncing data:', error);
        showNotification('error', 'Sync Failed', 'Failed to load complaints. Please try again.');
        return false;
    }
}

// Complaint Management
async function loadComplaints() {
    const success = await syncWithMainSite();
    if (success) {
        renderComplaintsTable();
        updateStats();
    }
}

function filterComplaints() {
    const statusFilter = document.getElementById('statusFilter').value;
    const departmentFilter = document.getElementById('departmentFilter').value;
    const dateFilter = document.getElementById('dateFilter').value;

    let filtered = [...adminData.complaints];

    if (statusFilter) {
        filtered = filtered.filter(c => c.status.toLowerCase() === statusFilter.toLowerCase());
    }
    if (departmentFilter) {
        filtered = filtered.filter(c => c.category === departmentFilter);
    }
    if (dateFilter) {
        filtered = filtered.filter(c => {
            const complaintDate = new Date(c.createdAt).toLocaleDateString();
            return complaintDate === new Date(dateFilter).toLocaleDateString();
        });
    }

    renderComplaintsTable(filtered);
}

function renderComplaintsTable(complaints = adminData.complaints) {
    const tbody = document.getElementById('complaintsTableBody');
    if (!tbody) {
        console.error('Complaints table body not found');
        return;
    }
    
    tbody.innerHTML = '';

    if (complaints.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem;">
                    <i class="fas fa-inbox fa-2x" style="color: var(--primary-color); margin-bottom: 1rem;"></i>
                    <p style="color: #6b7280;">No complaints found</p>
                </td>
            </tr>
        `;
        return;
    }

    complaints.forEach(complaint => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${complaint._id.substring(0, 8)}</td>
            <td>${new Date(complaint.createdAt).toLocaleDateString()}</td>
            <td>${complaint.category}</td>
            <td>${complaint.description ? complaint.description.substring(0, 50) + '...' : 'N/A'}</td>
            <td>${complaint.location || 'N/A'}</td>
            <td><span class="status-badge status-${complaint.status.toLowerCase()}">${complaint.status}</span></td>
            <td class="action-buttons">
                <button onclick="updateComplaintStatus('${complaint._id}', 'In Progress')"
                        ${complaint.status === 'In Progress' ? 'disabled' : ''}>
                    <i class="fas fa-clock"></i> In Progress
                </button>
                <button onclick="updateComplaintStatus('${complaint._id}', 'Resolved')"
                        ${complaint.status === 'Resolved' ? 'disabled' : ''}>
                    <i class="fas fa-check"></i> Resolve
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function updateComplaintStatus(id, newStatus) {
    if (!window.firebaseServices) {
        showNotification('error', 'App Error', 'Firebase is not initialized. Please refresh the page.');
        return;
    }
    const auth = window.firebaseServices.auth;
    const db = window.firebaseServices.db;
    try {
        const response = await fetch(`/api/complaints/${id}/status`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: newStatus,
                message: `Status updated to ${newStatus}`
            })
        });

        if (!response.ok) {
            throw new Error('Failed to update status');
        }

        await loadComplaints(); // Reload the complaints
        showNotification('success', 'Status Updated', `Complaint #${id.substring(0, 8)} has been marked as ${newStatus}`);
    } catch (error) {
        console.error('Error updating status:', error);
        showNotification('error', 'Update Failed', 'Failed to update complaint status. Please try again.');
    }
}

// Stats Management
function updateStats() {
    const department = localStorage.getItem('adminDepartment');
    let filteredComplaints = department === 'all' 
        ? adminData.complaints 
        : adminData.complaints.filter(c => c.category === department);

    const newCount = filteredComplaints.filter(c => c.status === 'Submitted').length;
    const inProgressCount = filteredComplaints.filter(c => c.status === 'In Progress').length;
    const resolvedCount = filteredComplaints.filter(c => c.status === 'Resolved').length;
    const totalCount = filteredComplaints.length;
    const responseRate = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0;

    // Update stats in the UI
    document.getElementById('newComplaintsCount').textContent = newCount;
    document.getElementById('inProgressCount').textContent = inProgressCount;
    document.getElementById('resolvedCount').textContent = resolvedCount;
    document.getElementById('responseRate').textContent = `${responseRate}%`;
}

// Analytics & Charts
let complaintChart;
let departmentChart;

function initializeCharts() {
    // Complaint Status Chart
    const statusCtx = document.getElementById('complaintStatusChart').getContext('2d');
    complaintChart = new Chart(statusCtx, {
        type: 'doughnut',
        data: {
            labels: ['Submitted', 'In Progress', 'Resolved'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: ['#fef3c7', '#dbeafe', '#dcfce7'],
                borderColor: ['#92400e', '#1e40af', '#166534'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                title: {
                    display: true,
                    text: 'Complaint Status Distribution'
                }
            }
        }
    });

    // Department Performance Chart
    const deptCtx = document.getElementById('departmentChart').getContext('2d');
    departmentChart = new Chart(deptCtx, {
        type: 'bar',
        data: {
            labels: ['Water', 'Electricity', 'Roads', 'Waste', 'Sanitation', 'Healthcare', 'Education', 'Safety'],
            datasets: [{
                label: 'Total Complaints',
                data: [0, 0, 0, 0, 0, 0, 0, 0],
                backgroundColor: '#2563eb'
            }, {
                label: 'Resolved',
                data: [0, 0, 0, 0, 0, 0, 0, 0],
                backgroundColor: '#10b981'
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    position: 'top'
                },
                title: {
                    display: true,
                    text: 'Department-wise Complaint Analysis'
                }
            }
        }
    });
}

function updateCharts() {
    // Update Complaint Status Chart
    const statusCounts = {
        'Submitted': adminData.complaints.filter(c => c.status === 'Submitted').length,
        'In Progress': adminData.complaints.filter(c => c.status === 'In Progress').length,
        'Resolved': adminData.complaints.filter(c => c.status === 'Resolved').length
    };

    complaintChart.data.datasets[0].data = [
        statusCounts['Submitted'],
        statusCounts['In Progress'],
        statusCounts['Resolved']
    ];
    complaintChart.update();

    // Update Department Performance Chart
    const departments = ['water', 'electricity', 'roads', 'waste', 'sanitation', 'healthcare', 'education', 'safety'];
    const totalComplaints = departments.map(dept => 
        adminData.complaints.filter(c => c.category === dept).length
    );
    const resolvedComplaints = departments.map(dept =>
        adminData.complaints.filter(c => c.category === dept && c.status === 'Resolved').length
    );

    departmentChart.data.datasets[0].data = totalComplaints;
    departmentChart.data.datasets[1].data = resolvedComplaints;
    departmentChart.update();
}

// Report Generation
function generateReport() {
    const reportType = document.getElementById('reportType').value;
    const reportData = {
        type: reportType,
        date: new Date().toLocaleDateString(),
        stats: {
            total: adminData.complaints.length,
            submitted: adminData.complaints.filter(c => c.status === 'Submitted').length,
            inProgress: adminData.complaints.filter(c => c.status === 'In Progress').length,
            resolved: adminData.complaints.filter(c => c.status === 'Resolved').length
        },
        departmentStats: {}
    };

    // Calculate department statistics
    ['water', 'electricity', 'roads', 'waste', 'sanitation', 'healthcare', 'education', 'safety'].forEach(dept => {
        const deptComplaints = adminData.complaints.filter(c => c.category === dept);
        reportData.departmentStats[dept] = {
            total: deptComplaints.length,
            resolved: deptComplaints.filter(c => c.status === 'Resolved').length,
            responseRate: deptComplaints.length > 0 
                ? Math.round((deptComplaints.filter(c => c.status === 'Resolved').length / deptComplaints.length) * 100) 
                : 0
        };
    });

    // Generate CSV
    let csv = 'Department,Total Complaints,Resolved,Response Rate\n';
    Object.entries(reportData.departmentStats).forEach(([dept, stats]) => {
        csv += `${dept},${stats.total},${stats.resolved},${stats.responseRate}%\n`;
    });

    // Create and download the report
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `complaint_report_${reportType}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// Export functionality
async function exportComplaints() {
    const department = localStorage.getItem('adminDepartment');
    
    if (!window.firebaseServices) {
        showNotification('error', 'App Error', 'Firebase is not initialized. Please refresh the page.');
        return;
    }
    try {
        const response = await fetch(`/api/complaints/export?format=csv&department=${department}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to export complaints');
        }

        // Create a blob from the response and download it
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'complaints.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        console.error('Error exporting complaints:', error);
        showNotification('error', 'Export Failed', 'Failed to export complaints. Please try again.');
    }
}

// Suggestions Management
async function loadSuggestions() {
    if (!window.firebaseServices) {
        showNotification('error', 'App Error', 'Firebase is not initialized. Please refresh the page.');
        return;
    }
    try {
        const response = await fetch('/api/suggestions', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load suggestions');
        }

        const suggestions = await response.json();
        adminData.suggestions = suggestions;
        renderSuggestions();
    } catch (error) {
        console.error('Error loading suggestions:', error);
        showNotification('error', 'Load Failed', 'Failed to load suggestions');
    }
}

function filterSuggestions() {
    const statusFilter = document.getElementById('suggestionStatusFilter').value;
    const categoryFilter = document.getElementById('suggestionCategoryFilter').value;

    let filtered = [...adminData.suggestions];

    if (statusFilter) {
        filtered = filtered.filter(s => s.status === statusFilter);
    }
    if (categoryFilter) {
        filtered = filtered.filter(s => s.category === categoryFilter);
    }

    renderSuggestions(filtered);
}

function renderSuggestions(suggestions = adminData.suggestions) {
    const grid = document.getElementById('suggestionsGrid');
    if (!grid) return;

    grid.innerHTML = '';
    
    if (suggestions.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-lightbulb fa-3x"></i>
                <p>No suggestions found</p>
            </div>
        `;
        return;
    }

    suggestions.forEach(suggestion => {
        const card = document.createElement('div');
        card.className = 'suggestion-card';
        card.innerHTML = `
            <h3>${suggestion.title}</h3>
            <p>${suggestion.description}</p>
            <div class="suggestion-meta">
                <span class="badge status-${suggestion.status}">${suggestion.status}</span>
                <span class="votes"><i class="fas fa-thumbs-up"></i> ${suggestion.votes}</span>
            </div>
            <div class="suggestion-actions">
                <select onchange="updateSuggestionStatus('${suggestion._id}', this.value)">
                    <option value="pending" ${suggestion.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="under_review" ${suggestion.status === 'under_review' ? 'selected' : ''}>Under Review</option>
                    <option value="approved" ${suggestion.status === 'approved' ? 'selected' : ''}>Approved</option>
                    <option value="rejected" ${suggestion.status === 'rejected' ? 'selected' : ''}>Rejected</option>
                </select>
            </div>
        `;
        grid.appendChild(card);
    });
    
    document.getElementById('suggestionsCount').textContent = suggestions.length;
}

async function updateSuggestionStatus(id, status) {
    if (!window.firebaseServices) {
        showNotification('error', 'App Error', 'Firebase is not initialized. Please refresh the page.');
        return;
    }
    const auth = window.firebaseServices.auth;
    const db = window.firebaseServices.db;
    try {
        const response = await fetch(`/api/suggestions/${id}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify({ status })
        });

        if (!response.ok) {
            throw new Error('Failed to update status');
        }

        await loadSuggestions();
        showNotification('success', 'Status Updated', `Suggestion status updated to ${status}`);
    } catch (error) {
        console.error('Error updating suggestion:', error);
        showNotification('error', 'Update Failed', error.message);
    }
}

// Form Management
function resetForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    form.reset();
    form.classList.add('form-reset');
    setTimeout(() => form.classList.remove('form-reset'), 300);
}

// Utility Functions
function showNotification(type, title, message) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <div>
            <h4>${title}</h4>
            <p>${message}</p>
        </div>
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.classList.add('hiding');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Responsive Layout
function handleResponsiveLayout() {
    const menuToggle = document.getElementById('menuToggle');
    if (window.innerWidth <= 768) {
        menuToggle.style.display = 'block';
        document.querySelector('.sidebar').classList.remove('show');
    } else {
        menuToggle.style.display = 'none';
        document.querySelector('.sidebar').classList.remove('show');
    }
}

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('show');
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) {
        showDashboard();
        startSessionTimer();
    }
    handleResponsiveLayout();
    window.addEventListener('resize', handleResponsiveLayout);
    if (document.getElementById('admin-dashboard')) {
        initializeCharts();
    }
}); 