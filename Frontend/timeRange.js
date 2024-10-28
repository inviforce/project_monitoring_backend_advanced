const timeRangeData = {
    startDateTime: null,
    endDateTime: null,
    isDataSelected: false
};

function initializeTimeRange() {
    const timeRangeForm = document.getElementById('timeRangeForm');
    if (!timeRangeForm) {
        console.error('Time range form not found');
        return;
    }

    timeRangeForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        // Get form values
        const startDate = document.getElementById('startDate').value;
        const startTime = document.getElementById('startTime').value;
        const endDate = document.getElementById('endDate').value;
        const endTime = document.getElementById('endTime').value;

        // Update the timeRangeData object
        Object.assign(timeRangeData, {
            startDateTime: `${startDate}T${startTime}`,
            endDateTime: `${endDate}T${endTime}`,
            isDataSelected: true
        });

        // Display the data on the page
        displayTimeRangeData();

        try {
            // Updated URL to use port 3000
            const response = await fetch(`http://localhost:8737/datee?startTime=${timeRangeData.startDateTime}&endTime=${timeRangeData.endDateTime}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data || !data.voltage || !data.current || !data.energy || !data.powerFactor || !data.time) {
                throw new Error('Invalid data structure received from server');
            }
            
            // Store the data in localStorage for the graph page to access
            localStorage.setItem('graphData', JSON.stringify(data));
            console.log('Graph data stored in localStorage:', data);
            
            // Open graph.html in a new window/tab
            window.open('graph.html', '_blank');
        } catch (error) {
            console.error('Error fetching data:', error);
            alert('Error fetching data: ' + error.message);
        }
    });
}

function displayTimeRangeData() {
    const startDisplay = document.getElementById('displayStartDateTime');
    const endDisplay = document.getElementById('displayEndDateTime');
    
    if (startDisplay && endDisplay) {
        startDisplay.textContent = `Start DateTime: ${timeRangeData.startDateTime}`;
        endDisplay.textContent = `End DateTime: ${timeRangeData.endDateTime}`;
    }
}

// Ensure initializeTimeRange is called when the page is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeTimeRange();
});

// Expose functions if needed globally
if (typeof window !== 'undefined') {
    window.timeRangeData = timeRangeData;
    window.initializeTimeRange = initializeTimeRange;
    window.displayTimeRangeData = displayTimeRangeData;
}
