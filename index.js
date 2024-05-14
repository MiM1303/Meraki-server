const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const cookieParser = require('cookie-parser');


const app = express();
const port = process.env.PORT || 5000;

// MIDDLEWARES
// app.use(cors({
//   origin: [
//     'http://localhost:5173'
//   ],
//   credentials: true
// }));
// app.use(express.json());
// app.use(cookieParser());

app.use(cors({
  origin: [
    'http://localhost:5173',
  ],
  credentials: true,
  optionSuccessStatus: 200
}));
app.use(express.json());
app.use(cookieParser());

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
};

// const logger = (req, res, next)=>{
//   console.log('log info', req.method, req.url);
//   next();
// }

const verifyToken = (req, res, next) =>{
  const token = req?.cookies?.token;
  console.log('token in the middleware', token);
  if(!token){
    return res.status(401).send({message: "unauthorized access"});
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded)=>{
    if(err){
      return res.status(401).send({message: "unauthorized access"});
    }
    req.user = decoded;
    next();
  })
}


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


    // JWT GENERATE
    // app.post('/jwt', async (req, res)=>{
    //   const user = req.body;
    //   console.log('user for token', user);
    //   const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' })

    //   res.cookie('token', token, cookieOptions)
    //   .send({success: true});
    // })

    // app.post('/logout',  async(req, res)=>{
    //   const user = req.body;
    //   // console.log('logging out', user)
    //   // res.clearCookie('token', {maxAge: 0}).send({success:true})
    //   res.clearCookie('token', { ...cookieOptions, maxAge: 0 }).send({success:true})
    // })

    //JWT
    app.post('/jwt', async(req, res)=>{
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1hr'});
      res
      .cookie('token',token,cookieOptions)
      .send({success: true});
    })

    app.post('/logout', async(req, res)=>{
      res.clearCookie('token', {...cookieOptions, maxAge: 0}).send({success: true})
    })


    // SERVICES APIs

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

    // sorting
    app.get('/available-foods/sorted/:sort', async(req, res)=>{
      const sortOrder = req.params.sort;
      console.log(sortOrder);

      const query = {status: "Available"};
      if(sortOrder) options = {sort: {date : sortOrder === 'asc'?1 : -1}}
      const result = await foodCollection.find(query, options).toArray();

      console.log(result);
      res.send(result);
    })

    // searching
    app.get('/available-foods/search/:searchText', async(req, res)=>{
      const searchText = req.params.searchText;
      console.log(searchText);

      
      const query = {
        name: {$regex: searchText, $options: 'i'},
        status: {$regex: 'Available', $options: 'i'}
      };
      
      const cursor = foodCollection.find(query) ;
      const result = await cursor.toArray();
      // const result = await cursor.find(query).toArray();

      console.log(result);
      res.send(result);
    })

    // load all requested foods for my requested foods page
    app.get('/requested-foods/:email',  verifyToken, async(req, res)=>{
      const userEmail = req.params.email;
      // const cursor = foodCollection.find({status: "Requested"}) ;
      console.log(req.user.email, req.params.email)
      console.log('token owner info', req.user);
      if(req.user.email !== req.params.email){
        return res.status(403).send({message: 'forbidden access'})
      }
      let query = {};
      if(req.query?.email){
        query = {email: req.query.email}
      }
      const result = await foodCollection.find({requester:userEmail}).toArray();
      console.log(result);
      res.send(result);
    })

    // load all foods for user in manage my foods page
    app.get('/my-foods/:email', verifyToken, async(req, res)=>{
      const myEmail = req.params.email;
      console.log(req.user.email, req.params.email)
      console.log('token owner info', req.user);
      if(req.user.email !== req.params.email){
        return res.status(403).send({message: 'forbidden access'})
      }
      let query = {};
      if(req.query?.email){
        query = {email: req.query.email}
      }
      const result = await foodCollection.find({userEmail:myEmail}).toArray();
      // console.log(result);
      
      res.send(result);
    })

    // get food by id for showing food details
    app.get('/food/:id',  async(req, res)=>{
      const id = req.params.id;
      console.log('id found in server:',req.params.id);
      const query = {_id: new ObjectId(id)}
      const result = await foodCollection.findOne(query);
      console.log(result);
      res.send(result);
    })

    // get food by id for updating in manage my food
    app.get('/my-foods/:id', async(req, res)=>{
      const id = req.params.id;
      console.log('id found in server:',req.params.id);
      const query = {_id: new ObjectId(id)}
      const result = await foodCollection.findOne(query);
      console.log(result);
      res.send(result);
    })

    // update food by id in manage in food
    app.put('/my-foods/:id', async (req, res) => {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const options = {upsert:true};
      const updatedFood = req.body
      console.log(updatedFood);
      const food = {
          $set:{
              name: updatedFood.name,
              photo: updatedFood.photo,
              quantity: updatedFood.quantity,
              location: updatedFood.location,
              date: updatedFood.date,
              notes: updatedFood.notes
          }
      }
  
      const result = await foodCollection.updateOne(filter, food, options)
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
    app.post('/add-food',  verifyToken, async(req, res)=>{


      const newFood = req.body;
      console.log(newFood);

      const result = await foodCollection.insertOne(newFood);
      res.send(result);
  })

  // delete food from manage my foods
  app.delete('/food/:id', async(req, res)=>{
    const id = req.params.id;
    const query = {_id:new ObjectId(id)}
    const result = await foodCollection.deleteOne(query);
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