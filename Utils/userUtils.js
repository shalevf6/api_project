var db = require('./DButils');
const jwt = require('jsonwebtoken');

const question_list = ['What elementary school did you attend?', 'What is the name of the town where you were born?',
    'What is your mother\'s maiden name?', 'What is your favorite sports team?'];


/**************************     DATABASE FUNCTIONS      **************************/

/**
 * checks if a username already exists. if not, adds the new user's details to the database
 * @param req -
 * @param res -
 */
function sign_up(req, res){

    let username = req.body.username;
    console.log(username);

    // checks if the username already exists in the database
    let user_exists_query = "SELECT username FROM users WHERE username = " + username;

    let user_name_exists = db.execQuery(user_exists_query);

    user_name_exists
        .then(result => {

            // user doesn't exist in the database
            if (result.length > 0) {
                console.log(result);

                // adds all the general details about the user to the database
                let add_general_user_query = "INSERT INTO users VALUES (" + username + " , " + req.body.password + " , " +
                    req.body.first_name + " , " + req.body.last_name + " , " + req.body.email + " , " + req.body.city + " , " +
                    req.body.country + ")";

                let add_user = db.execQuery(add_general_user_query);

                // add_user.then(function (q1_result) {
                //     res.send(q1_result);
                // });

                add_user.catch(error => {
                    console.log(err);
                    res.sendStatus(500);
                });

                let user_questions = req.body.questions;
                let user_answers = req.body.answers;
                let i = 0;

                // loop through all the user's recovery questions and answers and add them to the database
                while (i < user_questions.length) {
                    // adds the user's recovery questions and answers
                    let add_questions_query = "INSERT INTO usersQuestions VALUES (" + username + " , " + user_questions[i] +
                        " , " + user_answers[i] + ")";

                    let add_questions = db.execQuery(add_questions_query);

                    // add_questions.then(function (q2_result) {
                    //     res.send(q2_result);
                    // });

                    add_questions.catch(error => {
                        console.log(err);
                        res.sendStatus(500);
                    });
                    i++;
                }

                let user_categories = req.body.questions;
                i = 0;

                // loop through all the user's favorite categories and add them to the database
                while (i < user_categories.length) {

                    // adds a user's favorite category
                    let add_category_query = "INSERT INTO usersCategories VALUES (" + username + " , " + user_categories[i] + ")";

                    let add_category = db.execQuery(add_category_query);

                    // add_category.then(function (q3_result) {
                    //     res.send(q3_result);
                    // });

                    add_category.catch(error => {
                        console.log(err);
                        res.sendStatus(500);
                    });
                }

                // sends the the newly created user's username
                res.status(201).send(JSON.parse('{“username”:”' + username + '"}'));
            }

            // user already exists in the database
            else {
                res.status(404).send("username already exists");
            }
        })
        .catch(err =>{
            console.log(err);
            res.sendStatus(500);
        });
}


/**
 * checks if the username and password exist. if so, returns a token
 * @param req -
 * @param res -
 */
function login(req, res){
    let username = req.body.username;
    let password = req.body.password;

    console.log(username);
    console.log(password);

    // checks if the username and password are in the database
    let user_exists_query = db.keyWords.selectAll + db.keyWords.from +"users " + db.keyWords.where + "username = '" +
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
                const token = jwt.sign(payload, secret, options);
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

/**
 * checks if the given question and answer are correct. if so, restores the user's password
 * @param req -
 * @param res -
 */
function restore_password(req, res){
    let username = req.body.username;
    let question = req.body.question;
    let answer = req.body.answer;

    console.log(username);
    console.log(question);
    console.log(answer);

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
    let get_users_poi_query = db.keyWords.select + "poi " + db.keyWords.from + "usersPoi " + db.keyWords.where +
        "username = '" + username + "'";

    let get_users_poi_promise = db.execQuery(get_users_poi_query);

    get_users_poi_promise
        .then(result => {
            if (result.length > 0)
                res.status(200).send(result);
            else
                res.status(404).send("No favorite POI found");
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
    let username = req.decoded.name;

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
                    .catch(err => {
                        console.log(err);
                        res.sendStatus(500);
                    });
            }
            res.status(201).send("User's favorite POI list updated");
        })
        .catch(err => {
            console.log(err);
            res.sendStatus(500);
        });
}

/*********************      EXPORTS     ************************/
exports.login = login;
exports.sign_up = sign_up;
exports.restore_password = restore_password;
exports.getQuestions = getQuestions;
exports.getUserRecommendedPoi = getUserRecommendedPoi;
exports.getUserFavoritePoi = getUserFavoritePoi;
exports.saveFavoritePoi = saveFavoritePoi;