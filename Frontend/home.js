async function openWin(topic='topic7') {
  try {
    await fetch('http://localhost:8737/api/data/topic', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ topic }), // Properly stringify the body as an object
    });
  } catch (error) {
    console.log("An error occurred:", error);
  }
  window.location.href = "index.html";
}
