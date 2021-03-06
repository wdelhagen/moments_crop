// index.js

/**
 * Required External Modules
 */

const express = require("express");
const path = require("path");

const axios = require('axios');

const { Pool } = require('pg');

const {google} = require('googleapis');
const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

const oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_OAUTH_CLIENT_ID,
      process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      process.env.GOOGLE_OAUTH_REDIRECT_URL
    );

const oauth_token={
  access_token:'',
  refresh_token:process.env.GOOGLE_OAUTH_REFRESH_TOKEN,
  scope:"https://www.googleapis.com/auth/gmail.send",
  token_type:"Bearer",
  expiry_date:''
}

oAuth2Client.setCredentials(oauth_token);

// oAuth2Client.getToken(process.env.GOOGLE_OAUTH_CODE, (err, token) => {
//   if (err) return console.error('Error retrieving access token', err);
//   oAuth2Client.setCredentials(token);
//   // Store the token to disk for later program executions
//   console.log(JSON.stringify(token))
// });

const gmail = google.gmail({version: 'v1', auth: oAuth2Client});

// const authUrl = oAuth2Client.generateAuthUrl({
//   access_type: 'offline',
//   scope: SCOPES,
//   prompt: 'consent'
// });
//
// console.log(`auth_url=${authUrl}`);

const ENV = process.env.NODE_ENV;

// iCloud albums
var rp = require('request-promise-native');
var _chunk = require('lodash.chunk');

// console.log(`DB connection string: "${process.env.DATABASE_URL}"`)

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: (ENV === 'DEV') ? false : { rejectUnauthorized: false },
});

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
app.use(express.urlencoded())

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

async function sendEmail(to_name, to_email, subject, body) {
  // You can use UTF-8 encoding for the subject using the method below.
  // You can also just use a plain string if you don't need anything fancy.
  // const subject = '🤘 Hello 🤘';
  const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
  const messageParts = [
    'From: Will DelHagen <will@moments.cards>',
    `To: ${to_name} <${to_email}>`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${utf8Subject}`,
    '',
    `${body}`,
  ];
  const message = messageParts.join('\n');

  // The body needs to be base64url encoded.
  const encodedMessage = Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const result = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedMessage,
    },
  });

  console.log(result);

  return result;
}

/**
 * Routes Definitions
 */

app.get("/", (req, res) => {
res.sendFile(path.join(__dirname + '/public/assets/html/index.html'));
});

app.get("/cropper", (req, res) => {
 res.sendFile(path.join(__dirname + '/public/assets/html/cropper.html'));
});

app.get("/create", (req, res) => {
 res.sendFile(path.join(__dirname + '/public/assets/html/create.html'));
});

// For testing database connection

if (ENV === 'DEV') {
  app.get('/db', async (req, res) => {
    try {
      const client = await pool.connect()
      const result = await client.query('SELECT * FROM orders');
      const results = { 'results': (result) ? result.rows : null};
      res.json(results);
      client.release();
    } catch (err) {
      console.error(err);
      res.send("Error " + err);
    }
  })
}


app.post("/submit_order", async (req, res) => {
  // console.log(req)
  // async/await
  try {
    const client = await pool.connect()

    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const email = req.body.email;
    const is_gift = req.body.is_gift || false;
    const gift_recipient = req.body.gift_recipient;
    const address = req.body.address;
    const address2 = req.body.address2;
    const city = req.body.city;
    const state = req.body.state;
    const zip = req.body.zip;
    const notes = req.body.notes;
    const album_link = req.body.album_link;
    const back_id = req.body.back_id;
    const now = new Date();

    const text = `INSERT INTO public.orders (
                    first_name,
                    last_name,
                    email,
                    is_gift,
                    gift_recipient,
                    ship_address,
                    ship_address2,
                    ship_city,
                    ship_state,
                    ship_zip,
                    notes,
                    album_link,
                    back_id,
                    created_on)
                  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`;
    const values = [firstName,
                    lastName,
                    email,
                    is_gift,
                    gift_recipient,
                    address,
                    address2,
                    city,
                    state,
                    zip,
                    notes,
                    album_link,
                    back_id,
                    now];
    const result = await client.query(text, values)
    var ext_order_id = result.rows[0].ext_order_id;
    client.release();

    const subject = '✨ MOMENTS Confirmation ✨';
    const to_name = `${firstName} ${lastName}`;
    const body = `
    Hi ${firstName}! <br /><br />

    Thanks for creating a set of MOMENTS cards. <br /><br />

    Your cards will be made from this <a href="${album_link}">album</a>. <br /> <br />

    I hope they help you or someone you love connect to a sense of joy, peace and wonder.<br /><br />

    Here's your order id for reference: ${ext_order_id}<br /><br />

    💛,<br /><br />

    Will`

    email_result = await sendEmail(to_name, email, subject, body);

    res.sendFile(path.join(__dirname + '/public/assets/html/success.html'));
  } catch (err) {
    console.log(err.stack)
    // handle error response
    res.json(err);
  }
});

app.get("/check_order/:ext_order_id", async (req, res) => {
  // async/await
  try {
    const client = await pool.connect()
    var ext_order_id = req.params.ext_order_id
    const text = 'SELECT * FROM public.orders WHERE ext_order_id=$1;'
    const values = [ext_order_id];
    const result = await client.query(text, values)
    // console.log(result.rows[0])
    res.json(result.rows[0]);
    client.release();
  } catch (err) {
    console.log(err.stack)
  }

});


app.get('/icloudalbum/:id', async function(request, response) {

  var baseUrl = getBaseUrl(request.params.id);
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
