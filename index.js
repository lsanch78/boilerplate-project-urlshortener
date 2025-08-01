require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dns = require('dns');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

const urlMap = {};
let idCounter = 1;

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


app.post('/api/shorturl', function(req, res) {
  // get url from body
 const originalUrl = req.body.url;

  // create a hostname var to hold names after protocol ie. 'www.google.com'
 let hostname;

 // try / catch to try and get the protocol from the originalUrl
  try {
    const urlObj = new URL(originalUrl);
    if (urlObj.protocol !== "https:" && urlObj.protocol !== "http:") {
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
  dns.resolve4(hostname,(err, address) => {
    if (err) {
      return res.json({error: 'invalid url'});
    }

    // shortened url logic goes here
    const shortUrl = idCounter++;
    urlMap[shortUrl] = originalUrl;


    return res.json({ original_url: originalUrl , short_url: shortUrl});
  }
);
});


app.get('/api/shorturl/:id', (req, res) => {
    const original = urlMap[req.params.id];
    if (original) return res.redirect(original)
    res.json({error: 'no short url found in key'});
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
