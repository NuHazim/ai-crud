const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const User = require("./models/User");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

/* ---------------- MONGODB ---------------- */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

/* ---------------- CRUD ---------------- */

// CREATE
app.post("/add", async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Add failed", error: err.message });
  }
});

// READ
app.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Fetch failed", error: err.message });
  }
});

// DELETE
app.delete("/delete/:id", async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "deleted" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed", error: err.message });
  }
});

/* ---------------- AI ROUTE ---------------- */

app.post("/ai", async (req, res) => {
  const prompt = req.body.prompt;

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `
You convert text into JSON commands.

ONLY return valid JSON.

Allowed formats:

ADD:
{"action":"add","name":"John","age":20}

DELETE:
{"action":"delete","name":"John"}

EDIT:
{"action":"edit","nameBefore":"John","ageBefore":25,"nameAfter":"James","ageAfter":30}
make sure to understand user's prompt query logically before putting in the json.
            `
          },
          { role: "user", content: prompt }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    let content = response.data.choices[0].message.content;

    console.log("RAW AI:", content);

    let result;
    try {
      result = JSON.parse(content);
    } catch (err) {
      return res.status(400).json({
        message: "AI returned invalid JSON",
        raw: content
      });
    }

    /* ---------------- EXECUTE ---------------- */

    if (result.action === "add") {
      const user = new User({
        name: result.name,
        age: result.age
      });

      await user.save();
      return res.json(user);
    }

    if (result.action === "delete") {
      const deleted = await User.deleteMany({ name: result.name });
      return res.json({ message: "deleted", count: deleted.deletedCount });
    }

    if (result.action === "edit") {
      const updated = await User.updateMany(
        { 
          name: result.nameBefore,
          age: result.ageBefore
        },
        { $set: 
          { 
            name:result.nameAfter,
            age: result.ageAfter 
          } 
        }
      );

      return res.json({ message: "updated", count: updated.modifiedCount });
    }

    res.status(400).json({ message: "unknown action", result });

  } catch (err) {
    console.log("AI ERROR:", err.response?.data || err.message);

    res.status(500).json({
      message: "AI request failed",
      error: err.response?.data || err.message
    });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));