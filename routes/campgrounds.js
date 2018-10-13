var express = require('express');
// User express Router
var router = express.Router();
var Campground = require('../models/campground');
const Notification = require('../models/notification');
const User = require('../models/user');
var middleware = require('../middleware');

//INDEX - show all campgrounds
router.get('/', function(req, res) {
    if (req.query.search) {
        const REGEX = new RegExp(escapeRegex(req.query.search), 'gi');
        // Get all campgrounds from DB
        Campground.find({ name: REGEX }, function(err, allCampgrounds) {
            if (err) {
                console.log(err);
            } else {
                if (allCampgrounds.length < 1) {
                    req.flash('error', 'No matches found!');
                    return res.redirect('back');
                }
                res.render('campgrounds/index', {
                    campgrounds: allCampgrounds,
                    page: 'campgrounds'
                });
            }
        });
    } else {
        // Get all campgrounds from DB
        Campground.find({}, function(err, allCampgrounds) {
            if (err) {
                console.log(err);
            } else {
                res.render('campgrounds/index', {
                    campgrounds: allCampgrounds
                });
            }
        });
    }
});

//CREATE - add new campground to DB
router.post('/', middleware.isLoggedIn, async function(req, res) {
    // get data from form and add to campgrounds array
    var campgroundName = req.body.campgroundName;
    var campgroundImage = req.body.campgroundImage;
    var campgroundDesc = req.body.description;
    var campgroundAuthor = {
        id: req.user._id,
        username: req.user.username
    };
    var campgroundPrice = req.body.price;
    var campgroundLocation = req.body.campgroundLocation;
    var newCampground = {
        name: campgroundName,
        price: campgroundPrice,
        image: campgroundImage,
        location: campgroundLocation,
        description: campgroundDesc,
        author: campgroundAuthor
    };
    // console.log(req.user);
    try {
        // Create a new campground and save it to DB
        let campground = await Campground.create(newCampground);
        // Find the logged-in user
        let user = await User.findById(req.user._id)
            .populate('followers')
            .exec();
        // Create a new notification
        let newNotification = {
            username: req.user.username,
            campgroundId: campground.id
        };
        // Iterate over the followers array and
        // add the new notification to their notification array
        for (const follower of user.followers) {
            let notification = await Notification.create(newNotification);
            follower.notifications.push(notification);
            follower.save();
        }

        // Redirect back to campgrounds page
        res.redirect(`/campgrounds/${campground.id}`);
    } catch (err) {
        req.flash('error', err.message);
        res.redirect('campgrounds');
    }
});

//NEW - show form to create new campground
router.get('/new', middleware.isLoggedIn, function(req, res) {
    res.render('campgrounds/new');
});

// SHOW - shows more info about one campground
router.get('/:id', function(req, res) {
    // find the campground with provided ID
    Campground.findById(req.params.id)
        .populate('comments')
        .exec(function(err, foundCampground) {
            if (err || !foundCampground) {
                req.flash('error', 'Campground not found');
                res.redirect('/campgrounds');
            } else {
                // render show template with that campground
                res.render('campgrounds/show', {
                    campground: foundCampground
                });
            }
        });
});

// EDIT - shows edit form for on campground
router.get('/:id/edit', middleware.checkCampgroundOwnership, function(
    req,
    res
) {
    // find the campground with provided ID
    Campground.findById(req.params.id, function(err, foundCampground) {
        res.render('campgrounds/edit', { campground: foundCampground });
    });
});

// UPDATE -  update particular campground and redirect somewhere
router.put('/:id', middleware.checkCampgroundOwnership, function(req, res) {
    Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(
        err,
        updatedCampground
    ) {
        if (err) {
            res.redirect('/campgrounds');
        } else {
            res.redirect('/campgrounds/' + req.params.id);
        }
    });
});

// DESTROY
router.delete('/:id', middleware.checkCampgroundOwnership, function(req, res) {
    Campground.findByIdAndRemove(req.params.id, function(err) {
        if (err) {
            res.redirect('/campgrounds');
        } else {
            res.redirect('/campgrounds');
        }
    });
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

module.exports = router;
