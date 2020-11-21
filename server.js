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
    let {start, end, grade} = req.query;
    
    start = start === undefined ? 0          : parseInt(start);
    end   = end   === undefined ? Date.now() : parseInt(end);
    grade = grade === undefined ? 1          : parseInt(grade);

    const data = await db.getData(start, end, grade);
    res.json(data);
})

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`)
})