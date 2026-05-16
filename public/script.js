const API = "http://localhost:3000";

/* manual add */
async function addUser() {
  const name = document.getElementById("name").value;
  const age = document.getElementById("age").value;

  const res = await fetch(API + "/add", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, age })
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data.message || "Add failed");
    return;
  }

  loadUsers();
}

/* load users */
async function loadUsers() {
  const res = await fetch(API + "/users");
  const data = await res.json();

  document.getElementById("users").innerHTML = data
    .map(u => `<div>${u.name} (${u.age})</div>`)
    .join("");
}

/* AI command */
async function sendAI() {
  const prompt = document.getElementById("aiInput").value;

  const errorBox = document.getElementById("error");
  errorBox.innerText = "";

  try {
    const res = await fetch(API + "/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });

    const data = await res.json();

    if (!res.ok) {
      errorBox.innerText = data.message || "AI error";
      console.log("FULL ERROR:", data);
      return;
    }

    console.log("SUCCESS:", data);

    loadUsers();

  } catch (err) {
    errorBox.innerText = "Network error: " + err.message;
  }
}

loadUsers();