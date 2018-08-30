var express = require('express');
// User express Router
var router  = express.Router();
var Campground = require('../models/campground');
var middleware = require('../middleware');

//INDEX - show all campgrounds
router.get("/", function (req, res) {
    // Get all campgrounds from DB
    Campground.find({}, function (err, allCampgrounds) {
        if (err) {
            console.log(err);
        } else {
            res.render("campgrounds/index", {
                campgrounds: allCampgrounds, page: 'campgrounds'
            });
        }
    });
});

//CREATE - add new campground to DB
router.post("/", middleware.isLoggedIn, function (req, res) {
    // get data from form and add to campgrounds array
    var campgroundName      = req.body.campgroundName;
    var campgroundImage     = req.body.campgroundImage;
    var campgroundDesc      = req.body.description;
    var campgroundAuthor    = {
        id: req.user._id,
        username: req.user.username
    };
    var campgroundPrice     = req.body.price;
    var newCampground = {
        name: campgroundName,
        price: campgroundPrice,
        image: campgroundImage,
        description: campgroundDesc,
        author: campgroundAuthor
    };
    console.log(req.user);
    // Create a new campground and save it to DB
    Campground.create(newCampground, function (err, newlyCreated) {
        if (err) {
            console.log(err);
        } else {
            // redirect back to campgrounds
            console.log(newlyCreated);
            res.redirect("campgrounds");
        }
    });
});

//NEW - show form to create new campground
router.get("/new", middleware.isLoggedIn, function (req, res) {
    res.render("campgrounds/new");
});

// SHOW - shows more info about one campground
router.get("/:id", function (req, res) {
    // find the campground with provided ID
    Campground.findById(req.params.id).populate("comments").exec(
        function (err, foundCampground) {
            if (err) {
                console.log(err);
            } else {
                // render show template with that campground
                res.render("campgrounds/show", {
                    campground: foundCampground
                });
            }
        }
    );
});

// EDIT - shows edit form for on campground
router.get("/:id/edit", middleware.checkCampgroundOwnership, function (req, res) {
    // find the campground with provided ID
    Campground.findById(req.params.id, function (err, foundCampground) {
        res.render("campgrounds/edit", {campground: foundCampground});
    });
});


// UPDATE -  update particular campground and redirect somewhere
router.put("/:id", middleware.checkCampgroundOwnership, function (req, res) {
    Campground.findByIdAndUpdate(req.params.id, req.body.campground, function (err, updatedCampground) {
       if (err) {
            res.redirect("/campgrounds");
       } else {
            res.redirect("/campgrounds/" + req.params.id)
       }
    });
});


// DESTROY
router.delete("/:id", middleware.checkCampgroundOwnership, function(req, res) {
    Campground.findByIdAndRemove(req.params.id, function (err) {
        if (err) {
            res.redirect("/campgrounds");
        } else {
            res.redirect("/campgrounds");
        }
    });
});

module.exports = router;