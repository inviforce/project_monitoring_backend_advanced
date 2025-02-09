document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("topicForm").addEventListener("submit", async function(event) {
        event.preventDefault(); // Prevent default form submission behavior

        // Get values from the form inputs
        const topic = document.getElementById("topic").value;
        const name = document.getElementById("name").value;

        try {
            // Send the data to the server using fetch
            const response = await fetch('http://localhost:8737/api/topic_name', {
                method: 'POST', // HTTP method
                headers: {
                    'Content-Type': 'application/json', // Specify the content type
                },
                body: JSON.stringify({ topic, name }), // Send data as JSON
            });

            // Parse the response
            const responseData = await response.json();

            if (response.ok) {
                console.log("Success:", responseData);
                alert("Data submitted successfully!");
            } else {
                console.error("Error:", responseData);
                alert("Error submitting data. Check the console for details.");
            }
        } catch (error) {
            console.error("Network Error:", error);
            alert("Failed to connect to the server.");
        }

        // Optionally reset the form
        this.reset();
    });
});
