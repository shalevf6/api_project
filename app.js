let express = require('express');
let app = express();
let DButilsAzure = require('./DButils');

let port = 3000;
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