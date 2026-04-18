document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");
  const msg = document.getElementById("msg");
  const goHome = document.getElementById("goHome");
  const btnRegister = document.getElementById("btnRegister");

  function show(text, type = "err") {
    if (!msg) return;
    msg.style.display = "block";
    msg.className = "msg " + type;
    msg.textContent = text || "";
  }

  async function safeJson(res) {
    const text = await res.text();
    try {
      return text ? JSON.parse(text) : {};
    } catch {
      return { message: text || "Unexpected server response." };
    }
  }

  goHome?.addEventListener("click", () => {
    window.location.href = "../home/home.html";
  });

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (msg) msg.style.display = "none";

    const fullName = document.getElementById("fullName")?.value.trim();
    const email = document.getElementById("email")?.value.trim();
    const password = document.getElementById("password")?.value.trim();
    const confirmPassword = document.getElementById("confirmPassword")?.value.trim();

    if (!fullName || !email || !password || !confirmPassword) {
      show("Please fill all fields.");
      return;
    }

    if (password.length < 6) {
      show("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      show("Passwords do not match.");
      return;
    }

    try {
      if (btnRegister) {
        btnRegister.disabled = true;
        btnRegister.textContent = "Registering...";
      }

      const response = await fetch(`${window.API_BASE}/api/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ fullName, email, password }),
      });

      const data = await safeJson(response);

      if (!response.ok) {
        show(data.message || "Registration failed.");
        return;
      }

      show("Account created successfully ✅", "ok");

      setTimeout(() => {
        window.location.href = "../login/login.html";
      }, 800);
    } catch (error) {
      console.error("Register error:", error);
      show("Cannot reach server. Make sure backend is running.");
    } finally {
      if (btnRegister) {
        btnRegister.disabled = false;
        btnRegister.textContent = "Register";
      }
    }
  });
});