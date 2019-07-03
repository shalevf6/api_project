var db = require('./DButils');
const jwt = require('jsonwebtoken');
const SECRET = 'thisIsASecret';

const question_list = ['What elementary school did you attend?', 'What is the name of the town where you were born?',
    'What is your mother maidens name?', 'What is your favorite sports team?'];
const CATEGORIES = ['Clubs' , 'Historical', 'Museums', 'Restaurants'];
const COUNTRIES = ['Australia', 'Bolivia', 'China', 'Denemark', 'Israel', 'Latvia', 'Monaco', 'August', 'Norway', 'Panama', 'Switzerland', 'USA'];

/**************************     DATABASE FUNCTIONS      **************************/
function putParethesis(string){
    return "'" + string + "'";
}

/**
 * validates the input for the saveFavoritePoi method
 * @param req - a given input
 */
function validateFavoritePoi(req) {
    const poiList = req.body.favorite_poi;
    if (!poiList)
        return "missing favorite poi array";
    if (poiList.length > 0)
        req.body.favorite_poi.forEach(item => {
            if (!(item.poi && item.personalOrder && item.time))
                return "missing";
        });
    return "Valid";
}

/**
 * checks if a username already exists. if not, adds the new user's details to the database
 */
function validateSignUp(username, password, fName, lName, city, country, email, favoriteCat, questions) {
    let problems = [];
    if (!username || username.length<3 || username.length>8){
        problems.push("username length");
    }
    if (!password || password.length<5 || password.length>10){
        problems.push("password length");
    }
    if (!fName)
        problems.push("no first name");
    if (!lName)
        problems.push("no last name");
    if (!city)
        problems.push("no city given");
    if (!country || !COUNTRIES.includes(country))
        problems.push("bad country given");
    if (!email || !/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email))
        problems.push("bad email");
    if (!favoriteCat || favoriteCat.length<2){
        problems.push("must have at least 2 categories");
    }else{
        let res = true;
        favoriteCat.forEach(cat => {
            res = res && CATEGORIES.includes(cat);
        });
        if (!res)
            problems.push("bad categories given");
    }
    if (!questions || questions.length<2){
        problems.push("must have at least 2 questions")
    }else {
        let res = true;
        questions.forEach(quest => {
            res = res && question_list.includes(quest.quest) && quest.ans;
        });
        if (!res)
            problems.push("bad questions or answers given")
    }

    return problems;
}
function signUp(req, res){
    let username = req.body.username,
        password = req.body.password,
        fName = req.body.fName,
        lName = req.body.lName,
        city = req.body.city,
        country = req.body.country,
        email = req.body.email,
        favoriteCat = req.body.favoriteCat, // array of categories
        questions = req.body.questions; // should be an array of objects with Q,A

    let problems = validateSignUp(username, password, fName, lName, city, country, email, favoriteCat, questions);
    if (problems.length > 0){
        res.status(400).send("Error while signing up. Errors: " + problems.toString());
        return;
    }


    let query = db.keyWords.selectAll + db.keyWords.from + "users " +
        db.keyWords.where + "username = '" + username + "'";
    let confirmPromise = db.execQuery(query);
    confirmPromise
        .then(result => {
            if (result.length !== 0){
                throw new Error('This username already exist. Please choose another one.');
            }
        })
        .then(result => {
            let queryUser = db.keyWords.insert + "users " +
                db.keyWords.valuesStart + putParethesis(username) + "," + putParethesis(password) + "," +
                putParethesis(fName) + "," + putParethesis(lName) + "," + putParethesis(email) + "," +
                putParethesis(city) + "," + putParethesis(country) + db.keyWords.valuesEnd;

            let queryQuest = insertQuestions(username, questions);
            let queryCat = insertCategories(username, favoriteCat);

            let promise1 = db.execQuery(queryUser),
                promise2 = db.execQuery(queryQuest),
                promise3 = db.execQuery(queryCat);

            promise1
                .then(result => {
                    console.log("user: " + username + " added successfully");
                    return promise2;
                })
                .then(result => {
                    console.log("inside");
                    return promise3;
                })
                .then(result => {
                    res.status(201).send("User created successfully!");
                })
                .catch(err => {
                    //TODO: fallback if one of them fail.
                    console.log(err);
                    res.status(500).send(err);
                })
        })
        .catch(err => {
            console.log(err.message);
            res.status(500).send(err.message);
        })

}

function insertQuestions(username, questions){
    console.log("Adding questions to DB...");

    let queryCur = db.keyWords.insert + "usersQuestions " +
        "VALUES ";

    questions.forEach(item => {
        queryCur += "(" + putParethesis(username) + "," + putParethesis(item.quest) + "," + putParethesis(item.ans) + "),";
    });
    queryCur = queryCur.slice(0, -1);
    queryCur += ";";
    return queryCur;
}

function insertCategories(username, categories){
    console.log("Adding categories for user " + username + " to DB...");

    let queryCur = db.keyWords.insert + "usersCategories " +
        "VALUES ";

    categories.forEach(item => {
        queryCur += "(" + putParethesis(username) + "," + putParethesis(item) + "),";
    });
    queryCur = queryCur.slice(0, -1);
    queryCur += ";";
    return queryCur;
}


/**
 * checks if the username and password exist. if so, returns a token
 * @param req -
 * @param res -
 */
function login(req, res){
    console.log("got login request");
    if (req.body.username && req.body.password) {

        let username = req.body.username;
        let password = req.body.password;

        console.log(username);
        console.log(password);

        // checks if the username and password are in the database
        let user_exists_query = db.keyWords.selectAll + db.keyWords.from + "users " + db.keyWords.where + "username = '" +
            username + "' AND password = '" + password + "'";

        let user_exists = db.execQuery(user_exists_query);

        user_exists
            .then(result => {

                // user exists
                if (result.length === 1) {
                    console.log(result);
                    // create and return the token
                    let payload = {name: req.body.username, admin: req.body.admin};
                    let options = {expiresIn: "1d"};
                    const token = jwt.sign(payload, SECRET, options);
                    res.status(200).send(token);
                } else {
                    res.status(401).send("Access denied. User doesn't exist");
                }
            })
            .catch(err => {
                console.log(err);
                res.sendStatus(500);
            });
    }
    else {
        console.log("missing username or password");
        res.status(500).send("missing username or password");
    }
}

/**
 * checks if the given question and answer are correct. if so, restores the user's password
 * @param req -
 * @param res -
 */
function restore_password(req, res){
    if (req.body.username && req.body.question && req.body.answer) {

        let username = req.body.username;
        let question = req.body.question;
        let answer = req.body.answer;

        if (question_list.includes(question)) {
            // checks if the question and answer of the username are correct
            let answer_correct_query = db.keyWords.select + "username, question, answer " + db.keyWords.from + "usersQuestions " +
                db.keyWords.where + "username = '" + username + "' AND question = '" + question + "' AND answer = '" + answer + "'";

            let answer_correct_promise = db.execQuery(answer_correct_query);

            answer_correct_promise
                .then(result => {

                    // user exists
                    if (result.length === 1) {

                        // gets the user's password
                        let get_password_query = db.keyWords.select + "password " + db.keyWords.from + "users " +
                            db.keyWords.where + "username = '" + username + "'";

                        let get_password_promise = db.execQuery(get_password_query);

                        get_password_promise
                            .then(innerResult => {
                                res.status(200).send(innerResult);
                            })
                            .catch(err => {
                                console.log(err);
                                res.sendStatus(500);
                            });
                    } else {
                        res.status(401).send("Access denied. Wrong user / answer");
                    }
                })
                .catch(err => {
                    console.log(err);
                    res.sendStatus(500);
                });
        }
        else {
            console.log("incorrect question");
            res.status(500).send("incorrect question");
        }
    }
    else {
        console.log("missing username or password");
        res.status(500).send("missing username or password");
    }
}

/**
 * gets all available authentication questions
 * @param req -
 * @param res -
 */
function getQuestions(req, res) {
    res.status(200).send(question_list);
}

/**
 * gets the 2 highest ranked POI, each of a different category
 * @param req -
 * @param res -
 */
function getUserRecommendedPoi(req, res) {
    let username = req.decoded.name;

    // gets the chosen favorite categories of the user
    let get_users_categories_query = db.keyWords.select + "category " + db.keyWords.from + "usersCategories " + db.keyWords.where +
        "username = '" + username + "'";

    let get_users_categories_promise = db.execQuery(get_users_categories_query);

    get_users_categories_promise
        .then(result => {

            let category_equals = "category = '";
            let favorite_categories_for_query = "";

            favorite_categories_for_query = favorite_categories_for_query + category_equals + result[0].category + "'";

            // adds all categories to the sql string
            let i = 1;
            while (i < result.length) {
                favorite_categories_for_query = favorite_categories_for_query + " OR " + category_equals + result[i].category + "'";
                i++;
            }

            // gets the chosen favorite categories of the user
            let get_recommended_poi_query = db.keyWords.selectAll + db.keyWords.from + "poi " + db.keyWords.where +
                favorite_categories_for_query;

            let get_recommended_poi_promise = db.execQuery(get_recommended_poi_query);

            get_recommended_poi_promise
                .then(inner_result => {

                    let category_array = [];

                    i = 0;
                    // create the 2 dimensional array
                    while (i < result.length) {
                        category_array.push([]);
                        i++;
                    }

                    inner_result.forEach(item => {
                        i = 0;
                        result.forEach(inner_item => {
                            if (inner_item.category === item.category) {
                                category_array[i].push(item);
                            }
                            else
                                i++;
                        });
                    });

                    category_array.forEach(item => {
                        item.sort((a,b) =>  (a.rank > b.rank) ? 1 : ((b.rank > a.rank) ? -1 : 0));
                    });

                    const shuffled = category_array.sort(() => 0.5 - Math.random());
                    // Get sub-array of first 2 elements after shuffled
                    let selected = shuffled.slice(0, 2);

                    let best_poi = [];

                    best_poi.push(selected[0].pop());
                    best_poi.push(selected[1].pop());

                    res.status(200).send(best_poi);
                })
                .catch(err => {
                    console.log(err);
                    res.sendStatus(500);
                });
        })
        .catch(err => {
            console.log(err);
            res.sendStatus(500);
        });
}

/**
 * gets the list of all the user's favorite POIs
 * @param req -
 * @param res -
 */
function getUserFavoritePoi(req, res) {
    let username = req.decoded.name;

    // gets the chosen favorite categories of the user
    let get_users_poi_query = db.keyWords.selectAll + db.keyWords.from + "usersPoi " + db.keyWords.where +
        "username = '" + username + "'";

    let get_users_poi_promise = db.execQuery(get_users_poi_query);

    get_users_poi_promise
        .then(result => {
            result.forEach(item => {
                item.time = new Date(item.time);
            });
            res.status(200).send(result);
        })
        .catch(err => {
            console.log(err);
            res.sendStatus(500);
        });
}

/**
 * saves the user's favorite POI list
 * @param req -
 * @param res -
 */
function saveFavoritePoi(req, res) {
    let valid_result = validateFavoritePoi(req);
    if (valid_result === 'Valid') {
        let username = req.decoded.name;

        let favPoi = req.body.favorite_poi;
        favPoi.forEach(poi => {
            let date = new Date(poi.time);
            if (isNaN(date.getDate())){
                res.status(400).send({error: "Given dates are not compatible"});
                return;
            }
            poi.time = date.toISOString();
        });

        // deletes the old favorite user's pois
        let delete_favorite_query = db.keyWords.delete + db.keyWords.from + "usersPoi " + db.keyWords.where +
            "username = '" + username + "'";

        let delete_favorite_promise = db.execQuery(delete_favorite_query);

        delete_favorite_promise
            .then(result => {

                // checks if there are any poi object in the favorite poi list
                if (req.body.favorite_poi.length > 0) {

                    // adds a new favorite user's poi
                    let add_favorite_query = db.keyWords.insert + "usersPoi " + db.keyWords.valuesStart +
                        "'" + username + "', '" + req.body.favorite_poi[0].poi + "', '" + req.body.favorite_poi[0].personalOrder + "', '" +
                        req.body.favorite_poi[0].time + "')";

                    let first = true;
                    req.body.favorite_poi.forEach(item => {

                        // skipping the first item
                        if (first) {
                            first = false;
                            return;
                        }

                        // adds a new favorite user's poi
                        add_favorite_query = add_favorite_query + ", ('" + username + "', '" + item.poi + "', '" + item.personalOrder + "', '" +
                            item.time + "')";
                    });

                    add_favorite_query = add_favorite_query + ";";
                    let add_favorite_promise = db.execQuery(add_favorite_query);

                    add_favorite_promise
                        .then(inner_result => {
                            res.status(201).send("User's favorite POI list updated");
                        })
                        .catch(err => {
                            console.log(err);
                            res.sendStatus(500);
                        });
                }
                else
                    res.status(201).send("User's favorite POI list updated");
            })
            .catch(err => {
                console.log(err);
                res.sendStatus(500);
            });
    }
    else {
        console.log(valid_result);
        res.status(500).send(valid_result);
    }
}

function getLastSavedPoi(req, res){
    let username = req.decoded.name;

    let query = db.keyWords.selectAll +
        db.keyWords.from + "usersPoi " +
        db.keyWords.where + "username = '" + username + "'";

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
        .catch(err => {
            console.log(err);
            res.status(500).send(err);
        });
}

/*********************      EXPORTS     ************************/
exports.login = login;
exports.signUp = signUp;
exports.restore_password = restore_password;
exports.getQuestions = getQuestions;
exports.getUserRecommendedPoi = getUserRecommendedPoi;
exports.getUserFavoritePoi = getUserFavoritePoi;
exports.saveFavoritePoi = saveFavoritePoi;
exports.getLastSavedPoi = getLastSavedPoi;
