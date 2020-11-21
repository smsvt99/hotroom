require('dotenv').config()
const MongoClient = require('mongodb').MongoClient;
const uri = process.env.URI;

async function getData(start, end, grade){
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    try{
        await client.connect();
        const db = client.db("hotroom");
        const temps = db.collection("temps");
        const data = await temps
            .find({
                time: {$gte: start, $lte: end},
            },
            {
                projection: { _id: 0 }
            })
            .sort({time: 1})
            .toArray();
        
        const gradedData = data.filter((datum, index) => index % grade === 0);
        return gradedData;
    }
    catch (e){
        console.log(e);
    }
    finally{
        client.close();
    }
}

module.exports.getData = getData;