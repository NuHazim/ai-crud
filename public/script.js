const API = "http://localhost:3000";

let pendingAction = null;

/* ---------------- MANUAL ADD ---------------- */

async function addUser() {

  const name = document.getElementById("name").value;
  const age = document.getElementById("age").value;

  const res = await fetch(API + "/add", {

    method: "POST",

    headers: {
      "Content-Type": "application/json"
    },

    body: JSON.stringify({
      name,
      age
    })

  });

  const data = await res.json();

  if (!res.ok) {

    alert(data.message || "Add failed");

    return;

  }

  loadUsers();

}

/* ---------------- LOAD USERS ---------------- */

async function loadUsers() {

  const res = await fetch(API + "/users");

  const data = await res.json();

  document.getElementById("users").innerHTML =
    data.map(u => `
      <div>
        ${u.name} (${u.age})
      </div>
    `).join("");

}

/* ---------------- AI COMMAND ---------------- */

async function sendAI() {

  const prompt = document.getElementById("aiInput").value;

  const errorBox = document.getElementById("error");

  errorBox.innerText = "";

  try {

    const res = await fetch(API + "/ai-preview", {

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        prompt
      })

    });

    const data = await res.json();

    if (!res.ok) {

      errorBox.innerText = data.message || "AI preview failed";

      console.log(data);

      return;

    }

    console.log("PREVIEW:", data);

    pendingAction = data.action;

    showConfirmation(data.action);

  } catch (err) {

    errorBox.innerText = "Network error: " + err.message;

  }

}

/* ---------------- SHOW CONFIRMATION ---------------- */

function showConfirmation(action) {

  const confirmBox = document.getElementById("confirmBox");

  const confirmText = document.getElementById("confirmText");

  let text = "";

  if (action.action === "add") {

    text =
      `I will add a new user named ${action.name} with age ${action.age}.`;

  }

  else if (action.action === "delete") {

    text =
      `I will delete all users named ${action.name}.`;

  }

  else if (action.action === "edit") {

    text =
      `I will change ${action.nameBefore} (${action.ageBefore}) ` +
      `to ${action.nameAfter} (${action.ageAfter}).`;

  }

  confirmText.innerText = text;

  confirmBox.classList.remove("hidden");

}

/* ---------------- CONFIRM ACTION ---------------- */

async function confirmAction() {

  const errorBox = document.getElementById("error");

  try {

    const res = await fetch(API + "/ai-confirm", {

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify(pendingAction)

    });

    const data = await res.json();

    if (!res.ok) {

      errorBox.innerText = data.message || "Execution failed";

      console.log(data);

      return;

    }

    console.log("EXECUTED:", data);

    hideConfirmation();

    loadUsers();

  } catch (err) {

    errorBox.innerText = "Network error: " + err.message;

  }

}

/* ---------------- CANCEL ACTION ---------------- */

function cancelAction() {

  pendingAction = null;

  hideConfirmation();

}

/* ---------------- HIDE CONFIRMATION ---------------- */

function hideConfirmation() {

  document
    .getElementById("confirmBox")
    .classList.add("hidden");

}

loadUsers();