var express = require('express');
// User express Router
var router = express.Router();
var passport = require('passport');
var User = require('../models/user');

// the Root Route
router.get("/", function (req, res) {
    res.render("landing");
});

// the REGISTER Route
// show the singup form
router.get("/register", function (req, res) {
    res.render("register", {page: 'register'});
});

// handle the signup logic
router.post("/register", function (req, res) {
    var newUser = new User({
        username: req.body.username
    });
    if (req.body.adminCode === 'secretcode123') {
        newUser.isAdmin = true;
    }
    User.register(newUser, req.body.password, function (err, user) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("/register");
        }
        passport.authenticate("local")(req, res, function () {
            req.flash("success", "Welcome to YelpCamp " + user.username);
            res.redirect("/campgrounds");
        });
    });
});

// the login Route
// show the login form
router.get("/login", function (req, res) {
    res.render("login", {page: 'login'});
});

// handle the login logic
router.post("/login", passport.authenticate("local", {
    successRedirect: "/campgrounds",
    failureRedirect: "/login"
}), function (req, res) {});


// the logout logic
router.get("/logout", function (req, res) {
    req.logout();
    req.flash("success", "Logged you out!");
    res.redirect("/campgrounds");
});

module.exports = router;