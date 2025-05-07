const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");


const port = process.env.PORT || 5000;
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection URI
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mkgqk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// MongoClient configuration
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Run server
async function run() {
  try {
    await client.connect(); // ✅ Connect once

    const userCollection = client.db("EquiSports").collection("users");
    const ProductCollection = client.db("EquiSports").collection("Product");

    // users server side

    // registration
    app.post("/users", async (req, res) => {
      const newUser = req.body;
      console.log("Received new user:", newUser);
      try {
        const result = await userCollection.insertOne(newUser);
        res.send(result); // Must return JSON
      } catch (dbError) {
        console.error("DB insert error:", dbError);
        res.status(500).send({ error: "Failed to insert user into database" });
      }
    });

    app.get("/users", async (req, res) => {
      const cursor = userCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // singIn
    app.patch("/users", async (req, res) => {
      const email = req.body.email;
      const filter = { email };
      const updateDoc = {
        $set: {
          lastSignInTime: req.body?.lastSignInTime,
        },
      };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // Equipment
    app.post("/equipment", async (req, res) => {
      const newProduct = req.body;
      console.log("Received new user:", newProduct);
      try {
        const result = await ProductCollection.insertOne(newProduct);
        res.send(result); // Must return JSON
      } catch (dbError) {
        console.error("DB insert error:", dbError);
        res.status(500).send({ error: "Failed to insert user into database" });
      }
    });

    // get equipment
    app.get("/equipment", async (req, res) => {
      const cursor = ProductCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // Simplified equipment by ID
    app.get("/equipment/:id", async (req, res) => {
      try {
        const id = req.params.id;

        if (!ObjectId.isValid(id)) {
          return res.status(400).send("Invalid equipment ID format");
        }

        const result = await ProductCollection.findOne({
          _id: new ObjectId(id),
        });

        if (!result) {
          return res.status(404).send("Equipment not found");
        }

        res.send(result); // Just send the raw data
      } catch (error) {
        console.error("Database error:", error);
        res.status(500).send("Failed to fetch equipment");
      }
    });

    // Update Equipment
    app.put("/equipment/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const updatedData = req.body;

        if (!ObjectId.isValid(id)) {
          return res.status(400).send("Invalid ID format");
        }

        const result = await ProductCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedData }
        );

        if (result.matchedCount === 0) {
          return res.status(404).send("Equipment not found");
        }

        res.send(result);
      } catch (error) {
        console.error("Update error:", error);
        res.status(500).send("Failed to update equipment");
      }
    });

    // Ping to verify connection
    await client.db("admin").command({ ping: 1 });
    console.log("✅ Connected to MongoDB and server is ready.");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);
  }
}

run(); // 🔁 Don't close the connection here!

// Root endpoint
app.get("/", (req, res) => {
  res.send("EquiSports server is running");
});

// Start listening
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
