var express = require('express') //this is the equivalent of importng a package
var mysql = require('mysql') //this is the equivalent of importng a package
var bodyParser = require('body-parser');
var nodemailer = require('nodemailer');
var dateTimeHelper = require('./dateTimeHelper.js');

//Assad
var connection = mysql.createConnection({
    host: '127.0.0.1',
    port: '3306',
    user: 'root',
    password: 'London12@',
    database: 'kent_social'
});




/* Difference betwen Java and JS Functions
[ JAVASCRIPT ]
function myFunction(){
    return "hi"
}

[ JAVA ]
private String myFunction(){
    return "hi"
} */

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
        /* error will be an Error if one occurred during the query
        results will contain the results of the query
        fields will contain information about the returned results fields (if any) */


        for (var i = 0; i < results.length; i++) {
            //lets make an empty object
            var obj = {}

            /* and then make a key clled username
            and then get the current object in the loop, and get the username field from it */
            obj.username = results[i].username;
            obj.firstName = results[i].firstName;
            obj.lastName = results[i].lastName;
            obj.phoneNumber = results[i].phoneNumber;
            // obj.profilePicture = results[i].profilePicture;

            filteredUsers.push(obj)
        }

        /* [{
            username:
             firtsName:
        }] */

        console.log(results);
        res.send(filteredUsers);
    });

})

//app.post('/uploadProfileImage') {

//req.body.username
//req.body.base64image


//do a queyr to check thar the user youre trying to update exists

// if they do exist 

//convert the image they uploaded to base64 (android side, so at this point uou should get /9/dsdhakjh379837dhakhdkjahk)

/*  UPDATE socialapp.Users
 SET profilePicture = 'BASE 64 STRING GOES HERE'
 WHERE username = 'req.body.username' */
//}

app.get('/userprofile', function (req, res) {
    var username = req.query.id;

    var sql = "SELECT * FROM ?? WHERE ?? = ?";
    var inserts = ['Users', 'username', username];
    var userProfileQuery = mysql.format(sql, inserts);


    // Following Query - Who I FOLLOW
    var followingQuery = 'SELECT u.username, u.firstName, u.lastName FROM kent_social.Users u INNER JOIN kent_social.Followers f ON u.username = f.following WHERE f.follower = "' + username + '"'

    // Followers Query - Who FOLLOWS ME
    var followersQuery = 'SELECT u.username, u.firstName, u.lastName, FROM kent_social.Users u INNER JOIN kent_social.Followers f ON u.username = f.follower WHERE f.following = "' + username + '"'

    // Check if user exists
    connection.query('SELECT * FROM Users WHERE username = "' + username + '"', function (error, results) {

        //If the username doesn't exist, then this else statement will just show "Username doesnt exist".

        if (results.length >= 1) {

            // 1 - User Profile Query
            connection.query(userProfileQuery, function (error, userProfileResults, fields) {

                //console.log(userProfileResults[0].profilePicture)
                //console.log(new Buffer(userProfileResults[0].profilePicture).toString('utf8'))

                // 2 - Following Query
                connection.query(followingQuery, function (error, followingResults, fields) {
                    // 3 - Followers Query
                    connection.query(followersQuery, function (error, followerResults, fields) {
                        var combinedData = {
                            "userProfile": {
                                "username": userProfileResults[0].username,
                                "firstName": userProfileResults[0].firstName,
                                "lastName": userProfileResults[0].lastName,
                                "pwd": userProfileResults[0].pwd,
                                "emailAddress": userProfileResults[0].emailAddress,
                                "phoneNumber": userProfileResults[0].phoneNumber
                                //"profileImage": new Buffer(userProfileResults[0].profilePicture).toString('utf8')
                            },
                            "followers": followerResults,
                            "following": followingResults
                        }

                        res.send(combinedData);
                    })
                })
            })

        } else {

            res.setHeader('Content-Type', 'application/json');
            res.status(400)

            var erroObj = {
                "error": "Username doesn't exist"
            }
            res.send(erroObj)
        }
    })
})


app.get('/posts', function (req, res) {
    connection.query('SELECT * FROM Posts', function (error, results, fields) {
        res.send(results);
    })
})

app.get('/userEvents', function (req, res) {
    connection.query('SELECT * FROM User_Events', function (error, results, fields) {
        res.send(results);
    })
})

app.get('/findEvents', function (req, res) {

    var username = req.query.username;
    var userEventsQuery = 'SELECT e.eventID, e.eventTitle, e.eventDescription, e.eventAuthor, e.eventTime, e.timePosted FROM Events e INNER JOIN User_Events ue ON e.eventID = ue.eventID WHERE ue.username = "' + username + '"'

    connection.query(userEventsQuery, function (error, results) {
        res.status(200)
        res.send(results)
    })
})



app.post('/joinEvent', function (req, res) {

    var username = req.body.username;
    var eventID = req.body.eventID;

    var joinSuccessful = {
        "message": username + " has joined event " + eventID,
        "response": "OK"
    }

    var emailAddressQuery = 'SELECT u.emailAddress FROM Events e INNER JOIN Users u ON e.eventAuthor = u.username WHERE e.eventID = "' + eventID + '"'

    connection.query('INSERT INTO `User_Events` SET ?', req.body, function (error, results, fields, rows) {

        connection.query(emailAddressQuery, function (error, emailAddressResult, fields, rows) {

            var recipient = emailAddressResult[0].emailAddress

            sendEmailJoinEvent(recipient, username)

            res.setHeader('Content-Type', 'application/json');
            res.status(200)
            res.send(joinSuccessful)
        });

    });
})

app.delete('/leaveEvent', function (req, res) {

    var username = req.body.username;
    var eventID = req.body.eventID;

    var sql = "DELETE FROM ?? WHERE ?? = ? AND ?? = ?";
    var inserts = ['User_Events', 'username', username, 'eventID', eventID];
    var removeUserFromEventQuery = mysql.format(sql, inserts);

    var leaveSuccessful = {
        "message": username + " has left event " + eventID,
        "response": "OK"
    }

    connection.query(removeUserFromEventQuery, function (error, results, fields, rows) {
        res.setHeader('Content-Type', 'application/json');
        res.status(200)
        res.send(leaveSuccessful)
    });
})



app.get('/events', function (req, res) {
    var arrayOfEvents = [];

    connection.query('SELECT * FROM Events', function (error, results, fields) {

        results.forEach(singleObject => {
            var object = {
                "eventID": singleObject.eventID,
                "eventTitle": singleObject.eventTitle,
                "eventDescription": singleObject.eventDescription,
                "eventAuthor": singleObject.eventAuthor,
                "eventTime": dateTimeHelper.convertDateTime(singleObject.eventTime),
                "timePosted": singleObject.timePosted
            }
            arrayOfEvents.push(object)
        });


        res.send(arrayOfEvents);
    })
})


app.get('/search', function (req, res) {
    var incomingSearch = req.query.title;

    connection.query('SELECT * FROM Post WHERE PostTitle = "' + incomingSearch + '"', function (error, results, fields) {
        res.send(results);
    })
})

app.post('/createPost', function (req, res) {

    var currentDate = new Date()


    var dataToInsert = {
        "postID": 0,
        "postTitle": req.body.postTitle,
        "postDescription": req.body.postDescription,
        "postAuthor": req.body.postAuthor,
        "postTime": currentDate
    }

    var userDoesNotExist = {
        "message": "Post could not be created",
        "response": "BAD",
        "reason": "User does not exist"
    }

    var postSuccesful = {
        "message": "Post created",
        "response": "OK",
        "reason": "Post has been created"
    }


    //Skeleton
    var userQuery = "SELECT * FROM ?? WHERE ?? = ?";

    //Data to go into question marks
    var userInserts = ['Users', 'username', req.body.postAuthor];
    var userGeneratedQuery = mysql.format(userQuery, userInserts);

    connection.query(userGeneratedQuery, function (error, results) {

        if (results.length >= 1) {

            connection.query('INSERT INTO `Posts` SET ?', dataToInsert, function (error, results, fields, rows) {

                res.setHeader('Content-Type', 'application/json');
                res.status(200)
                res.send(postSuccesful)
            });

        } else {
            res.setHeader('Content-Type', 'application/json');
            res.status(400)
            res.send(userDoesNotExist)
        }
    });
})

app.post('/createEvents', function (req, res) {

    var currentDate = new Date()
    //eventID, eventTitle, eventDescription, eventAuthor, eventTime

    var dataToInsert = {
        "eventID": 0,
        "eventTitle": req.body.eventTitle,
        "eventDescription": req.body.eventDescription,
        "eventAuthor": req.body.eventAuthor,
        "eventTime": currentDate
    }

    var userDoesNotExist = {
        "message": "Event could not be created",
        "response": "BAD",
        "reason": "User does not exist"
    }

    var eventSuccessful = {
        "message": "Event created",
        "response": "OK",
        "reason": "Post has been created"
    }


    //Skeleton
    var userQuery = "SELECT * FROM ?? WHERE ?? = ?";

    //Data to go into question marks
    var userInserts = ['Users', 'username', req.body.eventAuthor];
    var userGeneratedQuery = mysql.format(userQuery, userInserts);

    connection.query(userGeneratedQuery, function (error, results) {

        console.log("HIT THIS POINT")

        if (results.length >= 1) {

            connection.query('INSERT INTO `Events` SET ?', dataToInsert, function (error, results, fields, rows) {

                console.log(error)
                console.log(results)

                res.setHeader('Content-Type', 'application/json');
                res.status(200)
                res.send(eventSuccessful)
            });

        } else {
            res.setHeader('Content-Type', 'application/json');
            res.status(400)
            res.send(userDoesNotExist)
            console.log(error)
        }
    });
})

app.post('/login', function (req, res) {

    /* SELECT * FROM socialapp.Users
    WHERE username = "af410"
    AND pwd = "London23" */

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


app.post('/likeevent', function (req, res) {
    var eventID = req.body.eventID
    var username = req.body.username

    var checkEventSQL = "SELECT * FROM ?? WHERE ?? = ? AND ?? = ?";
    var inserts = ['Event_Likes', 'eventID', eventID, "username", username];
    var checkIfEventExistsSQL = mysql.format(checkEventSQL, inserts);

    var deleteEventSQl = "DELETE FROM ?? WHERE ?? = ? AND ?? = ?";
    var inserts = ['Event_Likes', 'eventID', eventID, "username", username];
    var deleteExistingLikeSQL = mysql.format(deleteEventSQl, inserts);

    connection.query(checkIfEventExistsSQL, function (error, results) {

        if (results.length > 0) {
            connection.query(deleteExistingLikeSQL, function (error, results) {
                res.setHeader('Content-Type', 'application/json');
                res.status(200)
                res.send("Unliked")
            })

        } else {
            connection.query('INSERT INTO `Event_Likes` SET ?', req.body, function (error, results, fields, rows) {
                res.setHeader('Content-Type', 'application/json');
                res.status(200)
                res.send("Liked")
            });
        }
    });

});

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

    var verificationSuccess = {
        "status": "successful"
    }

    var verificationError = {
        "status": "bad"
    }

    connection.query(newFormattedSQL, function (error, results) {

        if (results.length >= 1) {
            res.status(200)
            res.send(verificationSuccess);

        } else {
            res.status(400)
            res.send(verificationError)
        }


    });
});


app.post('/register', function (request, response) {
    var username = request.body.username
    var emailAddress = request.body.emailAddress


    var userPostingData = request.body;


    var registerSuccessfulObj = {
        "message": "Register successful",
        "response": "OK"
    }

    var registerUnsuccessfulUsernameExistsObj = {
        "message": "Register unsuccessful",
        "response": "BAD",
        "reason": "Username exists"
    }

    var registerUnsuccessfulEmailExistsObj = {
        "message": "Register unsuccessful",
        "response": "BAD",
        "reason": "Email exists"
    }


    connection.query("DELETE FROM Users WHERE username = 'test'")

    console.log("Deleted the user with id ---> 'test'")

    connection.query('SELECT * FROM Users WHERE emailAddress = "' + emailAddress + '"', function (error, results) {

        if (results.length == 1) {
            response.status(400)
            response.send(registerUnsuccessfulEmailExistsObj)

        } else { //If the email address doesn't exist, then this else statement will perform another qurey for a dupilate username. 

            connection.query('SELECT * FROM Users WHERE username = "' + username + '"', function (error, results) {

                //If the username doesn't exist, then this else statement will perform a qurey to insert the data.

                if (results.length == 1) {
                    response.setHeader('Content-Type', 'application/json');
                    response.status(400)
                    response.send(registerUnsuccessfulUsernameExistsObj)

                } else {
                    connection.query('INSERT INTO `Users` SET ?', userPostingData, function (error, results, fields, rows) {
                        response.setHeader('Content-Type', 'application/json');
                        response.status(200)
                        response.send(registerSuccessfulObj)

                        //console.log(error);
                    });
                }
            });
        }

    });

})


/*
    Endpoint   : /follow
    Purpose    : This endpoint allows a user to follow another user
*/
app.post('/follow', function (request, response) {
    var follower = request.body.follower
    var following = request.body.following

    var followData = request.body;

    var followSuccess = {
        "message": "Follow successful",
        "response": "OK"
    }

    var followUnsuccessful = {
        "message": "Follow unsuccessful",
        "response": "BAD",
        "reason": "You are already following that user"
    }

    var userDoesNotExist = {
        "message": "Follow unsuccessful",
        "response": "BAD",
        "reason": "User does not exist"
    }

    //Skeleton
    var userQuery = "SELECT * FROM ?? WHERE ?? = ?";

    //Data to go into question marks
    var userInserts = ['Users', 'username', following];
    var userGeneratedQuery = mysql.format(userQuery, userInserts);

    connection.query(userGeneratedQuery, function (error, results) {

        if (results.length >= 1) {

            // Check to see if they're already following
            var followQuery = "SELECT * FROM ?? WHERE ?? = ? AND ?? = ?";

            //Data to go into question marks
            var followInserts = ['Followers', 'follower', follower, 'following', following];
            var followGeneratedQuery = mysql.format(followQuery, followInserts);


            connection.query(followGeneratedQuery, function (error, results) {

                if (results.length == 1) {
                    response.status(400)
                    response.send(followUnsuccessful)

                } else {

                    connection.query('INSERT INTO `Followers` SET ?', followData, function (error, results, fields, rows) {
                        response.setHeader('Content-Type', 'application/json');
                        response.status(200)
                        response.send(followSuccess)
                    });
                }
            });


        } else {
            response.setHeader('Content-Type', 'application/json');
            response.send(userDoesNotExist)
        }
    });



})


app.get('/following', function (req, res) {
    var usernameQueried = req.query.username;

    //This is a string which represents our qurey 
    var queryToExec = 'SELECT u.username, u.firstName, u.lastName FROM kent_social.Users u INNER JOIN kent_social.Followers f ON u.username = f.following WHERE f.follower = "' + usernameQueried + '"'
    //Once the string has been built using the provided MySQL qurey, which will be inptuted into the query which will get the results 
    connection.query(queryToExec, function (error, results, fields) {
        res.send(results);
    })
})

app.get('/followers', function (req, res) {

    var usernameQueried = req.query.username;

    var queryToExec = 'SELECT u.username, u.firstName, u.lastName FROM kent_social.Users u INNER JOIN kent_social.Followers f ON u.username = f.follower WHERE following = "' + usernameQueried + '"'

    connection.query(queryToExec, function (error, results, fields) {

        res.send(results);
    })

})


app.get('/emails', function (req, res) {

    var emailQueried = req.query.email;

    var queryToExec = 'SELECT u.username, u.firstName, u.lastName FROM kent_social.Users u INNER JOIN kent_social.Followers f ON u.username = f.follower WHERE following = "' + usernameQueried + '"'

    connection.query(queryToExec, function (error, results, fields) {

        res.send(results);
    })

})


app.get('/checkEmail', function (req, res) {

    var username = req.query.username;


    var sql = "SELECT emailAddress FROM ?? WHERE ?? = ?";
    var inserts = ['Users', 'username', username];
    var newFormattedSQL = mysql.format(sql, inserts);

    console.log(newFormattedSQL)

    connection.query(newFormattedSQL, function (error, results) {

        if (results.length >= 1) {
            res.status(200)
            res.send(results[0]);

        } else {
            res.status(400)
            res.send("Email addresss doesnt exist")
        }
    });
});

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

function sendEmailJoinEvent(sendTo, usernameWhoSignedUp) {

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
            subject: "Welcome To Kent Social", // Subject line
            text: usernameWhoSignedUp + " has joined your event", // plain text body
            html: "<b style='color: black'>" + usernameWhoSignedUp + " has joined your event" + "</b>" // html body
        };

        let info = await transporter.sendMail(mailOptions)

        console.log("Message sent: %s", info.messageId);
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }

    main().catch(console.error);
}
app.listen(3000)