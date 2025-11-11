const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 3000;

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
      const result = await foodCollection.find().toArray();
      res.send(result);
    });

    app.get("/latest-foods", async (req, res) => {
      const cursor = foodCollection.find().sort({ created_at: -1 }).limit(6);
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
      const updatedFood = req.body
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

    app.patch('/accept/:id',async(req,res)=>{
         const id = req.params.id
          const updatedFood = req.body
        const email = req.query.donar_email;
      const query = { _id: new ObjectId(id)};
 
      const updateDoc = {
        $set: {
           status:updatedFood.status
        },
      };
      const result = await orderCollection.updateOne(query,updateDoc);
      res.send(result)
    })

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
