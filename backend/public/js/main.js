// Main UI functionality
function showLogin() {
    document.getElementById('loginModal').style.display = 'block';
    clearMessages();
}

function showRegister() {
    document.getElementById('registerModal').style.display = 'block';
    clearMessages();
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    clearMessages();
}

// Close modal when clicking outside of it
window.onclick = function(event) {
    const loginModal = document.getElementById('loginModal');
    const registerModal = document.getElementById('registerModal');
    
    if (event.target === loginModal) {
        closeModal('loginModal');
    }
    if (event.target === registerModal) {
        closeModal('registerModal');
    }
}

// Clear messages
function clearMessages() {
    const messages = document.querySelectorAll('.error-message, .success-message');
    messages.forEach(message => message.remove());
}

// Show loading spinner
function showLoading(formId) {
    const form = document.getElementById(formId);
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading';
    loadingDiv.id = `${formId}-loading`;
    form.appendChild(loadingDiv);
    loadingDiv.style.display = 'block';
}

// Hide loading spinner
function hideLoading(formId) {
    const loading = document.getElementById(`${formId}-loading`);
    if (loading) {
        loading.remove();
    }
}

// Show error message
function showError(formId, message) {
    hideLoading(formId);
    const form = document.getElementById(formId);
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    form.insertBefore(errorDiv, form.firstChild);
}

// Show success message
function showSuccess(formId, message) {
    hideLoading(formId);
    const form = document.getElementById(formId);
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    form.insertBefore(successDiv, form.firstChild);
}

// Check if user is already logged in when page loads
document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
        try {
            const userData = JSON.parse(user);
            redirectToDashboard(userData);
        } catch (error) {
            console.error('Error parsing user data:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
    }
});

// Logout functionality
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Hide all dashboards
    const dashboards = document.querySelectorAll('.dashboard');
    dashboards.forEach(dashboard => {
        dashboard.classList.remove('active');
    });
    
    // Show welcome page
    document.querySelector('.container').style.display = 'flex';
    
    // Clear any forms
    document.getElementById('loginForm').reset();
    document.getElementById('registerForm').reset();
}

// Redirect to appropriate dashboard based on role
function redirectToDashboard(user) {
    // Hide welcome page
    document.querySelector('.container').style.display = 'none';
    
    // Hide all dashboards first
    const dashboards = document.querySelectorAll('.dashboard');
    dashboards.forEach(dashboard => {
        dashboard.classList.remove('active');
    });
    
    // Show appropriate dashboard based on role
    const dashboardId = `${user.role}Dashboard`;
    let dashboard = document.getElementById(dashboardId);
    
    if (!dashboard) {
        // Create dashboard if it doesn't exist
        createDashboard(user);
        dashboard = document.getElementById(dashboardId);
    }
    
    if (dashboard) {
        dashboard.classList.add('active');
        updateDashboardContent(user);
    }
}

// Create dashboard HTML based on user role
function createDashboard(user) {
    const dashboardHTML = `
        <div id="${user.role}Dashboard" class="dashboard ${user.role}-dashboard">
            <div class="dashboard-header">
                <div>
                    <h1>${getDashboardTitle(user.role)}</h1>
                    <p>Welcome back, ${user.full_name}!</p>
                </div>
                <div class="user-info">
                    <span class="role-badge">${user.role.replace('_', ' ')}</span>
                    <span>${user.department}</span>
                    <button onclick="logout()" class="logout-btn">Logout</button>
                </div>
            </div>
            <div class="dashboard-content">
                <div class="dashboard-grid" id="${user.role}DashboardGrid">
                    <!-- Dashboard content will be loaded here -->
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', dashboardHTML);
}

// Get dashboard title based on role
function getDashboardTitle(role) {
    const titles = {
        'admin': 'Admin Dashboard',
        'inventory_manager': 'Inventory Manager Dashboard',
        'auditor': 'Auditor Dashboard',
        'employee': 'Employee Dashboard'
    };
    return titles[role] || 'Dashboard';
}

// Update dashboard content based on role
function updateDashboardContent(user) {
    const gridId = `${user.role}DashboardGrid`;
    const grid = document.getElementById(gridId);
    
    if (!grid) return;
    
    let content = '';
    
    switch (user.role) {
        case 'admin':
            content = `
                <div class="dashboard-card">
                    <h3>👥 User Management</h3>
                    <p class="stat-number">125</p>
                    <p>Total Users</p>
                </div>
                <div class="dashboard-card">
                    <h3>📦 Total Assets</h3>
                    <p class="stat-number">1,847</p>
                    <p>Registered Assets</p>
                </div>
                <div class="dashboard-card">
                    <h3>⚠️ Pending Approvals</h3>
                    <p class="stat-number">23</p>
                    <p>Awaiting Review</p>
                </div>
                <div class="dashboard-card">
                    <h3>📊 System Overview</h3>
                    <p>Monitor all system activities</p>
                    <button class="btn btn-primary" style="margin-top: 10px;">View Details</button>
                </div>
                <div class="dashboard-card">
                    <h3>🔧 System Settings</h3>
                    <p>Configure system parameters</p>
                    <button class="btn btn-primary" style="margin-top: 10px;">Settings</button>
                </div>
                <div class="dashboard-card">
                    <h3>📈 Reports</h3>
                    <p>Generate comprehensive reports</p>
                    <button class="btn btn-primary" style="margin-top: 10px;">Generate</button>
                </div>
            `;
            break;
            
        case 'inventory_manager':
            content = `
                <div class="dashboard-card">
                    <h3>📦 Inventory Overview</h3>
                    <p class="stat-number">956</p>
                    <p>Items in Stock</p>
                </div>
                <div class="dashboard-card">
                    <h3>⚠️ Low Stock Alerts</h3>
                    <p class="stat-number">12</p>
                    <p>Items Below Threshold</p>
                </div>
                <div class="dashboard-card">
                    <h3>🔄 Pending Transfers</h3>
                    <p class="stat-number">8</p>
                    <p>Awaiting Processing</p>
                </div>
                <div class="dashboard-card">
                    <h3>📝 Asset Registration</h3>
                    <p>Add new assets to inventory</p>
                    <button class="btn btn-primary" style="margin-top: 10px;">Add Asset</button>
                </div>
                <div class="dashboard-card">
                    <h3>🔍 Asset Search</h3>
                    <p>Find and manage existing assets</p>
                    <button class="btn btn-primary" style="margin-top: 10px;">Search</button>
                </div>
                <div class="dashboard-card">
                    <h3>📊 Inventory Reports</h3>
                    <p>Generate inventory reports</p>
                    <button class="btn btn-primary" style="margin-top: 10px;">Reports</button>
                </div>
            `;
            break;
            
        case 'auditor':
            content = `
                <div class="dashboard-card">
                    <h3>🔍 Audit Tasks</h3>
                    <p class="stat-number">15</p>
                    <p>Pending Audits</p>
                </div>
                <div class="dashboard-card">
                    <h3>✓ Completed Audits</h3>
                    <p class="stat-number">342</p>
                    <p>This Quarter</p>
                </div>
                <div class="dashboard-card">
                    <h3>⚠️ Discrepancies</h3>
                    <p class="stat-number">7</p>
                    <p>Requiring Attention</p>
                </div>
                <div class="dashboard-card">
                    <h3>📋 Audit Checklist</h3>
                    <p>Start new audit process</p>
                    <button class="btn btn-primary" style="margin-top: 10px;">New Audit</button>
                </div>
                <div class="dashboard-card">
                    <h3>📊 Audit Reports</h3>
                    <p>View and generate audit reports</p>
                    <button class="btn btn-primary" style="margin-top: 10px;">View Reports</button>
                </div>
                <div class="dashboard-card">
                    <h3>📈 Compliance Status</h3>
                    <p>Monitor compliance metrics</p>
                    <button class="btn btn-primary" style="margin-top: 10px;">Check Status</button>
                </div>
            `;
            break;
            
        case 'employee':
        default:
            content = `
                <div class="dashboard-card">
                    <h3>📦 My Assets</h3>
                    <p class="stat-number">12</p>
                    <p>Assigned to You</p>
                </div>
                <div class="dashboard-card">
                    <h3>📝 My Requests</h3>
                    <p class="stat-number">3</p>
                    <p>Pending Requests</p>
                </div>
                <div class="dashboard-card">
                    <h3>🔔 Notifications</h3>
                    <p class="stat-number">5</p>
                    <p>Unread Messages</p>
                </div>
                <div class="dashboard-card">
                    <h3>📋 Asset Request</h3>
                    <p>Request new assets or equipment</p>
                    <button class="btn btn-primary" style="margin-top: 10px;">New Request</button>
                </div>
                <div class="dashboard-card">
                    <h3>🔄 Transfer Assets</h3>
                    <p>Transfer assets to other employees</p>
                    <button class="btn btn-primary" style="margin-top: 10px;">Transfer</button>
                </div>
                <div class="dashboard-card">
                    <h3>📊 My Reports</h3>
                    <p>View your asset history</p>
                    <button class="btn btn-primary" style="margin-top: 10px;">View History</button>
                </div>
            `;
            break;
    }
    
    grid.innerHTML = content;
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded - Dead Stock Register System');
});