var db = require('./DButils');


function getPoi(req, res){
    let params = req.params;
    let contain = params.contain ? params.contain : "";
    let category = params.category ? params.category : 0;

    let query = db.keyWords.selectAll + db.keyWords.from + "poi " +
        db.keyWords.where + "name "+ db.keyWords.like  + "'%" + contain + "%'";
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

/**
 * gets all category names from the database
 * @param req -
 * @param res -
 */
function getCategories(req, res) {
    let get_categories_query = db.keyWords.select + "name " + db.keyWords.from + "categories";

    let get_categories_promise = db.execQuery(get_categories_query);

    get_categories_promise
        .then(result => {
            res.status(200).send(result);
        })
        .catch(err => {
            console.log(err);
            res.sendStatus(500);
        });
}

function updatePoiWatchers(req, res){
    let poiName = req.body.poi || "";
    if (!poiName){
        res.status(400).send({error: "no poi was given to update"});
        return;
    }

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

function getLastPoiReview(req, res){
    let params = req.params;
    let poi = params.poi ? params.poi : 0;

    if (poi){
        let query = db.keyWords.selectAll +
            db.keyWords.from + "usersReviews " +
            db.keyWords.where + "poi = '" + poi + "'";

        let promise = db.execQuery(query);
        promise.then(result => {
            let latest2 = [];

            result.forEach(item => {
                item.time = new Date(item.time);
            });
            result.sort((a,b) =>  (a.time < b.time) ? 1 : ((b.time < a.time) ? -1 : 0));

            latest2 = result.slice(0,2);
            res.status(200).send(latest2);
        })
    }
    else {
        let err = "error: no poi name was given";
        console.log(err);
        res.status(400).send(err);
    }
}

function validateReview(body){
    let poi = body.poi || "",
        rank = body.rank || 0,
        review = body.review || "";
    let problems = [];
    if (!poi)
        problems.push("no poi given");
    if (!rank)
        problems.push("no rank given");
    else if (rank<1 || rank>5)
        problems.push("rank must be an integer between 1-5");
    if (!review)
        problems.push("no review given");

    return problems;
}

function addPoiReview(req, res){
    let problems = validateReview(req.body);
    if (problems.length > 0){
        res.status(400).send({error: "Bad request was given.", info: problems});
        return;
    }

    let username = putParethesis(req.decoded.name),
        poi = putParethesis(req.body.poi),
        rank = req.body.rank,
        time = putParethesis((new Date()).toISOString()),
        review = putParethesis(req.body.review);

    let query = db.keyWords.insert + "usersReviews " +
        db.keyWords.valuesStart + username + "," + poi + "," + rank + "," + review + "," + time + db.keyWords.valuesEnd;

    let promise = db.execQuery(query);
    promise.then(result => {
        let get_poi_reviews_query = db.keyWords.select + "rank " + db.keyWords.from + "usersReviews " + db.keyWords.where +
            "poi = " + poi;
        let get_poi_reviews_promise = db.execQuery(get_poi_reviews_query);
        get_poi_reviews_promise
            .then(inner_result => {
               let rank_sum = 0;
               inner_result.forEach(item => {
                   rank_sum += item.rank;
               });
               let new_rank = rank_sum / inner_result.length;

               let update_poi_rank_query = db.keyWords.update + "poi " + db.keyWords.set + "rank = " + new_rank + " "  +
                   db.keyWords.where + "name = " + poi;
               let update_poi_rank_promise = db.execQuery(update_poi_rank_query);
               update_poi_rank_promise
                   .then(inner_result_2 => {
                       res.status(201).send("Review added successfully");
                   })
                   .catch(err => {
                       res.status(500).send(err);
                   });
            })
            .catch(err => {
                res.status(500).send(err);
            });
    })
        .catch(err =>{
            res.status(500).send('Oops... looks like your review was not accepted. Please submit again');
        })
}

function putParethesis(string){
    return "'" + string + "'";
}


/*********************      EXPORTS     ************************/
exports.getPoi = getPoi;
exports.getRandom = getRandomPoi;
exports.getCategories = getCategories;
exports.updatePoiWatchers = updatePoiWatchers;
exports.latestReviews = getLastPoiReview;
exports.addReview = addPoiReview;
