console.log("✅ forgot.js loaded");

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ DOM loaded");

  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  const API = (window.API_BASE || "http://127.0.0.1:5000").trim();

  const email = document.getElementById("email");
  const otp = document.getElementById("otp");
  const newPassword = document.getElementById("newPassword");
  const confirmPassword = document.getElementById("confirmPassword");
  const btnSendOtp = document.getElementById("btnSendOtp");
  const btnReset = document.getElementById("btnReset");
  const msg = document.getElementById("msg");
  const backToLogin = document.getElementById("backToLogin");

  function show(text, type = "err") {
    console.log(`[${type}] ${text}`);
    if (!msg) return alert(text);

    msg.style.display = "block";
    msg.className = "msg " + type;
    msg.textContent = text;
  }

  function clearMsg() {
    if (!msg) return;
    msg.style.display = "none";
    msg.textContent = "";
    msg.className = "msg";
  }

  if (!email || !otp || !newPassword || !confirmPassword || !btnSendOtp || !btnReset) {
    alert("Forgot page elements missing");
    return;
  }

  backToLogin?.addEventListener("click", (e) => {
    e.preventDefault();
    window.location.href = "../login/login.html";
  });

  otp.addEventListener("input", () => {
    otp.value = otp.value.replace(/\D/g, "").slice(0, 4);
  });

  btnSendOtp.addEventListener("click", async () => {
    clearMsg();

    const userEmail = String(email.value || "").trim().toLowerCase();

    if (!userEmail) {
      show("Please enter your email.");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(userEmail)) {
      show("Please enter a valid email address.");
      return;
    }

    try {
      btnSendOtp.disabled = true;
      btnSendOtp.textContent = "Sending...";

      console.log("➡️ Sending OTP request...");
      console.log("➡️ API:", `${API}/api/users/send-otp`);
      console.log("➡️ Email:", userEmail);

      const res = await fetch(`${API}/api/users/send-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: userEmail }),
      });

      const data = await res.json().catch(() => ({}));

      console.log("⬅️ Status:", res.status);
      console.log("⬅️ Data:", data);

     if (!res.ok) {
  show(`${data.message || "Failed to send OTP."} ${data.error ? "- " + data.error : ""}`);
  btnSendOtp.disabled = false;
  btnSendOtp.textContent = "Send OTP";
  return;
}

      show(data.message || "OTP sent successfully.", "ok");
      btnSendOtp.disabled = false;
      btnSendOtp.textContent = "Resend OTP";
    } catch (error) {
      console.error("❌ Send OTP error:", error);
      show("Unable to send OTP right now.");
      btnSendOtp.disabled = false;
      btnSendOtp.textContent = "Send OTP";
    }
  });

  btnReset.addEventListener("click", async () => {
    clearMsg();

    const userEmail = String(email.value || "").trim().toLowerCase();
    const code = String(otp.value || "").trim();
    const password = String(newPassword.value || "");
    const confirm = String(confirmPassword.value || "");

    if (!userEmail) {
      show("Please enter your email.");
      return;
    }

    if (!/^\d{4}$/.test(code)) {
      show("OTP must be exactly 4 digits.");
      return;
    }

    if (password.length < 6) {
      show("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirm) {
      show("Passwords do not match.");
      return;
    }

    try {
      btnReset.disabled = true;
      btnReset.textContent = "Resetting...";

      const res = await fetch(`${API}/api/users/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userEmail,
          otp: code,
          password,
        }),
      });

      const data = await res.json().catch(() => ({}));

      console.log("⬅️ Reset status:", res.status);
      console.log("⬅️ Reset data:", data);

      if (!res.ok) {
        show(data.message || "Password reset failed.");
        btnReset.disabled = false;
        btnReset.textContent = "Reset Password";
        return;
      }

      show(data.message || "Password reset successful.", "ok");

      setTimeout(() => {
        window.location.href = "../login/login.html";
      }, 1200);
    } catch (error) {
      console.error("❌ Reset password error:", error);
      show("Unable to reset password right now.");
      btnReset.disabled = false;
      btnReset.textContent = "Reset Password";
    }
  });
});