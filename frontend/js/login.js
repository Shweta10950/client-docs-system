document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById('loginForm');
  const errorMsg = document.getElementById('errorMsg');

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;

     console.log({ email, password, role });

    try {
      const res = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', role);
        window.location.href = role === 'admin' ? 'admin.html' : 'dashboard.html';
      } else {
        errorMsg.classList.remove('hidden');
        errorMsg.textContent = data.message || "Invalid credentials. Please try again.";
      }
    } catch (err) {
      console.error(err);
      errorMsg.classList.remove('hidden');
      errorMsg.textContent = "Something went wrong. Try again.";
    }
  });
});
