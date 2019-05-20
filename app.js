var express = require('express');
var app = express();
var DButilsAzure = require('./Utils/DButils');
var POIUtil = require('./Utils/poiUtils');

var port = 3000;
app.listen(port, function () {
    console.log('Example app listening on port ' + port);
});

app.get('/select', function(req, res){
    DButilsAzure.execQuery("SELECT * FROM tableName")
    .then(function(result){
        res.send(result)
    })
    .catch(function(err){
        console.log(err);
        res.send(err);
    })
});


app.get('/pointOfInterest/:rank', (req, res) => {POIUtil.getPoi(req, res)});
app.get('/pointOfInterest', (req, res) => {POIUtil.getPoi(req, res)});
app.get('/randomPoi/:rank', (req, res) => POIUtil.getRandom(req, res));
app.get('/randomPoi', (req, res) => POIUtil.getRandom(req, res));
