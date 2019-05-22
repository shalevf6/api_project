var db = require('./DButils');


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
                let get_password_query = db.keyWords.select + "password" + db.keyWords.from + "users " +
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
                res.status(401).send("Access denied. No user found");
            }
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