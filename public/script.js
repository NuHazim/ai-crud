const API = "http://localhost:3000";

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

    /* STEP 1: GET PREVIEW */

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

    /* STEP 2: CONFIRM */

    const confirmed = confirm(
      "Confirm this action:\n\n" +
      JSON.stringify(data.action, null, 2)
    );

    if (!confirmed) {

      errorBox.innerText = "Action cancelled";

      return;

    }

    /* STEP 3: EXECUTE */

    const executeRes = await fetch(API + "/ai-confirm", {

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify(data.action)

    });

    const executeData = await executeRes.json();

    if (!executeRes.ok) {

      errorBox.innerText = executeData.message || "Execution failed";

      console.log(executeData);

      return;

    }

    console.log("EXECUTED:", executeData);

    loadUsers();

  } catch (err) {

    errorBox.innerText = "Network error: " + err.message;

  }

}

loadUsers();