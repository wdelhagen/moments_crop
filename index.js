// index.js

/**
 * Required External Modules
 */

const express = require("express");
const path = require("path");

const axios = require('axios');

const regex = /\["(https:\/\/lh3\.googleusercontent\.com\/[a-zA-Z0-9\-_]*)"/g
// const regex_photo = /(https:\/\/photos\.google\.com\/share\/.*\/key=[a-zA-Z0-9\-_]*)/g
const regex_photo = /(\/\.share)/g

function extractPhotos(content) {
 const links = new Set()
  let match
  while (match = regex.exec(content)) {
    links.add(match[1])
  }
  return Array.from(links)
}

async function getAlbum(id) {
  try {
    const response = await axios.get(`https://photos.app.goo.gl/${id}`)
    return extractPhotos(response.data)
  }
  catch(e) {
    return null
  }
}


/**
 * App Variables
 */

const app = express();
const port = process.env.PORT || "8000";

/**
 *  App Configuration
 */

app.use('/', express.static('public'));
app.use(express.static(path.join(__dirname, "public")));

// authorize CORS (for demo only)
app.use(function(req, res, next) {
  const origin = req.headers.origin;
  if(origin){
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});


// app.set("views", path.join(__dirname, "views"));
// app.set("view engine", "pug");

/**
 * Routes Definitions
 */

 app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname + '/public/assets/html/index.html'));
 });

app.get("/cropper", (req, res) => {
 res.sendFile(path.join(__dirname + '/public/assets/html/cropper.html'));
});

app.get("/collect", (req, res) => {
 res.sendFile(path.join(__dirname + '/public/assets/html/collect.html'));
});

app.get("/crop", (req, res) => {
 res.sendFile(path.join(__dirname + '/public/assets/html/crop.html'));
});

app.get("/order", (req, res) => {
 res.sendFile(path.join(__dirname + '/public/assets/html/order.html'));
});

app.get('/album/:id', async function(request, response) {
  try {
    const results = await getAlbum(request.params.id)
    response.json(results);
  }
  catch(e) {
    response.status(500)
  }
});


// app.get("/album", (req, res) => {
//   response = getCORS('https://photos.app.goo.gl/QWsU1knpjTjcr9Pb9', function(request){
//       var response = request.currentTarget.response || request.target.responseText;
//       return response;
//   });
//   res.send(response);
// });

// app.get("/crop", (req, res) => {
//   res.render("crop", { title: "Cropper", userProfile: { nickname: "Cropper" } });
// });

/**
 * Server Activation
 */

app.listen(port, () => {
 console.log(`Listening to requests on http://localhost:${port}`);
});
