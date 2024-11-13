// Dashboard JS file

document.addEventListener("DOMContentLoaded", function() {
    const menuicn = document.querySelector(".menuicn");
    const nav = document.querySelector(".navcontainer");

    menuicn.addEventListener("click", () => {
        nav.classList.toggle("navclose");
    });

    document.getElementById("deviceDataForm").addEventListener("submit", async function(event) {
        event.preventDefault();
        const deviceId = document.getElementById("deviceId").value;
        const dataType = document.getElementById("dataType").value;
        const value = document.getElementById("value").value;

        const data = {
            deviceId,
            dataType,
            value,
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
        document.getElementById('powerFactorValue').textContent = data.powerFactor || 'NA';
        
    } catch (error) {
        console.error('Error fetching data:', error);
    }
});
