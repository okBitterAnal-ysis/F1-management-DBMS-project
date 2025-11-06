document.addEventListener("DOMContentLoaded", () => {
    const driverForm = document.getElementById("add-driver-form");
    const driverTableBody = document.querySelector("#driver-table tbody");
    
    const API_URL = "http://localhost:3001/api/drivers";

    /**
     * Helper function to add a new driver row to the table
     */
    function addDriverToTable(driver) {
        const newRow = document.createElement("tr");
        
        // UPDATED: Use your 'Driver_ID'
        newRow.dataset.id = driver.Driver_ID; 

        // UPDATED: Format the DOB to be readable (removes time)
        const formattedDOB = new Date(driver.DOB).toLocaleDateString();

        // UPDATED: Use your new column names
        newRow.innerHTML = `
            <td>${driver.FirstName}</td>
            <td>${driver.LastName}</td>
            <td>${driver.Nationality}</td>
            <td>${formattedDOB}</td>
            <td>${driver.Championships}</td>
            <td><button class="btn-delete">Delete</button></td>
        `;
        driverTableBody.appendChild(newRow);
    }

    /**
     * Function to fetch all drivers from the backend and display them
     */
    async function loadDrivers() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error("Network response was not ok");
            
            const drivers = await response.json();
            
            driverTableBody.innerHTML = ""; 
            
            drivers.forEach(driver => {
                addDriverToTable(driver);
            });
        } catch (error) {
            console.error("Error loading drivers:", error);
        }
    }

    // --- 1. Handle Form Submission (POST) ---
    driverForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        // UPDATED: Get values from new form fields
        const newDriver = {
            FirstName: document.getElementById("driver-firstname").value,
            LastName: document.getElementById("driver-lastname").value,
            Nationality: document.getElementById("driver-nationality").value,
            DOB: document.getElementById("driver-dob").value,
            Championships: document.getElementById("driver-championships").value || 0
        };

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(newDriver)
            });

            if (!response.ok) throw new Error("Error adding driver");

            const addedDriver = await response.json();
            addDriverToTable(addedDriver); 
            driverForm.reset();

        } catch (error) {
            console.error("Error adding driver:", error);
        }
    });

    // --- 2. Handle Deleting Rows (DELETE) ---
    driverTableBody.addEventListener("click", async (event) => {
        if (event.target.classList.contains("btn-delete")) {
            const row = event.target.closest("tr");
            const id = row.dataset.id; // This is the Driver_ID

            try {
                const response = await fetch(`${API_URL}/${id}`, {
                    method: "DELETE"
                });

                if (!response.ok) throw new Error("Error deleting driver");
                
                row.remove();

            } catch (error) {
                console.error("Error deleting driver:", error);
            }
        }
    });

    // --- Initial Load ---
    loadDrivers();
});