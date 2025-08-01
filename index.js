require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

// In-memory store
const urlMap = {};
let idCounter = 1;

app.use(cors());
app.use('/public', express.static(`${process.cwd()}/public`));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Serve index.html
app.get('/', (req, res) => {
    res.sendFile(process.cwd() + '/views/index.html');
});

// Test endpoint
app.get('/api/hello', (req, res) => {
    res.json({ greeting: 'hello API' });
});

// Create short URL
app.post('/api/shorturl', (req, res) => {
    const originalUrl = req.body.url;

    // Validate format
    let hostname;
    try {
        const urlObj = new URL(originalUrl);
        if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
            return res.json({ error: 'invalid url' });
        }
        hostname = urlObj.hostname;
    } catch {
        return res.json({ error: 'invalid url' });
    }

    // Store in memory
    const shortUrl = idCounter++;
    urlMap[shortUrl] = originalUrl;

    res.json({
        original_url: originalUrl,
        short_url: shortUrl
    });
});

// Redirect short URL
app.get('/api/shorturl/:id', (req, res) => {
    const original = urlMap[req.params.id];
    if (original) {
        return res.redirect(original);
    }
    res.json({ error: 'invalid url' });
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
