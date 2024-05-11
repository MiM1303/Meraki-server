const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0pky6me.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {

    const foodCollection = client.db('merakiDB').collection('foods');

    // load all available foods for available foods page
    app.get('/foods', async(req, res)=>{
      const cursor = foodCollection.find({status: "Available"}) ;
      // const query = {status: new ObjectId("Available")}
      const result = await cursor.toArray();
      console.log(result);
      res.send(result);
    })

    // load sorted and selected foods for featured section in homepage
    app.get('/foods', async(req, res)=>{
      const cursor = foodCollection.find().sort( { "quantity": -1 }).limit(6) ;
      const result = await cursor.toArray();
      console.log(result);
      res.send(result);
    })


    // add food from add food page
    app.post('/add-food', async(req, res)=>{
      const newFood = req.body;
      console.log(newFood);

      const result = await foodCollection.insertOne(newFood);
      res.send(result);
  })






    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res)=>{
  res.send("Meraki server is running")
})

app.listen(port, ()=>{
  console.log(`Meraki server is running on port: ${port}`)
})