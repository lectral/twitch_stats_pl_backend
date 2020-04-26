import express from 'express';
import * as model from './model.js';
import cors from 'cors';

const app = express()
app.use(cors())
model.openConnection(true)

app.use((req, res, next) => {
  var date = new Date( Date.now() );
  console.log(`[${date.toUTCString()}] ${req.ip} ${req.hostname} ${req.url}`)
  next()
})

function response_success(res, payload){
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).send(payload)
}

function response_500(res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(500).send({"msg:" : "Error occured durning processing your request"})
}

app.get("/stats", (req, res) => {
  model.stats()
    .then( result => response_success(res, result) )
    .catch( error =>  response_500(res) );
});


app.get("/games", (req, res, next) => {
  model.games()
    .then( result =>  response_success(res, result))
    .catch( error => response_500(res) );
});

app.get("/games/:gameId", (req, res, next) => {
  const gameId = req.params.gameId
  model.game(gameId)
    .then( result => response_success(res, result) ) 
    .catch( error => response_500(res))
});


app.get("/streamers/:streamerId", (req, res, next) => {
  const streamerId = req.params.streamerId
  model.streamer(streamerId)
    .then( result => response_success(res, result) )
    .catch( error => response_500(res) )
});

app.listen(4000, () => {
  console.log("Server running on port 4000");
});
