require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dns = require('dns');
const app = express();
const {MongoClient, ServerApiVersion} = require('mongodb')
const mongoose = require('mongoose');

// MONGO DB Set up
let dbPass = process.env.MONGODB_PASS;
const uri = "mongodb+srv://lsanch78:"+ dbPass + "@cluster0.ovob0h1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

// Url Schema Definition, we will use MongoDB's unique ID for each document as the shortened URL
const urlSchema = new mongoose.Schema({
    original_url: {type: String, required: true},
})

const Url = mongoose.model('Url', urlSchema);

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        await client.close();
    }
}
run().catch(console.dir);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});


app.post('/api/shorturl', async function (req, res) {
    // get url from body
    const originalUrl = req.body.url;

    // create a hostname var to hold names after protocol ie. 'www.google.com'
    let hostname;

    // try / catch to try and get the protocol from the originalUrl
    try {
        const urlObj = new URL(originalUrl);
        if (urlObj.protocol !== "https:" && urlObj.protocol !== "http:") {
            console.log("I got here");
            return res.json({error: 'invalid url'});
        }
        // assign hostname the name after successfully parsing the protocol
        hostname = urlObj.hostname;

        // if protocol cannot be parsed return json error
    } catch (e) {
        return res.json({error: 'url'});
    }

    // set servers to Google and Cloudfare so that it can automatically verify from their end (ISP's can intercept this and return false pos)
    dns.setServers(['8.8.8.8', '1.1.1.1']); // Google + Cloudflare
    dns.resolve4(hostname, async (err, address) => {
            if (err) {
                console.log(err, address);
                return res.json({error: 'invalid url'});
            }
            // save to mongo DB and use unique ID
            try {
                const newUrl = new Url({original_url: originalUrl});
                const saved = await newUrl.save();
                res.json({original_url: saved.original_url, short_url: saved._id});
            } catch (e) {
                return res.json({error: 'mongo db server error'});
            }
        }
    );
});


app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
