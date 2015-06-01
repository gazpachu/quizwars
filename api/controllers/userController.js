 /*!
* UserController.js
* Server-side logic for managing users
*
* @project   QUIZ WARS
* @date      2014-11-15
* @author    JOAN MIRA, SapientNitro <JMIRA@sapient.com>
* @licensor  INTERNAL PROJECT
*
*/

module.exports = {

    login: function (req, res) {

        // See `api/responses/login.js`
        return res.login({
            email: req.param('email'),
            password: req.param('password'),
            successRedirect: '/quiz',
            invalidRedirect: '/'
        });
    },

    logout: function (req, res) {

        req.session.me = null;

        // If this is not an HTML-wanting browser, e.g. AJAX/sockets/cURL/etc.,
        // send a simple response letting the user agent know they were logged out
        // successfully.
        if (req.wantsJSON) {
            return res.ok('Logged out successfully!');
        }

        // Otherwise if this is an HTML-wanting browser, do a redirect.
        return res.redirect('/');
    },

    signup: function (req, res) {

        // Attempt to signup a user using the provided parameters
        User.signup({
            name: req.param('name'),
            email: req.param('email'),
            password: req.param('password'),
            avatar: req.param('avatar'),
        }, function (err, user) {
            // res.negotiate() will determine if this is a validation error
            // or some kind of unexpected server error, then call `res.badRequest()`
            // or `res.serverError()` accordingly.
            if (err) return res.negotiate(err);

            // Go ahead and log this user in as well.
            // We do this by "remembering" the user in the session.
            // Subsequent requests from this user agent will have `req.session.me` set.
            req.session.me = user.id;
            req.session.name = user.name;

            // If this is not an HTML-wanting browser, e.g. AJAX/sockets/cURL/etc.,
            // send a 200 response letting the user agent know the signup was successful.
            if (req.wantsJSON) {
                return res.ok('Signup successful!');
            }

            // Otherwise if this is an HTML-wanting browser, redirect to /welcome.
            return res.redirect('/quiz');
        });
    },

    chat: function (req, res) {
        sails.io.sockets.emit("chat", {verb:"messaged", data:{from: req.param('sender'), msg: req.param('msg')}})
    },

    status: function (req, res) {

        if (typeof req.param('id') === 'string') { // We want to change the status of a group of users

            User.find({status: req.param('id')}).exec(function(err, users) {
                if (err) {
                    return res.negotiate(err);
                }
                else {
                    users.forEach(function (user) {
                        user.status = req.param('status');
                        user.save();
                    });                    
                }
            });
        }
        else {
            User.findOne({id: req.param('id')}).exec(function(err, user) {
                if (err) {
                    return res.negotiate(err);
                }
                else {
                    req.session.me.status = req.param('status');
                    user.status = req.param('status');
                    user.save();
                }
            });
        }

        sails.io.sockets.emit("chat", {verb:"changedStatus", data:{id: req.param('id'), status: req.param('status')}})
    },

    quizzes: function (req, res) {

        var glob = require("glob");

        // Get the quiz JSON files from the data folder
        glob("assets/data/*.json", function (er, files) {

            if (er === null) {

                return res.ok(files);
            }
            else {
                return er;
            }
        });
    },

    start: function(req, res) {
        sails.io.sockets.emit("quiz", {verb:"startQuiz", data:{user: req.param('user'), sequence: req.param('sequence'), amount: req.param('amount'), quiz: req.param('quiz')}})
    },

    score: function(req, res) {

        User.findOne({id: req.param('id')}).exec(function(err, user) {
            if (err) {
                return res.negotiate(err);
            }
            else {
                /*user.score += 1;
                user.save();*/
                sails.io.sockets.emit("chat", {verb:"score", data:{id: req.param('id'), name: user.name}})
            }
        });
    }
};
