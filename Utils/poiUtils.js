var db = require('./DButils');


function getPoi(req, res){
    let params = req.params;
    let rank = params.rank ? params.rank : 0;
    let category = params.category ? params.category : 0;


    let query = db.keyWords.selectAll + db.keyWords.from + "poi " +
        db.keyWords.where + "rank >= " + rank;
    if (category){
        query += " AND category = '" + category +"'";
    }

    let promise = db.execQuery(query); // returns a list of items matching the row of the table
    promise
        .then( result => {
        console.log(result);
        res.status(200).send(result); // JSON.Stringify(2,null)
        })
        .catch(reason => {
            console.log(reason);
            res.sendStatus(500);
        });
}

function getRandomPoi(req, res){
    let params = req.params;
    let rank = !(Object.entries(params).length === 0 && params.constructor === Object) ? params.rank : 0;

    let query = db.keyWords.selectAll + db.keyWords.from + "poi " +
        db.keyWords.where + "rank >= " + rank;

    let promise = db.execQuery(query);
    promise
        .then(result => {
            const shuffled = result.sort(() => 0.5 - Math.random());
            // Get sub-array of first 3 elements after shuffled
            let selected = shuffled.slice(0, 3);
            res.status(200).send(selected);
        })
        .catch(err => {
            console.log(err);
            res.sendStatus(500);
        });
}

function updatePoiWatchers(req, res){
    let poiName = req.body.poi;

    let query = db.keyWords.update + "poi " +
        db.keyWords.set  + "watched = watched + 1 " +
        db.keyWords.where + "name = '" + poiName + "'";

    let promise = db.execQuery(query);
    promise.then(result => {
        console.log(result);
        res.sendStatus(200);
    })
        .catch(err => {
            console.log(err);
            res.sendStatus(500);
        });
}



/*********************      EXPORTS     ************************/
exports.getPoi = getPoi;
exports.getRandom = getRandomPoi;
exports.updatePoiWatchers = updatePoiWatchers;