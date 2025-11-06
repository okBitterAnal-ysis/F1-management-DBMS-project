/* ======== GLOBAL DATA CACHE ======== */
// We will fetch data from the API and store it here
let allDriverStandings = [];
let allTeamStandings = [];
let allRaces = [];
let appDataLoaded = false; // Prevents multiple fetches

/* ======== DOM SELECTORS ======== */
const navMenu = document.getElementById('nav-menu');
const navToggle = document.getElementById('nav-toggle');
const navClose = document.getElementById('nav-close');
const navLinks = document.querySelectorAll('.nav-link');
const pages = document.querySelectorAll('.page');
const modalContainer = document.getElementById('modal-container');
const modalCloseBtn = document.getElementById('modal-close-btn');

// ======== ADMIN & API GLOBALS ========
const API_URL = "http://localhost:3001/api";
const driverForm = document.getElementById('driver-form');
const driverTableBody = document.getElementById('admin-driver-table-body');
const formTitle = document.getElementById('form-title');
const formSubmitBtn = document.getElementById('form-submit-btn');
const formCancelBtn = document.getElementById('form-cancel-btn');

let isEditMode = false;
let editDriverId = null;


/* ======== MOBILE MENU ======== */
if (navToggle) {
    navToggle.addEventListener('click', () => {
        navMenu.classList.add('show-menu');
    });
}

if (navClose) {
    navClose.addEventListener('click', () => {
        navMenu.classList.remove('show-menu');
    });
}

/* ======== PAGE NAVIGATION ======== */
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href').substring(1);

        // Set active link
        navLinks.forEach(nav => nav.classList.remove('active-link'));
        link.classList.add('active-link');

        // Show target page
        pages.forEach(page => {
            if (page.id === targetId) {
                page.classList.add('active');
            } else {
                page.classList.remove('active');
            }
        });

        // Load admin page data (if admin)
        if (targetId === 'admin') {
            loadAdminPage();
        }

        // Close mobile menu
        navMenu.classList.remove('show-menu');
    });
});

// Set Home as default active page
document.getElementById('home').classList.add('active');


/* ======== DATA LOADING & POPULATION ======== */
document.addEventListener('DOMContentLoaded', () => {
    // Load all data on initial page load
    loadAllApplicationData();

    // ======== ADMIN FORM LISTENERS ========
    if (driverForm) {
        driverForm.addEventListener('submit', handleFormSubmit);
    }
    if (formCancelBtn) {
        formCancelBtn.addEventListener('click', resetForm);
    }
    if (driverTableBody) {
        driverTableBody.addEventListener('click', handleTableClick);
    }
});

// NEW: Main data fetcher
async function loadAllApplicationData() {
    if (appDataLoaded) return; // Don't load more than once

    try {
        // Fetch all data in parallel
        const [driverRes, teamRes, raceRes] = await Promise.all([
            fetch(`${API_URL}/driver-standings`),
            fetch(`${API_URL}/team-standings`),
            fetch(`${API_URL}/races`)
        ]);

        if (!driverRes.ok) throw new Error('Failed to fetch driver standings');
        if (!teamRes.ok) throw new Error('Failed to fetch team standings');
        if (!raceRes.ok) throw new Error('Failed to fetch races');

        allDriverStandings = await driverRes.json();
        allTeamStandings = await teamRes.json();
        allRaces = await raceRes.json();

        // Now populate all sections
        loadHomepageRaces();
        loadRaces();
        loadDrivers();
        loadTeams();
        loadStandings();
        loadPodium();

        appDataLoaded = true;

    } catch (error) {
        console.error("Error loading application data:", error);
        alert("Error loading data from server. Is the backend running?");
    }
}

// 1. Load Homepage Races (Updated)
function loadHomepageRaces() {
    const container = document.getElementById('upcoming-race-grid');
    if (!container) return;
    
    // Get the first 3 races from the data
    const upcomingRaces = allRaces.slice(0, 3);
    
    let html = '';
    upcomingRaces.forEach(race => {
        // const raceDate = new Date(race.Date).toLocaleDateString(); // No Date column
        html += `
            <article class="upcoming-race-card">
                <h3>${race.Name}</h3>
                <p>${race.Location}</p>
                <p><strong>Race ID: ${race.Race_ID}</strong></p> 
            </article>
        `;
    });
    container.innerHTML = html;
}

// 2. Load Races (Updated)
function loadRaces() {
    const container = document.getElementById('race-list-container');
    if (!container) return;
    
    let html = '';
    allRaces.forEach(race => {
        // const raceDate = new Date(race.Date).toLocaleDateString(); // No Date column
        html += `
            <article class="race-card">
                <div class="race-card-icon-placeholder">
                    ${race.Location}
                </div>
                <div class="race-card-content">
                    <div>
                        <h3 class="race-card-title">${race.Name}</h3>
                        <p class.race-card-date">${race.Location}</p>
                    </div>
                    <span class="details-btn" data-modal-type="race" data-id="${race.Race_ID}">
                        View Details
                    </span>
                </div>
            </article>
        `;
    });
    container.innerHTML = html;
}

// 3. Load Drivers (Updated)
function loadDrivers() {
    const container = document.getElementById('driver-grid-container');
    if (!container) return;
    
    let html = '';
    allDriverStandings.forEach(driver => {
        html += `
            <article class="driver-card" data-modal-type="driver" data-id="${driver.Driver_ID}">
                <div class="driver-card-number">${driver.Number}</div>
                <p class="driver-card-team">${driver.TeamName || 'No Team'}</p>
                <h3 class="driver-card-name">${driver.FirstName} ${driver.LastName}</h3>
                <p class="driver-card-points">${driver.Points} PTS</p>
            </article>
        `;
    });
    container.innerHTML = html;
}

// 4. Load Teams (Updated)
function loadTeams() {
    const container = document.getElementById('team-gallery-container');
    if (!container) return;

    let html = '';
    allTeamStandings.forEach(team => {
        html += `
            <div class="team-card">
                <h3 class="team-card-name">${team.Name}</h3>
                <p class="team-card-spec">Engine: ${team.Engine || 'N/A'}</p>
            </div>
        `;
    });
    container.innerHTML = html;
}

// 5. Load Standings (Updated)
function loadStandings() {
    const driverBody = document.getElementById('driver-standings-body');
    const teamBody = document.getElementById('team-standings-body');

    if (driverBody) {
        let driverHtml = '';
        allDriverStandings.forEach((driver, index) => {
            driverHtml += `
                <tr class="${index === 0 ? 'top-row' : ''}">
                    <td>${index + 1}</td>
                    <td>${driver.FirstName} ${driver.LastName}</td>
                    <td>${driver.Nationality}</td>
                    <td>${driver.TeamName || 'No Team'}</td>
                    <td><strong>${driver.Points}</strong></td>
                </tr>
            `;
        });
        driverBody.innerHTML = driverHtml;
    }

    if (teamBody) {
        let teamHtml = '';
        allTeamStandings.forEach((team, index) => {
            teamHtml += `
                <tr class="${index === 0 ? 'top-row' : ''}">
                    <td>${index + 1}</td>
                    <td>${team.Name}</td>
                    <td><strong>${team.TotalPoints}</strong></td>
                </tr>
            `;
        });
        teamBody.innerHTML = teamHtml;
    }
}

// 6. Load Podium (Updated)
function loadPodium() {
    const container = document.getElementById('podium-grid-container');
    if (!container) return;

    // We assume data is already sorted by points from the API
    const podiumDrivers = {
        pos1: allDriverStandings.length > 0 ? allDriverStandings[0] : null,
        pos2: allDriverStandings.length > 1 ? allDriverStandings[1] : null,
        pos3: allDriverStandings.length > 2 ? allDriverStandings[2] : null
    };

    // Helper function to create card HTML
    const createPodiumCard = (driver, pos) => {
        if (!driver) {
             return `<div class="podium-card pos-${pos}"><h3 class="podium-name">N/A</h3></div>`; // Handle empty data
        }
        let rankText = (pos === 1) ? "1<span>st</span>" : (pos === 2) ? "2<span>nd</span>" : "3<span>rd</span>";
        return `
            <div class="podium-card pos-${pos}">
                <h2 class="pos-rank">${rankText}</h2>
                <div class="podium-number">${driver.Number}</div>
                <h3 class="podium-name">${driver.FirstName} ${driver.LastName}</h3>
                <p class="podium-team">${driver.TeamName || 'No Team'}</p>
                <p class="podium-points">${driver.Points} PTS</p>
            </div>
        `;
    };

    // Build HTML in 2-1-3 order for the grid layout
    let html = '';
    html += createPodiumCard(podiumDrivers.pos2, 2);
    html += createPodiumCard(podiumDrivers.pos1, 1);
    html += createPodiumCard(podiumDrivers.pos3, 3);
    
    container.innerHTML = html;
}


/* ======== MODAL & INTERACTIVITY (Event Delegation) ======== */
const modalBody = document.getElementById('modal-body');

document.addEventListener('click', (e) => {
    // --- Tab Switching Logic ---
    const tabBtn = e.target.closest('.tab-btn');
    if (tabBtn) {
        const tabId = tabBtn.dataset.tab;

        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        tabBtn.classList.add('active');

        // Update tab panels
        document.querySelectorAll('.tab-panel').forEach(panel => {
            if (panel.id === `tab-${tabId}`) {
                panel.classList.add('active');
            } else {
                panel.classList.remove('active');
            }
        });
    }

    // --- Modal Logic (Updated) ---
    const modalBtn = e.target.closest('[data-modal-type]');
    if (modalBtn) {
        const type = modalBtn.dataset.modalType;
        const id = modalBtn.dataset.id;
        
        if (type === 'race') {
            const race = allRaces.find(r => r.Race_ID.toString() === id);
            if (!race) return;
            modalBody.innerHTML = `
                <h2 class="modal-title">${race.Name}</h2>
                <p style="margin-bottom: 1rem;"><strong>Location: ${race.Location}</strong></p>
                <!-- <p>${race.Details}</p> -- No Details column in your schema -->
            `;
        }
        
        if (type === 'driver') {
            const driver = allDriverStandings.find(d => d.Driver_ID.toString() === id);
            if (!driver) return;
            modalBody.innerHTML = `
                <h2 class="modal-title">${driver.FirstName} ${driver.LastName} #${driver.Number}</h2>
                <div class="modal-stat">
                    <span>Team</span>
                    <strong>${driver.TeamName || 'No Team'}</strong>
                </div>
                <div class="modal-stat">
                    <span>Nationality</span>
                    <strong>${driver.Nationality}</strong>
                </div>
                <div class="modal-stat">
                    <span>Points (Champs)</span>
                    <strong>${driver.Points}</strong>
                </div>
                <div class="modal-stat">
                    <span>Championships</span>
                    <strong>${driver.Championships}</strong>
                </div>
            `;
        }
        
        modalContainer.classList.add('active');
    }
});

// Close Modal
modalCloseBtn.addEventListener('click', () => {
    modalContainer.classList.remove('active');
});

modalContainer.addEventListener('click', (e) => {
    if (e.target === modalContainer) {
        modalContainer.classList.remove('active');
    }
});

// ======== ADMIN CRUD FUNCTIONS ========
// This section handles the /api/drivers endpoint

// 1. (R)EAD: Load admin page (fetch drivers and render table)
async function loadAdminPage() {
    if (!driverTableBody) return; // Don't run if we're not on the admin page
    
    try {
        const response = await fetch(`${API_URL}/drivers`);
        if (!response.ok) throw new Error('Failed to fetch drivers');
        const drivers = await response.json();
        
        // Render the table
        driverTableBody.innerHTML = ''; // Clear existing table
        drivers.forEach(driver => {
            // Format DOB to YYYY-MM-DD
            const dob = new Date(driver.DOB).toISOString().split('T')[0];
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${driver.Driver_ID}</td>
                <td>${driver.FirstName}</td>
                <td>${driver.LastName}</td>
                <td>${driver.Nationality}</td>
                <td>${dob}</td>
                <td>${driver.Championships}</td>
                <td>
                    <button class="btn-action btn-edit" data-id="${driver.Driver_ID}">Edit</button>
                    <button class="btn-action btn-delete" data-id="${driver.Driver_ID}">Delete</button>
                </td>
            `;
            // Store the full driver data on the row for easy editing
            row.dataset.driver = JSON.stringify(driver);
            driverTableBody.appendChild(row);
        });
    } catch (error) {
        console.error("Error loading admin page:", error);
        driverTableBody.innerHTML = `<tr><td colspan="7">Error loading drivers. Is the server running?</td></tr>`;
    }
}

// 2. (C)REATE & (U)PDATE: Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(driverForm);
    const driverData = Object.fromEntries(formData.entries());
    
    try {
        let response;
        if (isEditMode) {
            // --- UPDATE (PUT) ---
            response = await fetch(`${API_URL}/drivers/${editDriverId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(driverData)
            });
        } else {
            // --- CREATE (POST) ---
            response = await fetch(`${API_URL}/drivers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(driverData)
            });
        }

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'API request failed');
        }
        
        // Success
        resetForm();
        loadAdminPage(); // Refresh the table
        
    } catch (error) {
        console.error("Error saving driver:", error);
        alert(`Error: ${error.message}`);
    }
}

// 3. (D)ELETE & (U)PDATE-Trigger: Handle clicks on Edit/Delete buttons
function handleTableClick(e) {
    const target = e.target;
    
    // --- DELETE ---
    if (target.classList.contains('btn-delete')) {
        const id = target.dataset.id;
        if (confirm(`Are you sure you want to delete driver ID ${id}?`)) {
            deleteDriver(id);
        }
    }
    
    // --- EDIT (Trigger) ---
    if (target.classList.contains('btn-edit')) {
        const row = target.closest('tr');
        const driver = JSON.parse(row.dataset.driver);
        
        // Fill the form
        driverForm.elements.FirstName.value = driver.FirstName;
        driverForm.elements.LastName.value = driver.LastName;
        driverForm.elements.Nationality.value = driver.Nationality;
        driverForm.elements.DOB.value = new Date(driver.DOB).toISOString().split('T')[0];
        driverForm.elements.Championships.value = driver.Championships;
        
        // Set edit mode
        isEditMode = true;
        editDriverId = driver.Driver_ID;
        formTitle.textContent = `Edit Driver (ID: ${driver.Driver_ID})`;
        formSubmitBtn.textContent = "Update Driver";
        formCancelBtn.style.display = 'inline-block';
        
        // Scroll to form
        driverForm.scrollIntoView({ behavior: 'smooth' });
    }
}

// 4. (D)ELETE: Actual delete function
async function deleteDriver(id) {
    try {
        const response = await fetch(`${API_URL}/drivers/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'API request failed');
        }
        
        // Success
        loadAdminPage(); // Refresh the table
        
    } catch (error) {
        console.error("Error deleting driver:", error);
        alert(`Error: ${error.message}`);
    }
}

// 5. Helper function to reset the form
function resetForm() {
    driverForm.reset();
    isEditMode = false;
    editDriverId = null;
    formTitle.textContent = "Add New Driver";
    formSubmitBtn.textContent = "Add Driver";
    formCancelBtn.style.display = 'none';
}