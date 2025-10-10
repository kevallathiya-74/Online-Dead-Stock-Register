// Authentication functionality
const API_BASE_URL = window.location.origin + '/api';

// Login form handler
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
});

// Handle login form submission
async function handleLogin(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const credentials = {
        email: formData.get('email'),
        password: formData.get('password')
    };
    
    showLoading('loginForm');
    clearMessages();
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Store authentication data
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            showSuccess('loginForm', 'Login successful! Redirecting...');
            
            // Close modal and redirect to dashboard
            setTimeout(() => {
                closeModal('loginModal');
                redirectToDashboard(data.user);
            }, 1500);
            
        } else {
            showError('loginForm', data.message || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('loginForm', 'Network error. Please try again.');
    }
}

// Handle register form submission
async function handleRegister(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');
    
    // Validate password match
    if (password !== confirmPassword) {
        showError('registerForm', 'Passwords do not match');
        return;
    }
    
    const userData = {
        full_name: formData.get('full_name'),
        email: formData.get('email'),
        password: password,
        department: formData.get('department'),
        role: formData.get('role')
    };
    
    showLoading('registerForm');
    clearMessages();
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Store authentication data
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            showSuccess('registerForm', 'Registration successful! Redirecting...');
            
            // Close modal and redirect to dashboard
            setTimeout(() => {
                closeModal('registerModal');
                redirectToDashboard(data.user);
            }, 1500);
            
        } else {
            showError('registerForm', data.message || 'Registration failed');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showError('registerForm', 'Network error. Please try again.');
    }
}

// Check authentication status
function isAuthenticated() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return token && user;
}

// Get current user data
function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
        try {
            return JSON.parse(userStr);
        } catch (error) {
            console.error('Error parsing user data:', error);
            return null;
        }
    }
    return null;
}

// Get authentication token
function getAuthToken() {
    return localStorage.getItem('token');
}

// Make authenticated API request
async function authenticatedFetch(url, options = {}) {
    const token = getAuthToken();
    
    const defaultHeaders = {
        'Content-Type': 'application/json',
    };
    
    if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
    }
    
    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers
        }
    };
    
    try {
        const response = await fetch(url, config);
        
        // If unauthorized, redirect to login
        if (response.status === 401) {
            logout();
            return null;
        }
        
        return response;
    } catch (error) {
        console.error('API request error:', error);
        throw error;
    }
}

// Password strength validator
function validatePassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const errors = [];
    
    if (password.length < minLength) {
        errors.push(`Password must be at least ${minLength} characters long`);
    }
    if (!hasUpperCase) {
        errors.push('Password must contain at least one uppercase letter');
    }
    if (!hasLowerCase) {
        errors.push('Password must contain at least one lowercase letter');
    }
    if (!hasNumbers) {
        errors.push('Password must contain at least one number');
    }
    if (!hasSpecialChar) {
        errors.push('Password must contain at least one special character');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

// Email validation
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Form validation
function validateForm(formData, formType) {
    const errors = [];
    
    if (formType === 'register') {
        const fullName = formData.get('full_name');
        const email = formData.get('email');
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');
        const department = formData.get('department');
        const role = formData.get('role');
        
        if (!fullName || fullName.trim().length < 2) {
            errors.push('Full name must be at least 2 characters long');
        }
        
        if (!email || !validateEmail(email)) {
            errors.push('Please enter a valid email address');
        }
        
        if (!password) {
            errors.push('Password is required');
        } else {
            const passwordValidation = validatePassword(password);
            if (!passwordValidation.isValid) {
                errors.push(...passwordValidation.errors);
            }
        }
        
        if (password !== confirmPassword) {
            errors.push('Passwords do not match');
        }
        
        if (!department) {
            errors.push('Please select a department');
        }
        
        if (!role) {
            errors.push('Please select a role');
        }
    }
    
    if (formType === 'login') {
        const email = formData.get('email');
        const password = formData.get('password');
        
        if (!email || !validateEmail(email)) {
            errors.push('Please enter a valid email address');
        }
        
        if (!password) {
            errors.push('Password is required');
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

// Initialize auth system
document.addEventListener('DOMContentLoaded', function() {
    // Add form validation on input
    const inputs = document.querySelectorAll('input[type="email"], input[type="password"]');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateInputField(this);
        });
    });
});

// Validate individual input field
function validateInputField(input) {
    const value = input.value.trim();
    const type = input.type;
    const name = input.name;
    
    // Remove existing error styling
    input.classList.remove('error');
    
    let isValid = true;
    
    if (type === 'email' && value) {
        isValid = validateEmail(value);
    }
    
    if (type === 'password' && value && name === 'password') {
        const validation = validatePassword(value);
        isValid = validation.isValid;
    }
    
    if (!isValid) {
        input.classList.add('error');
    }
}

// Add CSS for error styling
const style = document.createElement('style');
style.textContent = `
    input.error {
        border-color: #dc3545 !important;
        box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
    }
`;
document.head.appendChild(style);