async function openWin(topic = 'topic7') {
  try {
      await fetch('http://localhost:8737/api/data/topic', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ topic }),
      });
  } catch (error) {
      console.log("An error occurred:", error);
  }
  window.location.href = "index.html";
}

// Toggle dropdown visibility
document.addEventListener('DOMContentLoaded', function () {
  const dashboardButton = document.querySelector('.common-btn');
  const dropdown = document.getElementById('dropdown');

  dashboardButton.addEventListener('click', function (event) {
      event.stopPropagation(); // Prevent event bubbling
      dropdown.classList.toggle('active'); // Toggle dropdown visibility
  });

  // Close dropdown if clicked outside
  document.addEventListener('click', function () {
      if (dropdown.classList.contains('active')) {
          dropdown.classList.remove('active');
      }
  });
});