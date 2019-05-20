var DButilsAzure = require('../Utils/DButils');
var app = require('../app').lala;

app.get('/select', function(req, res){
    console.log('inside select');
    DButilsAzure.execQuery("SELECT * FROM tableName")
        .then(function(result){
            res.send(result);
        })
        .catch(function(err){
            console.log(err);
            res.send(err);
        })
});