
var express = require('express') //this is the equivalent of importng a package
var mysql = require('mysql') //this is the equivalent of importng a package
var bodyParser = require('body-parser');
//Assad
var connection = mysql.createConnection({
    host: 'localhost',
    port: '3306',
    user: 'root',
    password: 'London12@',
    database: 'socialapp'
});

//Difference betwen Java and JS Functions
// [ JAVASCRIPT ]
// function myFunction(){
//     return "hi"
// }

// [ JAVA ]
// private String myFunction(){
//     return "hi"
// }


connection.connect(function (err) {
    if (err) {
        console.error('error connecting: ' + err.stack);
    } else {
        console.log('connected as id ' + connection.threadId);
    }
});

var app = express()
//app.use allows us to add extensions to our server
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())

app.get('/users', function (req, res) {
    var filteredUsers = [];




    connection.query('SELECT * FROM `Users`', function (error, results, fields) {
        // error will be an Error if one occurred during the query
        // results will contain the results of the query
        // fields will contain information about the returned results fields (if any)


        for (var i = 0; i < results.length; i++) {
            //lets make an empty object
            var obj = {}

            // and then make a key clled username
            // and then get the current object in the loop, and get the username field from it
            obj.username = results[i].username;
            obj.firstName = results[i].firstName;
            obj.lastName = results[i].lastName;

            filteredUsers.push(obj)
        }

        // [{
        //     username:
        //      firtsName:
        // }]

        console.log(results);
        res.send(filteredUsers);
    });

})

app.post('/signup', function (request, response) {
    var username = request.body.username
    var firstName = request.body.firstName
    var lastName = request.body.lastName
    var pwd = request.body.pwd


    var userPostingData = request.body;

    connection.query('SELECT * FROM Users WHERE username = "' + username + '"', function (error, results) {

        if (results.length == 1) {
            response.send("User already exists")
        } else {
            connection.query('INSERT INTO `Users` SET ?', userPostingData, function (error, results, fields) {
                response.send('User inserted successfully')
            });

        }
    });

})

app.get('/posts', function (req, res) {

    connection.query('SELECT * FROM Post', function (error, results, fields) {
        // console.log.apply(results);
        res.send(results);
    })
})

app.get('/search', function (req, res) {
    var incomingSearch = req.query.title;

    // console.log('SELECT * FROM Post WHERE PostTitle = "' + incomingSearch + '"');

    connection.query('SELECT * FROM Post WHERE PostTitle = "' + incomingSearch + '"', function (error, results, fields) {
        // console.log.apply(results);
        res.send(results);
    })
})

app.delete('/delete', function (req, res) {

    connection.query('DELETE FROM Post WHERE PostTitle = ""', function (error, results) {
        //console.log(results);

        res.send('item deleted');
    })
})

app.post('/login', function (req, res) {

    // SELECT * FROM socialapp.Users
    // WHERE username = "af410"
    // AND pwd = "London23"

    var authenticationSuccessfulObj =
    {
        "message": "Authentication successful",
        "response": "OK"
    }

    var authenticationUnsuccessfulObj =
    {
        "message": "Authentication unsuccessful",
        "response": "BAD"
    }


    var username = req.body.username
    var pwd = req.body.pwd

    connection.query('SELECT * FROM Users WHERE username = "' + username + '"' + ' AND pwd = ' + '"' + pwd + '"', function (error, results) {

        if (results.length == 1) {
            res.status(200)
            res.send(authenticationSuccessfulObj)
        } else {
            res.status(401)
            res.send(authenticationUnsuccessfulObj)
        }
    });


})

app.post('/register', function (request, response) {
    var username = request.body.username
    var firstName = request.body.firstName
    var lastName = request.body.lastName
    var pwd = request.body.pwdnpm


    var userPostingData = request.body;

    connection.query('SELECT * FROM Users WHERE username = "' + username + '"', function (error, results) {

        if (results.length == 1) {
            response.send("User already exists")
        } else {
            connection.query('INSERT INTO `Users` SET ?', userPostingData, function (error, results, fields) {
                response.send('User inserted successfully')
            });

        }
    });
})

app.get('/followers', function (req, res) {
    var usernameQueried = req.query.username;

    //This is a string which represents our qurey 
    var queryToExec = 'SELECT u.username, u.firstName, u.lastName FROM socialapp.Users u INNER JOIN socialapp.Followers f ON u.username = f.following WHERE f.follower = "' + usernameQueried + '"'
    //Once the string has been built using the provided MySQL qurey, which will be inptuted into the query which will get the results 
    connection.query(queryToExec, function (error, results, fields) {
        res.send(results);
    })
})

app.get('/following', function (req, res) {

    var usernameQueried = req.query.username;

    var queryToExec = 'SELECT u.username, u.firstName, u.lastName FROM socialapp.Users u INNER JOIN socialapp.Followers f ON u.username = f.follower WHERE following = "' + usernameQueried + '"'

    connection.query(queryToExec, function (error, results, fields) {

        res.send(results);
    })

})

app.listen(3000)