// Mock data for demonstration
let currentUser = null;
let users = JSON.parse(localStorage.getItem('users')) || [];
let projects = JSON.parse(localStorage.getItem('projects')) || [];

// Add temporary registration storage
let tempRegistrationData = null;

// Initialize the application
function initApp() {
    checkAuthState();
    animateCounters();
    loadProjects();
}

// Authentication
function showAuthModal(mode) {
    const modal = document.getElementById('authModal');
    modal.style.display = 'block';
    
    switchAuthTab(mode);
}

function closeAuthModal() {
    document.getElementById('authModal').style.display = 'none';
}

function switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
    
    document.querySelector(`[onclick="switchAuthTab('${tab}')"]`).classList.add('active');
    document.getElementById(`${tab}Form`).classList.add('active');
}

function toggleRoleFields(event) {
    const passwordFields = document.getElementById('passwordFields');
    passwordFields.style.display = event.target.value ? 'block' : 'none';
}

// Fix register function to properly handle the registration flow
async function register(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    if (formData.get('password') !== formData.get('confirm-password')) {
        showToast('Passwords do not match!', 'error');
        return;
    }
    
    // Create proper user object
    const newUser = {
        id: Date.now().toString(),
        name: formData.get('full_name'),
        email: formData.get('email'),
        role: form.querySelector('select').value,
        password: formData.get('password'), // In real app, hash password
        createdAt: new Date().toISOString(),
        avatar: null
    };
    
    if (newUser.role === 'freelancer') {
        newUser.skills = [];
        newUser.portfolio = [];
        newUser.experience = '';
    } else {
        newUser.company = 'Your Company Name';
    }
    
    // Add to users array and save
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    showToast('Account created successfully!', 'success');
    closeAuthModal();
    
    // Login with the new user
    loginUser(newUser);
}

// Fix login function to handle null cases
async function login(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    const email = formData.get('email');
    const password = formData.get('password');
    
    // Check permanent users
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        showToast('Welcome back!', 'success');
        closeAuthModal();
        loginUser(user);
    } else {
        showToast('Invalid credentials', 'error');
    }
}

// Fix loginUser function to handle null cases
function loginUser(user) {
    if (!user || !user.id) {
        console.error('Invalid user object:', user);
        return;
    }
    
    currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(user));
    
    // Ensure updateUI only runs after we have valid user data
    setTimeout(() => {
        updateUI();
    }, 0);
}

// Ensure checkAuthState handles null gracefully
function checkAuthState() {
    try {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser && savedUser !== 'null' && savedUser !== 'undefined') {
            const parsedUser = JSON.parse(savedUser);
            if (parsedUser && parsedUser.id) {
                currentUser = parsedUser;
                updateUI();
            }
        }
    } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('currentUser');
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    updateUI();
    showPage('home');
}

// Add defensive programming to updateUI
function updateUI() {
    const authBtns = document.querySelector('.nav-auth').parentElement.querySelector('.nav-auth');
    const userMenu = document.getElementById('userMenu');
    const dashboardLink = document.getElementById('dashboardLink');
    const profileLink = document.getElementById('profileLink');
    const postProjectBtn = document.getElementById('postProjectBtn');
    
    if (currentUser) {
        // Hide auth buttons, show user menu
        document.querySelectorAll('.nav-auth .btn').forEach(btn => btn.style.display = 'none');
        
        if (userMenu) {
            userMenu.style.display = 'flex';
            const userName = document.getElementById('userName');
            const userAvatar = document.getElementById('userAvatar');
            
            if (userName) userName.textContent = currentUser.name || 'User';
            if (userAvatar) {
                userAvatar.src = currentUser.avatar || 
                    `https://via.placeholder.com/40x40/6366f1/ffffff?text=${(currentUser.name?.[0] || 'U')}`;
            }
        }
        
        if (dashboardLink) dashboardLink.style.display = 'block';
        if (profileLink) profileLink.style.display = 'block';
        
        if (postProjectBtn && currentUser.role === 'client') {
            postProjectBtn.style.display = 'block';
        }
    } else {
        // Show auth buttons, hide user menu
        document.querySelectorAll('.nav-auth .btn').forEach(btn => btn.style.display = 'inline-block');
        
        if (userMenu) userMenu.style.display = 'none';
        if (dashboardLink) dashboardLink.style.display = 'none';
        if (profileLink) profileLink.style.display = 'none';
        if (postProjectBtn) postProjectBtn.style.display = 'none';
    }
}

// Navigation
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    
    const targetPage = document.getElementById(`${pageId}Page`);
    const targetLink = document.querySelector(`[data-page="${pageId}"]`);
    
    if (targetPage) {
        targetPage.classList.add('active');
    }
    
    if (targetLink) {
        targetLink.classList.add('active');
    }
    
    // Check authentication for protected pages
    if ((pageId === 'profile' || pageId === 'dashboard') && !currentUser) {
        showAuthModal('login');
        return;
    }
    
    if (pageId === 'profile' && currentUser) {
        loadProfile();
    } else if (pageId === 'dashboard' && currentUser) {
        loadDashboard();
    } else if (pageId === 'browse') {
        loadProjects();
    }
}

// Projects
function loadProjects() {
    const container = document.getElementById('projectsContainer');
    container.innerHTML = '';
    
    const filteredProjects = projects.filter(p => {
        const searchTerm = document.getElementById('projectSearch').value.toLowerCase();
        const category = document.getElementById('categoryFilter').value;
        const budget = document.getElementById('budgetFilter').value;
        
        let match = true;
        if (searchTerm && !p.title.toLowerCase().includes(searchTerm) && !p.description.toLowerCase().includes(searchTerm)) match = false;
        if (category && p.category !== category) match = false;
        if (budget) {
            const [min, max] = budget.split('-');
            if (max && max !== '+') {
                if (p.budget < parseInt(min) || p.budget > parseInt(max)) match = false;
            } else if (min && p.budget < parseInt(min)) match = false;
        }
        
        return match;
    });
    
    filteredProjects.forEach(project => {
        const card = createProjectCard(project);
        container.appendChild(card);
    });
    
    if (filteredProjects.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No projects found.</p>';
    }
}

function createProjectCard(project) {
    const card = document.createElement('div');
    card.className = 'project-card';
    
    card.innerHTML = `
        <div class="project-header">
            <h3 class="project-title">${project.title}</h3>
            <span class="project-price">$${project.budget || 'TBD'}</span>
        </div>
        <p class="project-description">${project.description}</p>
        <div class="project-skills">
            ${(project.skills || []).slice(0, 3).map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
        </div>
        <div class="project-footer">
            <span>${new Date(project.createdAt).toLocaleDateString()}</span>
            <button class="btn btn-primary" onclick="openProjectModal(${project.id})">View Details</button>
        </div>
    `;
    
    return card;
}

function openProjectModal(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    
    const modal = document.getElementById('projectDetailModal');
    const content = document.getElementById('projectDetailContent');
    
    content.innerHTML = `
        <h2>${project.title}</h2>
        <p class="project-price">${project.budget ? `$${project.budget}` : 'Budget: To be discussed'}</p>
        <p>${project.description}</p>
        
        <div class="project-meta">
            <h4>Details</h4>
            <p><strong>Category:</strong> ${project.category || 'Not specified'}</p>
            <p><strong>Timeline:</strong> ${project.timeline || 'Not specified'}</p>
            <p><strong>Posted:</strong> ${new Date(project.createdAt).toLocaleDateString()}</p>
        </div>
        
        <div class="project-skills">
            <h4>Skills Required</h4>
            ${(project.skills || []).map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
        </div>
        
        ${currentUser && currentUser.role === 'freelancer' 
            ? `<button class="btn btn-primary" onclick="bidOnProject(${projectId})">Submit Proposal</button>`
            : !currentUser 
                ? '<button class="btn btn-primary" onclick="showAuthModal(\'register\')">Create Account to Bid</button>'
                : ''
        }
    `;
    
    modal.style.display = 'block';
}

function bidOnProject(projectID) {
    closeProjectModal();
    const project = projects.find(p => p.id === projectID);

    // Ensure the 'totalProjects' element exists and update its value
    const totalProjectsElement = document.getElementById('totalProjects');
    if (totalProjectsElement) {
        const currentTotal = parseInt(totalProjectsElement.textContent.trim(), 10) || 0;
        totalProjectsElement.textContent = currentTotal + 1;
    }
}

function closeProjectModal() {
    document.getElementById('projectDetailModal').style.display = 'none';
}

// Dashboard
function loadDashboard() {
    if (!currentUser) return;
    
    const title = document.getElementById('dashboardTitle');
    const stats = calculateUserStats();
    
    title.textContent = `${currentUser.name}'s Dashboard`;
    
    // Update stats
    document.getElementById('totalProjects').textContent = stats.total;
    document.getElementById('activeProjects').textContent = stats.active;
    document.getElementById('completedProjects').textContent = stats.completed;
    document.getElementById('totalEarnings').textContent = `$${stats.earnings}`;
    
    // Load projects
    loadUserProjects();
}

function calculateUserStats() {
    const userProjects = projects.filter(p => p.clientId === currentUser.id || p.freelancerId === currentUser.id);
    
    return {
        total: userProjects.length,
        active: userProjects.filter(p => p.status === 'active').length,
        completed: userProjects.filter(p => p.status === 'completed').length,
        earnings: userProjects.filter(p => p.status === 'completed' && p.freelancerId === currentUser.id)
            .reduce((sum, p) => sum + (p.budget || 0), 0)
    };
}

function loadUserProjects() {
    const container = document.getElementById('userProjects');
    const userProjects = projects.filter(p => p.clientId === currentUser.id || p.freelancerId === currentUser.id);
    
    container.innerHTML = '';
    
    if (userProjects.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No projects yet.</p>';
        return;
    }
    
    userProjects.forEach(project => {
        const card = createUserProjectCard(project);
        container.appendChild(card);
    });
}

function createUserProjectCard(project) {
    const card = document.createElement('div');
    card.className = 'project-card';
    
    card.innerHTML = `
        <h3>${project.title}</h3>
        <p>${project.description}</p>
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <span class="project-price">$${project.budget || 'TBD'}</span>
            <span style="color: var(--text-secondary); font-size: 0.875rem;">${project.status}</span>
        </div>
    `;
    
    return card;
}

// Profile
function loadProfile() {
    if (!currentUser) return;
    
    document.getElementById('profileName').textContent = currentUser.name;
    document.getElementById('profileRole').textContent = currentUser.role === 'freelancer' ? 'Freelancer' : 'Client';
    document.getElementById('profileAvatar').src = currentUser.avatar || 'https://via.placeholder.com/120x120/6366f1/ffffff?text=' + (currentUser.name?.[0] || 'U');
    
    if (currentUser.role === 'freelancer') {
        document.getElementById('freelancerSection').style.display = 'block';
        document.getElementById('clientSection').style.display = 'none';
        loadFreelancerProfile();
    } else {
        document.getElementById('freelancerSection').style.display = 'none';
        document.getElementById('clientSection').style.display = 'block';
    }
}

function loadFreelancerProfile() {
    const skillsContainer = document.getElementById('skillsContainer');
    skillsContainer.innerHTML = `
        <button class="add-skill-btn" onclick="addSkill()">
            <i class="fas fa-plus"></i> Add Skill
        </button>
    `;
    
    (currentUser.skills || []).forEach(skill => {
        const skillEl = document.createElement('span');
        skillEl.className = 'skill-tag';
        skillEl.textContent = skill;
        skillEl.onclick = () => removeSkill(skill);
        skillsContainer.prepend(skillEl);
    });
}

function addSkill() {
    const skill = prompt('Enter a skill:');
    if (skill && !currentUser.skills.includes(skill)) {
        currentUser.skills = [...(currentUser.skills || []), skill];
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        loadFreelancerProfile();
    }
}

function removeSkill(skill) {
    currentUser.skills = currentUser.skills.filter(s => s !== skill);
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    loadFreelancerProfile();
}

function editProfile() {
    const name = prompt('Enter your name:', currentUser.name);
    if (name) {
        currentUser.name = name;
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        if (userIndex !== -1) {
            users[userIndex] = currentUser;
            localStorage.setItem('users', JSON.stringify(users));
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            loadProfile();
        }
    }
}

function uploadAvatar() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                currentUser.avatar = e.target.result;
                const userIndex = users.findIndex(u => u.id === currentUser.id);
                if (userIndex !== -1) {
                    users[userIndex] = currentUser;
                    localStorage.setItem('users', JSON.stringify(users));
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    document.getElementById('profileAvatar').src = currentUser.avatar;
                }
            };
            reader.readAsDataURL(file);
        }
    };
    input.click();
}

// Project posting
function showPostProject() {
    const modal = document.getElementById('projectDetailModal');
    const content = document.getElementById('projectDetailContent');
    
    content.innerHTML = `
        <h2>Post New Project</h2>
        <form onsubmit="createProject(event)">
            <div class="form-group">
                <label>Project Title</label>
                <input type="text" required>
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea required rows="4"></textarea>
            </div>
            <div class="form-group">
                <label>Category</label>
                <select required>
                    <option value="">Select category</option>
                    <option value="web">Web Development</option>
                    <option value="mobile">Mobile Development</option>
                    <option value="design">Design</option>
                    <option value="writing">Writing</option>
                    <option value="marketing">Marketing</option>
                </select>
            </div>
            <div class="form-group">
                <label>Budget Range</label>
                <input type="number" placeholder="0" required>
            </div>
            <div class="form-group">
                <label>Timeline</label>
                <select required>
                    <option value="">Select timeline</option>
                    <option value="1 week">1 week</option>
                    <option value="2 weeks">2 weeks</option>
                    <option value="1 month">1 month</option>
                    <option value="3 months">3 months</option>
                </select>
            </div>
            <button type="submit" class="btn btn-primary">Post Project</button>
        </form>
    `;
    
    modal.style.display = 'block';
}

function createProject(event) {
    event.preventDefault();
    
    if (!currentUser) {
        showToast('Please log in first', 'error');
        return;
    }
    
    const form = event.target;
    const formData = new FormData(form);
    
    const project = {
        id: Date.now(),
        title: formData.get('project_title') || `Project ${Date.now()}`,
        description: formData.get('description'),
        category: formData.get('category'),
        budget: parseInt(formData.get('budget')) || null,
        timeline: formData.get('timeline'),
        clientId: currentUser.id,
        status: 'open',
        createdAt: new Date().toISOString()
    };
    
    projects.push(project);
    localStorage.setItem('projects', JSON.stringify(projects));
    
    showToast('Project posted successfully!', 'success');
    closeProjectModal();
    loadProjects();
}

// Utility functions
function animateCounters() {
    document.querySelectorAll('[data-count]').forEach(el => {
        const target = parseInt(el.dataset.count);
        animateValue(el, 0, target, 2000);
    });
    
    document.querySelectorAll('[data-amount]').forEach(el => {
        const target = parseInt(el.dataset.amount);
        animateValue(el, 0, target, 2000, (val) => `$${val.toLocaleString()}`);
    });
}

function animateValue(element, start, end, duration, formatter = (val) => val) {
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const current = Math.floor(start + (end - start) * progress);
        
        element.textContent = formatter(current);
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Initialize some mock data
if (projects.length === 0) {
    projects = [
        {
            id: 1,
            title: 'Build E-commerce Website',
            description: 'Need a modern e-commerce website with React and Node.js. Should include product listings, cart, and payment integration.',
            category: 'web',
            budget: 2500,
            timeline: '1 month',
            clientId: '1001',
            status: 'open',
            skills: ['React', 'Node.js', 'MongoDB', 'Stripe'],
            createdAt: new Date('2024-01-15').toISOString()
        },
        {
            id: 2,
            title: 'Mobile App UI Design',
            description: 'Design a beautiful mobile app for a fitness tracker. Need clean, modern design with great UX.',
            category: 'design',
            budget: 800,
            timeline: '2 weeks',
            clientId: '1002',
            status: 'open',
            skills: ['Figma', 'UI/UX', 'Mobile Design', 'Adobe XD'],
            createdAt: new Date('2024-01-20').toISOString()
        },
        {
            id: 3,
            title: 'Content Writing for Blog',
            description: 'Need 10 high-quality blog posts about technology and productivity.',
            category: 'writing',
            budget: 400,
            timeline: '3 weeks',
            clientId: '1003',
            status: 'open',
            skills: ['Content Writing', 'SEO', 'Blog Posts', 'Tech Writing'],
            createdAt: new Date('2024-01-10').toISOString()
        }
    ];
    localStorage.setItem('projects', JSON.stringify(projects));
}

// Event listeners
document.addEventListener('DOMContentLoaded', initApp);
document.querySelector('#projectSearch').addEventListener('input', loadProjects);
document.querySelector('#categoryFilter').addEventListener('change', loadProjects);
document.querySelector('#budgetFilter').addEventListener('change', loadProjects);

// Add navigation event listeners
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = e.target.dataset.page;
        if (page) {
            showPage(page);
        }
    });
});

// Close modals when clicking outside
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
});