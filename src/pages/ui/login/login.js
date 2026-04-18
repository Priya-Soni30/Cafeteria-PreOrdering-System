document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const msg = document.getElementById("msg");
  const goHome = document.getElementById("goHome");
  const linkRegister = document.getElementById("linkRegister");
  const linkForgot = document.getElementById("linkForgot");
  const btnLogin = document.getElementById("btnLogin");

  function showMessage(text, type = "err") {
    if (!msg) return;
    msg.style.display = "block";
    msg.className = `msg ${type}`;
    msg.textContent = text || "";
  }

  function clearMessage() {
    if (!msg) return;
    msg.style.display = "none";
    msg.className = "msg";
    msg.textContent = "";
  }

  async function safeJson(response) {
    const text = await response.text();
    try {
      return text ? JSON.parse(text) : {};
    } catch {
      return { message: text || "Unexpected server response." };
    }
  }

  function saveAuthData(data) {
    if (data?.token) {
      localStorage.setItem("token", data.token);
    } else {
      localStorage.removeItem("token");
    }

    if (data?.user) {
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("currentUser", JSON.stringify(data.user));
      localStorage.setItem("role", data.user.role || "user");
    } else {
      localStorage.removeItem("user");
      localStorage.removeItem("currentUser");
      localStorage.removeItem("role");
    }
  }

  function clearAuthData() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("role");
  }

  function redirectByRole(user) {
    const role = String(user?.role || "").toLowerCase();

    if (role === "admin") {
      window.location.href = "../dashboard/dashboard.html";
    } else {
      window.location.href = "../home/home.html";
    }
  }

  goHome?.addEventListener("click", (e) => {
    e.preventDefault();
    window.location.href = "../home/home.html";
  });

  linkRegister?.addEventListener("click", (e) => {
    e.preventDefault();
    window.location.href = "../register/register.html";
  });

  linkForgot?.addEventListener("click", (e) => {
    e.preventDefault();
    window.location.href = "../forgot/forgot.html";
  });

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearMessage();

    const email = document.getElementById("email")?.value.trim();
    const password = document.getElementById("password")?.value.trim();

    if (!email || !password) {
      showMessage("Please enter email and password.", "err");
      return;
    }

    try {
      if (btnLogin) {
        btnLogin.disabled = true;
        btnLogin.textContent = "Logging in...";
      }

      const response = await fetch(`${window.API_BASE}/api/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ email, password })
      });

      const data = await safeJson(response);

      if (!response.ok) {
        clearAuthData();
        showMessage(data.message || "Login failed.", "err");
        return;
      }

      if (!data?.user) {
        clearAuthData();
        showMessage("Login succeeded, but user data is missing.", "err");
        return;
      }

      saveAuthData(data);
      showMessage(data.message || "Login successful.", "ok");

      setTimeout(() => {
        redirectByRole(data.user);
      }, 600);
    } catch (error) {
      console.error("Login error:", error);
      showMessage("Unable to connect to server.", "err");
    } finally {
      if (btnLogin) {
        btnLogin.disabled = false;
        btnLogin.textContent = "Login";
      }
    }
  });
});