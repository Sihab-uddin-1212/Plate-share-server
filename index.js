require("dotenv").config();
const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");

const serviceAccount = require("./plate-share-ae51d-firebase-adminsdk-fbsvc-13c9a53dd9.json");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 3000;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.db_name}:${process.env.db_password}@cluster0.aoofufm.mongodb.net/?appName=Cluster0`;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  try {
    const db = client.db("food-db");
    const foodCollection = db.collection("foods");
    const orderCollection = db.collection("order");

    app.get("/foods", async (req, res) => {
      const status = req.query.status;
      const query = {};
      if (status) {
        query.status = status;
      }
      const result = await foodCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/latest-foods", async (req, res) => {
      const status = req.query.status;
      const query = {};
      if (status) {
        query.status = status;
      }
      const cursor = foodCollection
        .find(query)
        .sort({ food_quantity: -1 })
        .limit(6);
      const result = await cursor.toArray();
      res.send(result);
      //for Home
    });

    app.get("/foods/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodCollection.findOne(query);
      res.send(result);
      //for details
    });

    app.get("/my-food", async (req, res) => {
      const email = req.query.email;

      const query = {};
      if (email) {
        query.email = email;
      }
      const result = await foodCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/foods", async (req, res) => {
      const data = req.body;
      data.food_quantity = Number(data.food_quantity);

      const result = await foodCollection.insertOne(data);
      res.send({
        success: true,
        result,
      });
    });

    app.delete("/foods/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodCollection.deleteOne(query);
      res.send(result);
    });

    app.post("/order", async (req, res) => {
      const data = req.body;

      const result = await orderCollection.insertOne(data);
      res.send({
        success: true,
        result,
      });
    });

    app.patch("/foods/:id", async (req, res) => {
      const id = req.params.id;
      const updatedFood = req.body;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          food_name: updatedFood.food_name,
          pickup_location: updatedFood.pickup_location,
          food_quantity: updatedFood.food_quantity,
          food_image: updatedFood.food_image,
          expire_date: updatedFood.expire_date,
        },
      };
      const result = await foodCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    app.patch("/accept/:id", async (req, res) => {
      const id = req.params.id;
      const foodId = req.body.foodId;
      const updatedFood = req.body;

      const query = { _id: new ObjectId(id) };

      const updateDoc = {
        $set: {
          status: updatedFood.status,
        },
      };
      const result = await orderCollection.updateOne(query, updateDoc);
      const request = await foodCollection.updateOne(
        { _id: new ObjectId(foodId) },
        { $set: { status: "doneted" } }
      );
      console.log(request);
      res.send(result, request);
    });

    app.get("/order-list", async (req, res) => {
      const email = req.query.donar_email;
      const foodId = req.query.foodId;

      const query = {};

      if (foodId) {
        query.foodId = foodId;
      }
      console.log(foodId);
      const result = await orderCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/my-request", async (req, res) => {
      const email = req.query.email;
      const query = {};
      if (email) query.user_email = email;

      console.log(query);
      const result = await orderCollection
        .aggregate([
          {
            $match: query,
          },

          {
            $lookup: {
              from: "foods",

              let: { objectId: { $toObjectId: "$foodId" } },

              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: ["$_id", "$$objectId"],
                    },
                  },
                },
              ],

              as: "food",
            },
          },
        ])
        .toArray();
      res.send(result);
    });

    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);
