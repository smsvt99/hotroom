require('dotenv').config()
const express = require('express');
const db = require('./db')
const app = express()
const port = process.env.PORT

app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html')
})

app.get('/data', async (req, res) => {
    const data = await db.getData();
    res.json(data);
})

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`)
})