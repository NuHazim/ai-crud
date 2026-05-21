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

    res.status(500).json({
      message: "Add failed",
      error: err.message
    });

  }
});

// READ
app.get("/users", async (req, res) => {

  try {

    const users = await User.find();

    res.json(users);

  } catch (err) {

    res.status(500).json({
      message: "Fetch failed",
      error: err.message
    });

  }

});

// DELETE
app.delete("/delete/:id", async (req, res) => {

  try {

    await User.findByIdAndDelete(req.params.id);

    res.json({
      message: "deleted"
    });

  } catch (err) {

    res.status(500).json({
      message: "Delete failed",
      error: err.message
    });

  }

});

/* ---------------- AI PREVIEW ---------------- */

app.post("/ai-preview", async (req, res) => {

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
You convert user commands into JSON.

ONLY RETURN VALID JSON.

ADD:
{"action":"add","name":"John","age":20}

DELETE:
{"action":"delete","name":"John"}

EDIT:
{"action":"edit","nameBefore":"John","ageBefore":20,"nameAfter":"Mike","ageAfter":30}

Understand the user's intention carefully before generating JSON.
`
          },

          {
            role: "user",
            content: prompt
          }
        ]
      },

      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const content = response.data.choices[0].message.content;

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

    /* ---------------- VALIDATION ---------------- */

    if (!result.action) {

      return res.status(400).json({
        message: "Missing action"
      });

    }

    /* ADD validation */

    if (result.action === "add") {

      if (
        typeof result.name !== "string" ||
        typeof result.age !== "number"
      ) {

        return res.status(400).json({
          message: "Invalid add data"
        });

      }

    }

    /* DELETE validation */

    if (result.action === "delete") {

      if (typeof result.name !== "string") {

        return res.status(400).json({
          message: "Invalid delete data"
        });

      }

    }

    /* EDIT validation */

    if (result.action === "edit") {

      if (
        typeof result.nameBefore !== "string" ||
        typeof result.ageBefore !== "number" ||
        typeof result.nameAfter !== "string" ||
        typeof result.ageAfter !== "number"
      ) {

        return res.status(400).json({
          message: "Invalid edit data"
        });

      }

    }

    /* SEND PREVIEW */

    res.json({
      confirm: true,
      action: result
    });

  } catch (err) {

    console.log("AI ERROR:", err.response?.data || err.message);

    res.status(500).json({
      message: "AI request failed",
      error: err.response?.data || err.message
    });

  }

});

/* ---------------- AI CONFIRM ---------------- */

app.post("/ai-confirm", async (req, res) => {

  const result = req.body;

  try {

    /* ADD */

    if (result.action === "add") {

      const user = new User({
        name: result.name,
        age: result.age
      });

      await user.save();

      return res.json({
        message: "User added",
        user
      });

    }

    /* DELETE */

    if (result.action === "delete") {

      const deleted = await User.deleteMany({
        name: result.name
      });

      return res.json({
        message: "Deleted",
        count: deleted.deletedCount
      });

    }

    /* EDIT */

    if (result.action === "edit") {

      const updated = await User.updateMany(
        {
          name: result.nameBefore,
          age: result.ageBefore
        },

        {
          $set: {
            name: result.nameAfter,
            age: result.ageAfter
          }
        }
      );

      return res.json({
        message: "Updated",
        count: updated.modifiedCount
      });

    }

    res.status(400).json({
      message: "Unknown action"
    });

  } catch (err) {

    res.status(500).json({
      message: "Execution failed",
      error: err.message
    });

  }

});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});