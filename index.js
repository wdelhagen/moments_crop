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

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");
app.use(express.static(path.join(__dirname, "public")));
app.use('/assets', [
    express.static(__dirname + '/node_modules/cropperjs/dist/'),
    express.static(__dirname + '/node_modules/jquery-cropper/dist/')
]);

/**
 * Routes Definitions
 */

app.get("/", (req, res) => {
 res.render("index", { title: "Home" });
});

app.get("/crop", (req, res) => {
  res.render("crop", { title: "Cropper", userProfile: { nickname: "Cropper" } });
});

/**
 * Server Activation
 */

app.listen(port, () => {
 console.log(`Listening to requests on http://localhost:${port}`);
});
