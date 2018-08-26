var express         = require("express"),
    app             = express(),
    bodyParser      = require("body-parser"),
    methodOverride  = require('method-override'),
    mongoose        = require("mongoose"),
    flash           = require('connect-flash'),
    passport        = require('passport'),
    LocalStrategy   = require('passport-local'),
    Campground      = require('./models/campground'),
    Comment         = require('./models/comment'),
    User            = require('./models/user'),
    seedDB          = require('./seeds');

// requiring routes
var campgroundRoutes    = require('./routes/campgrounds'),
    commentRoutes      = require('./routes/comments'),
    indexRoutes         = require('./routes/index');
mongoose.connect(process.env.DATABASEURL, {useNewUrlParser: true});
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(methodOverride("_method"));
app.use(express.static(__dirname + "/public"));
// seedDB(); // Seed the DB
app.use(require('express-session')({
    secret: "This could be anything",
    resave: false,
    saveUninitialized: false
}));
app.use(flash());

// PASSPORT CONFIG
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// A middleware to pass the current user information to all the templates
// saved in res.locals ==> will create local variables that are available only 
// to the views rendered during that request
app.use(function (req, res, next) {
    res.locals.currentUser  = req.user;
    res.locals.error        = req.flash("error");
    res.locals.success      = req.flash("success");
    next();
});

app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/comments", commentRoutes);
app.use(indexRoutes);

app.listen(process.env.PORT || 3000, function () {
    console.log("The YelpCamp server has started!");
});