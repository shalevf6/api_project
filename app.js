var express = require('express');
var app = express();
var POIUtil = require('./Utils/poiUtils');
var userUtil = require('./Utils/userUtils');
const jwt = require('jsonwebtoken');

let port = 3000;

var id = 0;
const secret = "thisIsASecret";


app.use(express.json());


app.use('/private', function(req,res,next) {
    const token = req.header("x-auth-token");
    // no token
    if (!token) res.status(401).send("Access denied. No token provided.");
    // verify token
    try {
        req.decoded = jwt.verify(token, secret);
        next();
    } catch (exception) {
        res.status(400).send("Invalid token.");
    }
});


app.listen(port, function () {
    console.log('Example app listening on port ' + port);
});


// if (req.decoded.admin)
//     res.status(200).send({ result: "Hello admin." });
// else
//     res.status(200).send({ result: "Hello user." });


/*************************    HTTP METHODS SETUP    ***************************/

app.get('/poi/:rank', (req, res) => {POIUtil.getPoi(req, res)}); // needs to be change to contains
app.get('/poiCategory/:category', (req, res) => {POIUtil.getPoi(req, res)});
app.get('/poi', (req, res) => {POIUtil.getPoi(req, res)});
app.get('/randomPoi/:rank', (req, res) => POIUtil.getRandom(req, res));
app.get('/randomPoi', (req, res) => POIUtil.getRandom(req, res));
app.post('/login', (req, res) => userUtil.login(req, res));
app.post('/sign_up', (req, res) => userUtil.sign_up(req, res));
app.get('/categories', (req, res) => POIUtil.getCategories(req, res));
app.post('/restorePassword', (req, res) => userUtil.restore_password(req, res));
app.patch('/updateWatchers', (req, res) => POIUtil.updatePoiWatchers(req, res));
app.get('/latestReview/:poi', (req, res) => POIUtil.latestReviews(req, res));
app.post('/private/addReview', (req, res) => POIUtil.addReview(req, res));

/*
var date1 = new Date();
var date2 = new Date();
date2.setMonth(1);
var date3 = new Date();
date3.setMonth(8);
var date4 = new Date();
date4.setMonth(2);

console.log(date2.toISOString());
var date2c = new Date(date2.toISOString());

console.log(date1, date2, date3, date4);
*/


