// Dashboard JS file
document.addEventListener("DOMContentLoaded", function() {
    const menuicn = document.querySelector(".menuicn");
    const nav = document.querySelector(".navcontainer");

    menuicn.addEventListener("click", () => {
        nav.classList.toggle("navclose");
    });
    document.addEventListener('DOMContentLoaded', function() {
        initializeTimeRange();
    });
    
    document.getElementById("deviceDataForm").addEventListener("submit", async function(event) {
        console.log("Form submission triggered");
        event.preventDefault();
        console.log("Form submission prevented!");
        const deviceId = document.getElementById("deviceId").value;
        const dataType = document.getElementById("dataType").value;
        const value = document.getElementById("value").value;
        let status=value
        const data = {
            deviceId,
            //dataType,
            status,
        };

        try {
            const response = await fetch('http://localhost:8737/api/data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();
            console.log('Response from server:', result);

            // Add the data to both tables
            addDataToTable(deviceId, dataType, value);
            addDataToReportContainer(deviceId, dataType, value, true);

            // Clear the form inputs
            document.getElementById("deviceId").value = "";
            document.getElementById("dataType").value = "";
            document.getElementById("value").value = "";

        } catch (error) {
            console.error('Error:', error);
            addDataToReportContainer(deviceId, dataType, value, false);
        }
    });

    function addDataToTable(deviceId, dataType, value) {
        const table = document.getElementById("dataTable").getElementsByTagName('tbody')[0];
        const newRow = table.insertRow();

        const cell1 = newRow.insertCell(0);
        const cell2 = newRow.insertCell(1);
        const cell3 = newRow.insertCell(2);

        cell1.textContent = deviceId;
        cell2.textContent = dataType;
        cell3.textContent = value;
    }

    function addDataToReportContainer(deviceId, dataType, value, isSuccess) {
        const itemsContainer = document.querySelector('.report-container .items');
        const newItem = document.createElement('div');
        newItem.className = 'item1';

        newItem.innerHTML = `
            <h3 class="t-op-nextlvl">${deviceId}</h3>
            <h3 class="t-op-nextlvl">${dataType}</h3>
            <h3 class="t-op-nextlvl">${value}</h3>
            <h3 class="t-op-nextlvl label-tag" style="background-color: ${isSuccess ? 'green' : 'red'}">
                ${isSuccess ? 'Yes' : 'Error'}
            </h3>
        `;

        // Insert the new item at the top of the list
        itemsContainer.insertBefore(newItem, itemsContainer.firstChild);
    }
    document.getElementById("timeRangeForm").addEventListener("submit", function(event) {
        event.preventDefault(); // Prevent the default form submission
    
        // Call the hey function to handle navigation
        hey();
    });

    function hey(){
        //window.location.href="graph.html";
    }
});



document.addEventListener("DOMContentLoaded", async function() {
    try {
        // Fetch the data from your API
        const response = await fetch('http://localhost:8737/api/data'); // Replace with your actual endpoint
        const data = await response.json();

        // Assuming the response is an object with properties for each metric 
        document.getElementById('voltageValue').textContent = data.voltage || 'NA';
        document.getElementById('currentValue').textContent = data.current || 'NA';
        document.getElementById('powerValue').textContent = data.power || 'NA';
        document.getElementById('energyValue').textContent = data.energy || 'NA';
        document.getElementById('frequencyValue').textContent = data.frequency || 'NA';
        document.getElementById('powerFactorValue').textContent = data.power_f || 'NA';
        
    } catch (error) {
        console.error('Error fetching data:', error);
    }
});

// AC toggle button 
async function updateStatus() {
    const acToggle = document.getElementById('acToggle');
    const acStatus = document.getElementById('acStatus');
    acStatus.textContent = acToggle.checked ? 'ON' : 'OFF';

    function getCookie(name) {
        return document.cookie
            .split("; ")
            .find(row => row.startsWith(name + "="))
            ?.split("=")[1] || null;
    }

    // Get user's email from cookies
    const userEmail = getCookie("email");

    // Prepare the data to send
    const acData = {
        deviceId: "MOTOR",
        status: acToggle.checked ? "ON" : "OFF",
        email: userEmail
    };

    console.log(acData);

    try {
        const response = await fetch("http://localhost:8737/api/data", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(acData),
        });

        const result = await response.json();
        console.log("AC Toggle Response:", result);
    } catch (error) {
        console.error("Error sending AC status:", error);
    }
}


// ✅ Define sender OUTSIDE `DOMContentLoaded` so it is accessible globally
async function sender(phase) {
    try {
        const payload = { phase: phase };  
        console.log("Sending payload:", payload);

        const response = await fetch('http://localhost:8737/api/topic/phase', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),  
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`);
        }

        const data = await response.text();
        console.log("Server Response:", data);
    } catch (error) {
        console.error("An error occurred:", error);
    }
}

// ✅ Attach `sender` to `window` to make it globally accessible
window.sender = sender;

// Add this to your index.js file



document.addEventListener('DOMContentLoaded', async function() {
    const phaseModal = document.getElementById('phaseModal');
    const mainContent = document.querySelector('.main-content');
    const phaseOptions = document.querySelectorAll('.phase-option');
    const confirmButton = document.getElementById('confirmPhase');
    const phaseIndicator = document.getElementById('phaseIndicator');
    
    let selectedPhase = null;

    // Phase selection handling
    phaseOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove active class from all options
            phaseOptions.forEach(opt => opt.classList.remove('active'));
            // Add active class to selected option
            this.classList.add('active');
            // Enable confirm button
            confirmButton.disabled = false;
            // Store selected phase
            selectedPhase = this.dataset.phase;
        });
    });

    // Confirm button handling
    confirmButton.addEventListener('click', async function() {
        if (selectedPhase) {
            try {
                // Send phase selection to server
                await sender(selectedPhase);
                
                // Hide modal and show dashboard
                phaseModal.style.display = 'none';
                mainContent.style.display = 'block';
                
                // Show phase indicator
                updatePhaseIndicator(selectedPhase);
                
                // Initialize WebSocket connection
                initializeWebSocket(selectedPhase);
                
                // Show success alert
                showAlert(`Now monitoring Phase ${selectedPhase}`);
                console.log(selectedPhase)
            } catch (error) {
                showAlert('Error selecting phase. Please try again.', 'error');
            }
        }
    });

    function updatePhaseIndicator(phase) {
        const indicator = document.getElementById('phaseIndicator');
        const phaseNum = document.getElementById('currentPhase');
        phaseNum.textContent = phase;
        indicator.style.display = 'block';
    }

        const pathParts = window.location.pathname.split("/"); 
        console.log(pathParts); 
        // Output: ["", "discography", "adharit", "deepak"]

        const label = pathParts[2];  // "adharit"
        const email = pathParts[3]; // "deepak"
        if (!label || !email) {
            console.error("Missing label or email in URL.");
            return;
        }

        // Initialize WebSocket globally
        window.socket = io("http://localhost:8737");

        function joinRoom(roomName) {
            console.log(roomName)
            socket.emit("joinRoom", roomName);
        }

        function leaveRoom(roomName) {
            socket.emit("leaveRoom", roomName);
        }

        socket.on("roomMessage", (message) => {
            console.log("Raw message received:", message);
        
            // Ensure message is an object (try parsing if needed)
            if (typeof message === "string") {
                try {
                    message = JSON.parse(message);
                } catch (error) {
                    console.error("Failed to parse message:", error);
                    return;
                }
            }
        
            console.log("Parsed message:", (message));
            let deviceNumber = Number(message.device);
            if (message.device === deviceNumber) {
                updateDashboard(message);
            }
        });
        

        try {
            const response = await fetch(`/api/user-subscription/${label}/${email}`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            console.log("Fetched subscription data:", data);

            // Ensure `data.host` and `data.topic` exist
            if (!data.host || !data.topic) {
                throw new Error("Missing required subscription data (host or topic).");
            }

            // Correct usage of data
            const roomName = `${data.host}_${data.topic}`;
            console.log("Joining room:", roomName);
            joinRoom(roomName);
        } catch (error) {
            console.error("Error fetching subscription:", error);
        }
        


    function updateDashboard(data) {
        //Update voltage
        if (data.voltage) {
            document.getElementById('voltageValue').textContent = `${data.voltage.toFixed(1)}V`;
        }
        
        // Update current
        if (data.current) {
            document.getElementById('currentValue').textContent = `${data.current.toFixed(2)}A`;
        }
        
        // Update power
        if (data.power) {
            document.getElementById('powerValue').textContent = `${data.power.toFixed(2)}W`;
        }
        
        // Update other values as needed
        console.log("ehy")
        updateGauges(data);
        updateLastRefreshTime();
    }

    function updateLastRefreshTime() {
        const now = new Date();
        document.getElementById('lastUpdateTime').textContent = 
            now.toLocaleTimeString();
    }

    function showAlert(message, type = 'success') {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            border-radius: 10px;
            color: white;
            background: ${type === 'success' ? '#4CAF50' : '#f44336'};
            z-index: 1000;
            animation: slideIn 0.5s ease;
        `;
        alert.textContent = message;
        
        document.body.appendChild(alert);
        
        setTimeout(() => {
            alert.style.animation = 'slideOut 0.5s ease';
            setTimeout(() => alert.remove(), 500);
        }, 3000);
    }
});


// ✅ DOMContentLoaded only for other setup tasks
document.addEventListener("DOMContentLoaded", function() {
    const menuicn = document.querySelector(".menuicn");
    const nav = document.querySelector(".navcontainer");

    menuicn.addEventListener("click", () => {
        nav.classList.toggle("navclose");
    });

    // ✅ Ensure initializeTimeRange() runs when DOM is loaded
    initializeTimeRange();
});
