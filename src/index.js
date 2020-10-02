const { request } = require('graphql-request')
const bodyParser = require('body-parser');
const Cache = require('stale-lru-cache');
const express = require("express");
const app = express();
const endpoint = 'https://example.com/graphql'

const server = app.listen(3000, function(){
    console.log("Node.js is listening to PORT:" + server.address().port);
});

app.use(express.urlencoded({ extended: true }))
app.use(bodyParser.json());


const cache = new Cache({
    maxSize: 1000,
    maxAge: 300,
    staleWhileRevalidate: 86400
})

app.post('/', async (req, res) => {
    res.set('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.set("Cache-Control", 'no-store');

    const revalidate = (key, callback) => {
        request(endpoint, req.body.query, req.body.variables).then((data) => {
                console.log('graphql requested')
                callback(null, data)
            })
            .catch((e => {
                console.log('graphql error')
                callback(e)
            }))
    }

    const key = req.body.query + JSON.stringify(req.body.variables || {})


    cache.wrap(key, revalidate, (error, value) => {
        if (error) {
            return res.status(500).send(error)
        }
        res.json({ data: value })
    })
})