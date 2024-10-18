let menuicn = document.querySelector(".menuicn");
let nav = document.querySelector(".navcontainer");

menuicn.addEventListener("click", () => {
    nav.classList.toggle("navclose");
})

document.getElementById("deviceDataForm").addEventListener("submit", async function(event) {
    event.preventDefault();
    const deviceId = document.getElementById("deviceId").value;
    const dataType = document.getElementById("dataType").value;
    const value = document.getElementById("value").value;
    const data={
        deviceId,
        dataType,
        value,
    }
    try{
        const response = await fetch('http://localhost:8737/api/data', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
          });
          const result = await response.json();
        console.log('Response from server:', result);
        } catch (error) {
        console.error('Error:', error);
        }
    }
);

