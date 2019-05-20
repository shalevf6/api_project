var db = require('./DButils');


function getPoi(req, res){
    let params = req.params;
    let rank = !(Object.entries(params).length === 0 && params.constructor === Object) ? params.rank : 0;

    let query = db.keyWords.selectAll + db.keyWords.from + "poi " +
        db.keyWords.where + "rank > " + rank;

    // console.log("inside");
    // console.log(query);

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


exports.getPoi = getPoi;