require('dotenv').config()
const MongoClient = require('mongodb').MongoClient;
const uri = process.env.URI;

async function getData(){
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    try{
        await client.connect();
        const db = client.db("hotroom");
        const temps = db.collection("temps");
        const data = await temps.find().toArray();
        return data;
    }
    catch (e){
        console.log(e);
    }
    finally{
        client.close();
    }
}

module.exports.getData = getData;