const timeLabels = [
  "6 AM",
  "7 AM",
  "8 AM",
  "9 AM",
  "10 AM",
  "11 AM",
  "12 PM",
  "1 PM",
  "2 PM",
  "3 PM",
  "4 PM",
  "5 PM"
];

const cafeteriaData = {
  "kumari-hall": {
    name: "Kumari Hall",
    topItem: "Chicken Sandwich",
    note: "Kumari Hall is active in the morning, with another smaller rise later in the afternoon.",
    orders: [8, 12, 19, 27, 38, 44, 30, 21, 16, 28, 18, 10]
  },
  "brit-cafe": {
    name: "Brit Cafe",
    topItem: "Chicken Burger",
    note: "Brit Cafe usually gets stronger demand closer to lunch and early afternoon.",
    orders: [14, 11, 9, 15, 24, 34, 42, 47, 33, 22, 16, 12]
  },
  "coffee-station": {
    name: "Coffee Station",
    topItem: "Cappuccino",
    note: "Coffee Station is busiest during coffee breaks and can rise again in the afternoon.",
    orders: [18, 24, 31, 28, 21, 17, 14, 19, 27, 36, 29, 20]
  },
  "canteen": {
    name: "Canteen",
    topItem: "Chicken Curry Set",
    note: "Canteen gets its heaviest traffic around lunch because students prefer full meals here.",
    orders: [6, 9, 13, 19, 28, 39, 52, 58, 35, 24, 17, 11]
  }
};

let peakChart = null;

document.addEventListener("DOMContentLoaded", () => {
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  setupLogout();
  setupPeakHours();
});

function setupPeakHours() {
  const cafeSelect = document.getElementById("cafeSelect");
  const urlCafeId = new URLSearchParams(window.location.search).get("cafeId");

  if (urlCafeId && cafeteriaData[urlCafeId]) {
    cafeSelect.value = urlCafeId;
  }

  renderCafeData(cafeSelect.value);

  cafeSelect.addEventListener("change", (e) => {
    renderCafeData(e.target.value);
  });
}

function setupLogout() {
  const btnLogout = document.getElementById("btnLogout");
  if (!btnLogout) return;

  btnLogout.addEventListener("click", async () => {
    try {
      const apiBase = window.API_BASE || "http://127.0.0.1:5000";
      await fetch(`${apiBase}/api/users/logout`, {
        method: "POST",
        credentials: "include"
      });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      localStorage.removeItem("cart");
      localStorage.removeItem("selectedFood");
      localStorage.removeItem("favoriteItems");
      window.location.href = "../login/login.html";
    }
  });
}

function renderCafeData(cafeId) {
  const cafe = cafeteriaData[cafeId];
  if (!cafe) return;

  updateBadge(cafe.name);
  updateSummary(cafe);
  updateInsights(cafe);
  drawChart(cafe);
}

function updateBadge(name) {
  const badge = document.getElementById("activeCafeBadge");
  if (badge) badge.textContent = name;
}

function getTimeRange(index) {
  const start = timeLabels[index] || "--";
  const next = timeLabels[index + 1];

  if (next) {
    return `${start} - ${next}`;
  }

  return start;
}

function updateSummary(cafe) {
  const orders = cafe.orders || [];
  const totalOrders = orders.reduce((sum, value) => sum + value, 0);
  const maxOrders = Math.max(...orders);
  const peakIndex = orders.indexOf(maxOrders);

  const peakTime = document.getElementById("peakTime");
  const totalOrdersEl = document.getElementById("totalOrders");
  const topItem = document.getElementById("topItem");

  if (peakTime) peakTime.textContent = getTimeRange(peakIndex);
  if (totalOrdersEl) totalOrdersEl.textContent = totalOrders;
  if (topItem) topItem.textContent = cafe.topItem;
}

function updateInsights(cafe) {
  const orders = cafe.orders || [];
  const maxOrders = Math.max(...orders);
  const minOrders = Math.min(...orders);

  const peakIndex = orders.indexOf(maxOrders);
  const lowIndex = orders.indexOf(minOrders);

  const bestTimeText = document.getElementById("bestTimeText");
  const rushWindowText = document.getElementById("rushWindowText");
  const cafeNoteText = document.getElementById("cafeNoteText");

  if (bestTimeText) {
    bestTimeText.textContent = `The quieter time is usually around ${getTimeRange(lowIndex)} in ${cafe.name}.`;
  }

  if (rushWindowText) {
    rushWindowText.textContent = `${getTimeRange(peakIndex)} is usually the busiest time for ${cafe.name}.`;
  }

  if (cafeNoteText) {
    cafeNoteText.textContent = cafe.note;
  }
}

function drawChart(cafe) {
  const canvas = document.getElementById("peakChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  if (peakChart) {
    peakChart.destroy();
  }

  peakChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: timeLabels,
      datasets: [
        {
          label: "Orders Placed",
          data: cafe.orders,
          backgroundColor: [
            "rgba(220, 213, 243, 0.95)",
            "rgba(223, 232, 245, 0.95)",
            "rgba(220, 213, 243, 0.95)",
            "rgba(223, 232, 245, 0.95)",
            "rgba(228, 238, 225, 0.95)",
            "rgba(117, 132, 101, 0.90)",
            "rgba(100, 116, 84, 0.95)",
            "rgba(223, 232, 245, 0.95)",
            "rgba(194, 221, 188, 0.95)",
            "rgba(117, 132, 101, 0.88)",
            "rgba(220, 213, 243, 0.95)",
            "rgba(228, 238, 225, 0.95)"
          ],
          borderColor: [
            "rgba(199, 190, 231, 1)",
            "rgba(191, 209, 229, 1)",
            "rgba(199, 190, 231, 1)",
            "rgba(191, 209, 229, 1)",
            "rgba(188, 206, 180, 1)",
            "rgba(117, 132, 101, 1)",
            "rgba(100, 116, 84, 1)",
            "rgba(191, 209, 229, 1)",
            "rgba(166, 191, 160, 1)",
            "rgba(117, 132, 101, 1)",
            "rgba(199, 190, 231, 1)",
            "rgba(188, 206, 180, 1)"
          ],
          borderWidth: 1.2,
          borderRadius: 10,
          borderSkipped: false,
          maxBarThickness: 32
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 700
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: "rgba(31,42,68,.96)",
          titleColor: "#fff",
          bodyColor: "#fff",
          padding: 10,
          displayColors: false,
          callbacks: {
            label: function(context) {
              return `Orders Placed: ${context.raw}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: "#6d7487",
            font: {
              size: 11,
              weight: "700"
            }
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: "rgba(55,65,81,.08)"
          },
          ticks: {
            stepSize: 10,
            color: "#6d7487",
            font: {
              size: 11,
              weight: "700"
            }
          }
        }
      }
    }
  });
}