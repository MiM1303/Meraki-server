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

      // load sorted and selected foods for featured section in homepage
      app.get('/food', async(req, res)=>{
        const cursor = foodCollection.find().sort( { "quantity": -1 }).limit(6) ;
        const result = await cursor.toArray();
        console.log(result);
        res.send(result);
      })

    // load all available foods for available foods page
    app.get('/available-foods', async(req, res)=>{
      const cursor = foodCollection.find({status: "Available"}) ;
      // const query = {status: new ObjectId("Available")}
      const result = await cursor.toArray();
      console.log(result);
      res.send(result);
    })

    // load all requested foods for my requested foods page
    app.get('/requested-foods/:email', async(req, res)=>{
      const userEmail = req.params.email;
      // const cursor = foodCollection.find({status: "Requested"}) ;
      const result = await foodCollection.find({requester:userEmail}).toArray();
      console.log(result);
      res.send(result);
    })

    // get food by id for showing food details
    app.get('/food/:id', async(req, res)=>{
      const id = req.params.id;
      console.log('id found in server:',req.params.id);
      const query = {_id: new ObjectId(id)}
      const result = await foodCollection.findOne(query);
      console.log(result);
      res.send(result);
    })

    // request food by id from food details page
    app.put('/food/:id', async (req, res) => {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const options = {upsert:true};
      const updatedFood = req.body
      console.log(updatedFood);
      const food = {
          $set:{
              notes: updatedFood.notes, 
              status: updatedFood.status,
              requester: updatedFood.requester,
              requestDate: updatedFood.requestDate
          }
      }
  
      const result = await foodCollection.updateOne(filter, food, options)
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