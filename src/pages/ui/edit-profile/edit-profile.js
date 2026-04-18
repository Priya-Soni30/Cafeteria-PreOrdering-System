document.addEventListener("DOMContentLoaded", async () => {
  const API_BASE = window.API_BASE || "http://127.0.0.1:5000";
  const LOGIN_URL = "../login/login.html";
  const PROFILE_URL = "../profile/profile.html";
  const DEFAULT_AVATAR = "../../../../assets/default-avatar.png";

  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  const els = {
    fullName: document.getElementById("fullName"),
    email: document.getElementById("email"),
    department: document.getElementById("department"),
    bio: document.getElementById("bio"),

    profileAvatar: document.getElementById("profileAvatar"),
    avatarInput: document.getElementById("avatarInput"),
    previewName: document.getElementById("previewName"),
    previewEmail: document.getElementById("previewEmail"),

    btnSave: document.getElementById("btnSave"),
    btnCancel: document.getElementById("btnCancel"),
    btnLogout: document.getElementById("btnLogout"),
    msg: document.getElementById("msg")
  };

  let currentUser = null;
  let currentAvatar = "";

  function safeJsonParse(value, fallback) {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  function showMessage(text, type = "") {
    if (!els.msg) return;
    els.msg.textContent = text || "";
    els.msg.className = `msg ${type}`.trim();
  }

  function getLocalUserFallback() {
    const user =
      safeJsonParse(localStorage.getItem("currentUser"), null) ||
      safeJsonParse(localStorage.getItem("user"), null) ||
      {};

    return {
      id: user._id || user.id || "",
      _id: user._id || user.id || "",
      fullName:
        user.fullName ||
        user.name ||
        localStorage.getItem("profileFullName") ||
        "Student User",
      email: user.email || "student@example.com",
      role: user.role || localStorage.getItem("role") || "student",
      avatar: localStorage.getItem("profileAvatar") || user.avatar || "",
      department: user.department || localStorage.getItem("profileDepartment") || "",
      bio: user.bio || localStorage.getItem("profileBio") || ""
    };
  }

  async function fetchProfile() {
    try {
      const res = await fetch(`${API_BASE}/api/users/full-profile`, {
        method: "GET",
        credentials: "include"
      });

      const data = await res.json();

      if (!res.ok || !data.success || !data.user) {
        throw new Error(data.message || "Failed to load profile");
      }

      return {
        ...data.user,
        department: data.user.department || localStorage.getItem("profileDepartment") || "",
        bio: data.user.bio || localStorage.getItem("profileBio") || ""
      };
    } catch (error) {
      console.error("Profile load failed, using fallback:", error);
      return getLocalUserFallback();
    }
  }

  function renderUser(user) {
    if (els.fullName) els.fullName.value = user.fullName || "";
    if (els.email) els.email.value = user.email || "";
    if (els.department) els.department.value = user.department || "";
    if (els.bio) els.bio.value = user.bio || "";

    currentAvatar = user.avatar || localStorage.getItem("profileAvatar") || DEFAULT_AVATAR;

    if (els.profileAvatar) {
      els.profileAvatar.src = currentAvatar;
      els.profileAvatar.onerror = () => {
        els.profileAvatar.src = DEFAULT_AVATAR;
      };
    }

    if (els.previewName) els.previewName.textContent = user.fullName || "Student User";
    if (els.previewEmail) els.previewEmail.textContent = user.email || "student@example.com";
  }

  function saveLocalFallback(payload) {
    localStorage.setItem("profileFullName", payload.fullName || "");
    localStorage.setItem("profileDepartment", payload.department || "");
    localStorage.setItem("profileBio", payload.bio || "");

    if (payload.avatar) {
      localStorage.setItem("profileAvatar", payload.avatar);
    }

    const currentStored = safeJsonParse(localStorage.getItem("currentUser"), {}) || {};
    const updatedStored = {
      ...currentStored,
      fullName: payload.fullName,
      department: payload.department,
      bio: payload.bio,
      avatar: payload.avatar || currentStored.avatar
    };
    localStorage.setItem("currentUser", JSON.stringify(updatedStored));
  }

  async function updateProfile(payload) {
    try {
      const res = await fetch(`${API_BASE}/api/users/update-profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update profile");
      }

      return data.user || null;
    } catch (error) {
      console.error("Profile update failed, saving locally:", error);
      saveLocalFallback(payload);
      return {
        ...currentUser,
        ...payload
      };
    }
  }

  els.avatarInput?.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        currentAvatar = result;
        if (els.profileAvatar) els.profileAvatar.src = result;
      }
    };
    reader.readAsDataURL(file);
  });

  els.btnCancel?.addEventListener("click", () => {
    window.location.href = PROFILE_URL;
  });

  els.btnLogout?.addEventListener("click", async () => {
    try {
      await fetch(`${API_BASE}/api/users/logout`, {
        method: "POST",
        credentials: "include"
      });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("currentUser");
      localStorage.removeItem("role");
      window.location.href = LOGIN_URL;
    }
  });

  els.btnSave?.addEventListener("click", async () => {
    const fullName = String(els.fullName?.value || "").trim();
    const department = String(els.department?.value || "").trim();
    const bio = String(els.bio?.value || "").trim();

    if (!fullName) {
      showMessage("Full name is required.", "err");
      return;
    }

    els.btnSave.disabled = true;
    els.btnSave.textContent = "Saving...";

    try {
      const payload = {
        fullName,
        department,
        bio,
        avatar: currentAvatar !== DEFAULT_AVATAR ? currentAvatar : ""
      };

      const updatedUser = await updateProfile(payload);

      currentUser = {
        ...currentUser,
        ...(updatedUser || {}),
        fullName,
        department,
        bio,
        avatar: payload.avatar || currentUser.avatar
      };

      saveLocalFallback({
        fullName: currentUser.fullName,
        department: currentUser.department,
        bio: currentUser.bio,
        avatar: currentUser.avatar
      });

      showMessage("Profile updated successfully.", "ok");

      setTimeout(() => {
        window.location.href = PROFILE_URL;
      }, 700);
    } catch (error) {
      console.error(error);
      showMessage("Failed to update profile.", "err");
    } finally {
      els.btnSave.disabled = false;
      els.btnSave.textContent = "Save Changes";
    }
  });

  currentUser = await fetchProfile();

  const userId = String(currentUser?._id || currentUser?.id || "").trim();
  if (!userId) {
    window.location.href = LOGIN_URL;
    return;
  }

  renderUser(currentUser);
});