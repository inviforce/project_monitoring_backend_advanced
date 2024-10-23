// timeRange.js
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

    timeRangeForm.addEventListener('submit', function(event) {
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
            isDataSelected: true,
            startDate: startDate,
            startTime: startTime,
            endDate: endDate,
            endTime: endTime,
            startTimestamp: new Date(`${startDate}T${startTime}`).getTime(),
            endTimestamp: new Date(`${endDate}T${endTime}`).getTime()
        });

        // Add detailed console logs
        console.log('Form Submitted!');
        console.log('Start Date:', startDate);
        console.log('Start Time:', startTime);
        console.log('End Date:', endDate);
        console.log('End Time:', endTime);
        console.log('Complete timeRangeData:', timeRangeData);

        // Optional: Display the data on the page
        displayTimeRangeData();
    });
}

// Function to display the time range data on the page
function displayTimeRangeData() {
    // Create or get a display element
    let displayDiv = document.getElementById('timeRangeDisplay');
    if (!displayDiv) {
        displayDiv = document.createElement('div');
        displayDiv.id = 'timeRangeDisplay';
        document.body.appendChild(displayDiv);
    }

    // Update the display
    displayDiv.innerHTML = `
        <h3>Selected Time Range:</h3>
        <p>Start: ${timeRangeData.startDate} ${timeRangeData.startTime}</p>
        <p>End: ${timeRangeData.endDate} ${timeRangeData.endTime}</p>
    `;
}

// Add this to your exports/global assignments
if (typeof window !== 'undefined') {
    window.timeRangeData = timeRangeData;
    window.initializeTimeRange = initializeTimeRange;
    window.displayTimeRangeData = displayTimeRangeData;
} else {
    module.exports = {
        timeRangeData,
        initializeTimeRange,
        displayTimeRangeData
    };
}