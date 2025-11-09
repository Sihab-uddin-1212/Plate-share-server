const express = require('express')
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express()
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json())

//Plate-Share-db
//zw6Knl2EE1SQMxer

const uri = `mongodb+srv://${process.env.db_name}:${process.env.db_password}@cluster0.aoofufm.mongodb.net/?appName=Cluster0`;




app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
async function run() {
  try {
    
    
    const db = client.db('food-db');
    const foodCollection = db.collection('foods');

    app.get('/foods',async(req,res)=>{
         
        const result = await foodCollection.find().toArray();
        res.send(result)
    })

    app.get('/latest-foods', async (req, res) => {
            const cursor = foodCollection.find().sort({ created_at: -1 }).limit(6);
            const result = await cursor.toArray();
            res.send(result);
            //for Home
        })

        app.get('/foods/:id',async(req,res)=>{
            const id = req.params.id;
            const query = {_id:new ObjectId(id)};
            const result = await foodCollection.findOne(query);
            res.send(result)
            //for details 
        })

        
    app.post("/foods",   async (req, res) => {
      const data = req.body;
      // console.log(data)
      const result = await foodCollection.insertOne(data);
      res.send({
        success: true,
        result,
      });
    })








    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
     
    // await client.close();
  }
}
run().catch(console.dir);
