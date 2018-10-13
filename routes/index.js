var express = require('express');
// User express Router
var router = express.Router();
var passport = require('passport');
var User = require('../models/user');
var Campground = require('../models/campground');
const Notification = require('../models/notification');
var async = require('async');
var nodemailer = require('nodemailer');
var crypto = require('crypto');
const { isLoggedIn } = require('../middleware');

// the Root Route
router.get('/', function(req, res) {
    res.render('landing');
});

// the REGISTER Route
// show the singup form
router.get('/register', function(req, res) {
    res.render('register', { page: 'register' });
});

// handle the signup logic
router.post('/register', function(req, res) {
    var newUser = new User({
        username: req.body.username,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        avatar: req.body.avatar
    });
    if (req.body.adminCode === 'secretcode123') {
        newUser.isAdmin = true;
    }
    User.register(newUser, req.body.password, function(err, user) {
        if (err) {
            req.flash('error', err.message);
            return res.redirect('/register');
        }
        passport.authenticate('local')(req, res, function() {
            req.flash('success', 'Welcome to YelpCamp ' + user.username);
            res.redirect('/campgrounds');
        });
    });
});

// the login Route
// show the login form
router.get('/login', function(req, res) {
    res.render('login', { page: 'login' });
});

// handle the login logic
router.post(
    '/login',
    passport.authenticate('local', {
        successRedirect: '/campgrounds',
        failureRedirect: '/login',
        failureFlash: true
    }),
    function(req, res) {}
);

// the logout logic
router.get('/logout', function(req, res) {
    req.logout();
    req.flash('success', 'Logged you out!');
    res.redirect('/campgrounds');
});

// Forgot Password Routes
router.get('/forgot', function(req, res) {
    res.render('forgot');
});

router.post('/forgot', function(req, res, next) {
    async.waterfall(
        [
            function(done) {
                crypto.randomBytes(20, function(err, buf) {
                    var token = buf.toString('hex');
                    done(err, token);
                });
            },
            function(token, done) {
                User.findOne({ email: req.body.email }, function(
                    err,
                    foundUser
                ) {
                    if (!foundUser) {
                        req.flash(
                            'error',
                            'No account with that email address exists'
                        );
                        return res.redirect('/forgot');
                    }

                    foundUser.resetPasswordToken = token;
                    foundUser.resetPasswordExpires = Date.now() + 3600000;

                    foundUser.save(function(err) {
                        done(err, token, foundUser);
                    });
                });
            },
            function(token, foundUser, done) {
                var smtpTransport = nodemailer.createTransport({
                    service: 'Gmail',
                    auth: {
                        user: 'agkdevacc@gmail.com',
                        pass: process.env.GMAILPW
                    }
                });
                var mailOptions = {
                    to: foundUser.email,
                    from: 'agkdevacc@gmail.com',
                    subject: 'YelpCamp Password Reset',
                    text:
                        'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
                        'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                        'http://' +
                        req.headers.host +
                        '/reset/' +
                        token +
                        '\n\n' +
                        'If you did not request this, please ignore this email and your password will remain unchanged.\n'
                };
                smtpTransport.sendMail(mailOptions, function(err) {
                    console.log('mail sent');
                    req.flash(
                        'success',
                        'An email has been sent to ' +
                            foundUser.email +
                            ' with further instructions.'
                    );
                    done(err, 'done');
                });
            }
        ],
        function(err) {
            if (err) {
                return next(err);
            }
            res.redirect('/forgot');
        }
    );
});

// The RESET Routes
router.get('/reset/:token', function(req, res) {
    User.findOne(
        {
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() }
        },
        function(err, foundUser) {
            if (!foundUser) {
                req.flash(
                    'error',
                    'Password reset token is inavlid or has expired!'
                );
                return res.redirect('/forgot');
            }
            res.render('reset', { token: req.params.token });
        }
    );
});

router.post('/reset/:token', function(req, res) {
    async.waterfall(
        [
            function(done) {
                User.findOne(
                    {
                        resetPasswordToken: req.params.token,
                        resetPasswordExpires: { $gt: Date.now() }
                    },
                    function(err, foundUser) {
                        if (!foundUser) {
                            req.flash(
                                'error',
                                'Password reset token is inavlid or has expired!'
                            );
                            return res.redirect('back');
                        }
                        if (req.body.newPassword === req.body.confirmPassword) {
                            foundUser.setPassword(
                                req.body.newPassword,
                                function(err) {
                                    foundUser.resetPasswordExpires = undefined;
                                    foundUser.resetPasswordToken = undefined;

                                    foundUser.save(function(err) {
                                        req.logIn(foundUser, function(err) {
                                            done(err, foundUser);
                                        });
                                    });
                                }
                            );
                        } else {
                            req.flash('error', 'Passwords do not match.');
                            return res.redirect('back');
                        }
                    }
                );
            },
            function(foundUser, done) {
                var smtpTransport = nodemailer.createTransport({
                    service: 'Gmail',
                    auth: {
                        user: 'agkdevacc@gmail.com',
                        pass: process.env.GMAILPW
                    }
                });
                var mailOptions = {
                    to: foundUser.email,
                    from: 'agkdevacc@gmail.com',
                    subject: 'Your YelpCamp Password has been changed!',
                    text:
                        'Hello,\n\n' +
                        'This is a confirmation that the password for your account ' +
                        foundUser.email +
                        ' has just been changed.\n'
                };
                smtpTransport.sendMail(mailOptions, function(err) {
                    req.flash(
                        'success',
                        'Success! Your Password has been changed.'
                    );
                    done(err);
                });
            }
        ],
        function(err) {
            res.redirect('/campgrounds');
        }
    );
});

// user profile
router.get('/users/:id', async function(req, res) {
    try {
        let foundUser = await User.findById(req.params.id)
            .populate('followers')
            .exec();

        let campgrounds = await Campground.find()
            .where('author.id')
            .equals(foundUser._id)
            .exec();

        res.render('users/show', {
            user: foundUser,
            campgrounds: campgrounds
        });
    } catch (err) {
        req.flash('error', 'Something went wrong!');
        return res.redirect('/');
    }
});

// following users (hitting the follow button)
router.get('/follow/:id', isLoggedIn, async function(req, res) {
    try {
        let user = await User.findById(req.params.id);
        user.followers.push(req.user._id);
        user.save();
        req.flash('success', `Successfully Followed ${user.username}!`);
        res.redirect(`/users/${req.params.id}`);
    } catch (err) {
        req.flash('error', 'Something went wrong!');
        return res.redirect('back');
    }
});

// View all notifications
router.get('/notifications', isLoggedIn, async function(req, res) {
    try {
        let user = await User.findById(req.user._id)
            .populate({
                path: 'notifications',
                options: { sort: { "_id": -1 } }
            }).exec();
        let allNotifications = user.notifications;
        res.render('notifications/index', { allNotifications });
    } catch (err) {
        req.flash('error', err.message);
        res.redirect('back');
    }
});

// Handle notifications
router.get('/notifications/:id', isLoggedIn, async function(req, res) {
    try {
        let notification = await Notification.findById(req.params.id);
        notification.isRead = true;
        notification.save();
        res.redirect(`/campgrounds/${notification.campgroundId}`);
    } catch (err) {
        req.flash('error', err.message);
        res.redirect('back');
    }
});

module.exports = router;
