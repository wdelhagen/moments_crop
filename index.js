// index.js

/**
 * Required External Modules
 */

const express = require("express");
const path = require("path");

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


// app.set("views", path.join(__dirname, "views"));
// app.set("view engine", "pug");

/**
 * Routes Definitions
 */

app.get("/crop", (req, res) => {
 res.sendFile(path.join(__dirname + '/public/html/crop.html'));
});

// app.get("/crop", (req, res) => {
//   res.render("crop", { title: "Cropper", userProfile: { nickname: "Cropper" } });
// });

/**
 * Server Activation
 */

app.listen(port, () => {
 console.log(`Listening to requests on http://localhost:${port}`);
});
