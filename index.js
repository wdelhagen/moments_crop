// index.js

/**
 * Required External Modules
 */

const express = require("express");
const path = require("path");

const axios = require('axios');

// iCloud albums
var rp = require('request-promise-native');
var config = require('config');
var request_lib = require('request');
var Queue = require('promise-queue');
var _chunk = require('lodash.chunk');

// const { Client } = require('pg');
//
// const client = new Client({
//   connectionString: process.env.DATABASE_URL,
//   ssl: true,
// });
//
// client.connect();
//
// client.query('SELECT table_schema,table_name FROM information_schema.tables;', (err, res) => {
//   if (err) throw err;
//   for (let row of res.rows) {
//     console.log(JSON.stringify(row));
//   }
//   client.end();
// });

 // iCloud shared album https://www.icloud.com/sharedalbum/#B0q5oqs3q79j4q
 // Kaila Album https://www.icloud.com/sharedalbum/#B0k532ODWGQsi8U

const regex = /\["(https:\/\/lh3\.googleusercontent\.com\/[a-zA-Z0-9\-_]*)"/g
// const regex_photo = /(https:\/\/photos\.google\.com\/share\/.*\/key=[a-zA-Z0-9\-_]*)/g
const regex_google = /https:\/\/photos\.app\.goo\.gl\//g
const regex_icloud = /https:\/\/www\.icloud\.com\/sharedalbum\//g

function extractPhotos(content) {
 const links = new Set()
  let match
  while (match = regex.exec(content)) {
    links.add(match[1])
  }
  return Array.from(links)
}

async function getAlbumiCloud(id) {
  try {
    // const response = await axios.get(`https://www.icloud.com/sharedalbum/#${id}`)
    // return response.data;


  }
  catch(e) {
    return null
  }
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
app.set('port', process.env.PORT || 8000);

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

app.get("/gallery", (req, res) => {
 res.sendFile(path.join(__dirname + '/public/assets/html/gallery.html'));
});

app.get("/create", (req, res) => {
 res.sendFile(path.join(__dirname + '/public/assets/html/create.html'));
});

app.post("/submit_order", (req, res) => {
  console.log(req.body)


 // Send response (and email them)

});

app.get('/icloudalbum/:id', async function(request, response) {

  var baseUrl = getBaseUrl(request.params.id);
  var queue = new Queue(1, Infinity);
  const links = new Set();

  getPhotoMetadata(baseUrl).then(function(metadata) {

      var chunks = _chunk(metadata.photoGuids, 25);

      var processChunks = function(i){

          if (i < chunks.length) {

              getUrls(baseUrl, chunks[i]).then(function (urls) {

                  decorateUrls(metadata, urls);

                  setTimeout(function() {
                      processChunks(i+1);
                  }, 1000);

              });

          } else {

              for (var photoGuid in metadata.photos) {

                      var photo = metadata.photos[photoGuid];

                      links.add(photo.url);

              }

              var results = Array.from(links);
              response.json(results);

          }

      }

      processChunks(0);

    }).catch(function(e) {
      console.log(e);
  });

});


app.get('/googlealbum/:id', async function(request, response) {
  try {
    const results = await getAlbum(request.params.id)
    output = results.map(function(elt) {
      return elt + "=w2048";
    });
    response.json(output);
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


/**
 * Server Activation
 */

function getBaseUrl(token) {

    var BASE_62_CHAR_SET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

    var base62ToInt = function(e) {
        var t = 0;
        for (var n = 0; n < e.length; n++) t = t * 62 + BASE_62_CHAR_SET.indexOf(e[n]);
        return t
    };

    var e = token,
        t = e[0],
        n = t === "A" ? base62ToInt(e[1]) : base62ToInt(e.substring(1, 3)),
        r = e,
        i = e.indexOf(";"),
        s = null;

    if (i >= 0) {
        s = e.slice(i + 1);
        r = r.replace(";" + s, "");
    }

    var serverPartition = n;

    var baseUrl = 'https://p';

    baseUrl += (serverPartition < 10) ? "0" + serverPartition : serverPartition;
    baseUrl += '-sharedstreams.icloud.com';
    baseUrl += '/';
    baseUrl += token;
    baseUrl += '/sharedstreams/'

    return baseUrl;

}

function getPhotoMetadata(baseUrl) {

    var url = baseUrl + 'webstream';

    var headers = {
        'Origin': 'https://www.icloud.com',
        'Accept-Language': 'en-US,en;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36',
        'Content-Type': 'text/plain',
        'Accept': '*/*',
        'Referer': 'https://www.icloud.com/sharedalbum/',
        'Connection': 'keep-alive'
    };

    var dataString = '{"streamCtag":null}';

    var options = {
        url: url,
        method: 'POST',
        headers: headers,
        body: dataString
    };

    return rp(options).then(function (body) {

        var data = JSON.parse(body);

        var photos = {};

        var photoGuids = [];

        data.photos.forEach(function(photo) {
            photos[photo.photoGuid] = photo;
            photoGuids.push(photo.photoGuid);
        });

        return {
            photos: photos,
            photoGuids: photoGuids
        };

    });

}

function getUrls(baseUrl, photoGuids) {

    var url = baseUrl + 'webasseturls';

    var headers = {
        'Origin': 'https://www.icloud.com',
        'Accept-Language': 'en-US,en;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36',
        'Content-Type': 'text/plain',
        'Accept': '*/*',
        'Referer': 'https://www.icloud.com/sharedalbum/',
        'Connection': 'keep-alive'
    };

    var dataString = JSON.stringify({
        photoGuids: photoGuids
    });

    var options = {
        url: url,
        method: 'POST',
        headers: headers,
        body: dataString
    };

    // console.log('Retrieving URLs for ' + photoGuids[0] + ' - ' + photoGuids[photoGuids.length - 1] + '...');

    return rp(options).then(function (body) {

        var data = JSON.parse(body);

        var items = {};

        for (var itemId in data.items) {
            var item = data.items[itemId];

            items[itemId] = 'https://' + item.url_location + item.url_path;

        }

        return items;

    });

}

function decorateUrls(metadata, urls) {

    for (var photoId in metadata.photos) {
        var photo = metadata.photos[photoId];

        var biggestFileSize = 0;
        var bestDerivative = null;

        for (var derivativeId in photo.derivatives) {
            var derivative = photo.derivatives[derivativeId];

            if (parseInt(derivative.fileSize, 10) > biggestFileSize) {
                biggestFileSize = parseInt(derivative.fileSize, 10);
                bestDerivative = derivative;
            }
        }

        if (bestDerivative) {

            if (typeof urls[bestDerivative.checksum] == 'undefined') {
                continue;
            }

            var url = urls[bestDerivative.checksum];
            metadata.photos[photoId].url = url;
            metadata.photos[photoId].bestDerivative = bestDerivative;
        }

    }

}
