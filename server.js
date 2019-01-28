var express = require('express') //this is the equivalent of importng a package
var mysql = require('mysql') //this is the equivalent of importng a package
var bodyParser = require('body-parser');
var nodemailer = require('nodemailer');

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
app.use(bodyParser.urlencoded({
    extended: false
}));
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

// app.get('/example', function (req, res)
// {
//     var Posts = req.body.Posts;


//     var sql = "SELECT * FROM ??";
//     var inserts = ['Posts', 'emailAddress', email, "token", token];
//     var newFormattedSQL = mysql.format(sql);

//     console.log(newFormattedSQL)


// })


app.get('/posts', function (req, res) 
{
    connection.query('SELECT * FROM Posts', function (error, results, fields) {
        res.send(results);
    })
})

app.get('/search', function (req, res) {
    var incomingSearch = req.query.title;

    connection.query('SELECT * FROM Post WHERE PostTitle = "' + incomingSearch + '"', function (error, results, fields) {
        res.send(results);
    })
})

app.post('/login', function (req, res) {

    // SELECT * FROM socialapp.Users
    // WHERE username = "af410"
    // AND pwd = "London23"

    var authenticationSuccessfulObj = {
        "message": "Authentication successful",
        "response": "OK"
    }

    var authenticationUnsuccessfulObj = {
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

app.post('/generateEmailToken', function (req, res) {
    var emailAddress = req.body.emailAddress

    var randomString = Math.random().toString(36).substring(5);
    var generatedKey = randomString.substr(0, 5)

    var registerTokenObj = {
        "generated_key": generatedKey
    }

    sendEmail(emailAddress, generatedKey)

    var currentDate = new Date()

    var dataToInsert = {
        "emailAddress": emailAddress,
        "token": generatedKey,
        "expiryTime": currentDate
    }

    connection.query('INSERT INTO `Email_Token` SET ?', dataToInsert, function (error, results, fields, rows) {

        res.setHeader('Content-Type', 'application/json');
        res.send(registerTokenObj)
    });
});

app.post('/checkEmailToken', function (req, res) {

    var token = req.body.token;
    var email = req.body.email;


    var sql = "SELECT * FROM ?? WHERE ?? = ? AND ?? = ?";
    var inserts = ['Email_Token', 'emailAddress', email, "token", token];
    var newFormattedSQL = mysql.format(sql, inserts);

    console.log(newFormattedSQL)

    connection.query(newFormattedSQL, function (error, results) {

        if (results.length >= 1) {

            res.send("Valid token");

        } else {

            res.send("Invalid token")
        }


    });



});


app.post('/register', function (request, response) {
    var username = request.body.username
    var firstName = request.body.firstName
    var lastName = request.body.lastName
    var pwd = request.body.pwd
    var emailAddress = request.body.emailAddress


    var userPostingData = request.body;


    var registerSuccessfulObj = {
        "message": "Register successful",
        "response": "OK"
    }

    var registerUnsuccessfulObj = {
        "message": "Register unsuccessful",
        "response": "BAD"
    }


    connection.query("DELETE FROM Users WHERE username = 'test'")

    console.log("Deleted the user with id ---> 'test'")

    connection.query('SELECT * FROM Users WHERE username = "' + username + '"', function (error, results) {

        if (results.length == 1) {
            response.setHeader('Content-Type', 'application/json');
            response.status(400)
            response.send(registerUnsuccessfulObj)

        } else {
            connection.query('INSERT INTO `Users` SET ?', userPostingData, function (error, results, fields, rows) {
                response.setHeader('Content-Type', 'application/json');
                response.status(200)
                response.send(registerSuccessfulObj)

                //console.log(error);
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

function sendEmail(sendTo, token) {

    async function main() {

        let transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true, // true for 465, false for other ports
            auth: {
                user: "assadfarid8@gmail.com", // generated ethereal user
                pass: "London12@" // generated ethereal password
            }
        });

        let mailOptions = {
            from: '"Assad Farid', // sender address
            to: sendTo, // list of receivers
            subject: "Welcome To MyApp", // Subject line
            text: "Your generated token is " + token, // plain text body
            html: "<b style='color: red'>" + "Your generated token is " + token + "</b>" // html body
        };

        let info = await transporter.sendMail(mailOptions)

        console.log("Message sent: %s", info.messageId);
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }

    main().catch(console.error);
}


app.listen(3000)