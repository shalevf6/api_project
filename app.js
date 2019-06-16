var express = require('express');
var app = express();
var POIUtil = require('./Utils/poiUtils');
var userUtil = require('./Utils/userUtils');
const jwt = require('jsonwebtoken');
const cors = require('cors');

let port = 3000;

const secret = "thisIsASecret";
exports.SECRET = secret;

app.use(express.json());
app.use(cors());


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

app.get('/poi/:contain', (req, res) => {POIUtil.getPoi(req, res)}); // needs to be change to contains
app.get('/poiCategory/:category', (req, res) => {POIUtil.getPoi(req, res)});
app.get('/poi', (req, res) => {POIUtil.getPoi(req, res)});
app.get('/randomPoi/:rank', (req, res) => POIUtil.getRandom(req, res));
app.get('/randomPoi', (req, res) => POIUtil.getRandom(req, res));
app.post('/login', (req, res) => userUtil.login(req, res));
app.post('/signUp', (req, res) => userUtil.signUp(req, res));
app.get('/categories', (req, res) => POIUtil.getCategories(req, res));
app.get('/countries', (req, res) => POIUtil.GetCountries(req, res));
app.post('/restorePassword', (req, res) => userUtil.restore_password(req, res));
app.patch('/updateWatchers', (req, res) => POIUtil.updatePoiWatchers(req, res));
app.get('/questions', (req, res) => userUtil.getQuestions(req, res));
app.get('/private/recommendedPoi', (req, res) => userUtil.getUserRecommendedPoi(req, res));
app.get('/private/favoritePoi', (req, res) => userUtil.getUserFavoritePoi(req, res));
app.get('/latestReview/:poi', (req, res) => POIUtil.latestReviews(req, res));
app.post('/private/addReview', (req, res) => POIUtil.addReview(req, res));
app.get('/private/lastSavedPoi', (req, res) => userUtil.getLastSavedPoi(req, res));
app.put('/private/saveFavorites', (req, res) => userUtil.saveFavoritePoi(req, res));
