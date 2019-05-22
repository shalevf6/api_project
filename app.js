
var express = require('express');
var app = express();
var DButilsAzure = require('./Utils/DButils');
var POIUtil = require('./Utils/poiUtils');

let port = 3000;

secret = "thisIsASecret";

app.use(express.json());

app.listen(port, function () {
    console.log('Example app listening on port ' + port);
});

//
// app.get('/select', function(req, res){
//     DButilsAzure.execQuery("SELECT * FROM tableName")
//         .then(function(result){
//             res.send(result)
//         })
//         .catch(function(err){
//             console.log(err);
//             res.send(err)
//         })
// });

app.post("/login", (req, res) => {
    payload = { id: 1, name: "user1", admin: true };
    options = { expiresIn: "1d" };
    const token = jwt.sign(payload, secret, options);
    res.send(token);
});

app.post("/private", (req, res) => {
    const token = req.header("x-auth-token");
    // no token
    if (!token) res.status(401).send("Access denied. No token provided.");
    // verify token
    try {
        const decoded = jwt.verify(token, secret);
        req.decoded = decoded;
        if (req.decoded.admin)
            res.status(200).send({ result: "Hello admin." });
        else
            res.status(200).send({ result: "Hello user." });
    } catch (exception) {
        res.status(400).send("Invalid token.");
    }
});

app.post('/api/sign_up', function(req, res){

    let username = req.body.username;
    console.log(username);

    // checks if the username already exists in the database
    let user_exists_query = "SELECT username FROM users WHERE username = " + username;

    let user_name_exists = DButilsAzure.execQuery(user_exists_query);

    user_name_exists
        .then(function (result) {

        // user doesn't exist in the database
        if (result.length > 0) {
            console.log(result);

            // adds all the general details about the user to the database
            let add_general_user_query = "INSERT INTO users VALUES (" + username + " , " + req.body.password + " , " +
                req.body.first_name + " , " + req.body.last_name + " , " + req.body.email + " , " + req.body.city + " , " +
                req.body.country + ")";

            let add_user = DButilsAzure.execQuery(add_general_user_query);

            // add_user.then(function (q1_result) {
            //     res.send(q1_result);
            // });

            add_user.catch(function(error) {
                console.log(error);
                res.status(500).send(error)
            });

            let user_questions = req.body.questions;
            let user_answers = req.body.answers;
            let i = 0;

            // loop through all the user's recovery questions and answers and add them to the database
            while (i < user_questions.length) {
                // adds the user's recovery questions and answers
                let add_questions_query = "INSERT INTO usersQuestions VALUES (" + username + " , " + user_questions[i] +
                    " , " + user_answers[i] + ")";

                let add_questions = DButilsAzure.execQuery(add_questions_query);

                // add_questions.then(function (q2_result) {
                //     res.send(q2_result);
                // });

                add_questions.catch(function(error) {
                    console.log(error);
                    res.status(500).send(error)
                });
                i++;
            }

            let user_categories = req.body.questions;
            i = 0;

            // loop through all the user's favorite categories and add them to the database
            while (i < user_categories.length) {

                // adds a user's favorite category
                let add_category_query = "INSERT INTO usersCategories VALUES (" + username + " , " + user_categories[i] + ")";

                let add_category = DButilsAzure.execQuery(add_category_query);

                // add_category.then(function (q3_result) {
                //     res.send(q3_result);
                // });

                add_category.catch(function (error) {
                    console.log(error);
                    res.status(500).send(error)
                });
            }

            // sends the the newly created user's username
            res.status(201).send(JSON.parse('{“username”:”' + username + '"}'));
        }

        // user already exists in the database
        else {
            res.send(null);
        }
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

