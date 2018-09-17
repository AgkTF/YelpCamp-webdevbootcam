var express = require('express');
// User express Router
var router  = express.Router();
var Campground = require('../models/campground');
var middleware = require('../middleware');
var multer = require('multer');
var cloudinary = require('cloudinary');

// Multer Config
var storage = multer.diskStorage({
    filename: function (req, file, cb) {
        cb(null, Date.now() + file.originalname);
    }
});

var imageFilter = function (req, file, cb) {
    // accept image files ONLY
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error("Only image files allowed!"), false);
    }
    cb(null, true);
};
var upload = multer({storage: storage, fileFilter: imageFilter});

// Cloudinary Config
cloudinary.config({
    cloud_name: 'cloud2018',
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

//INDEX - show all campgrounds
router.get("/", function (req, res) {
    if (req.query.search) {
        const REGEX = new RegExp(escapeRegex(req.query.search), "gi");
        // Get all campgrounds from DB
        Campground.find({name: REGEX}, function (err, allCampgrounds) {
            if (err) {
                console.log(err);
            } else {
                if (allCampgrounds.length < 1) {
                    req.flash("error", "No matches found!");
                    return res.redirect("back");
                }
                res.render("campgrounds/index", {
                    campgrounds: allCampgrounds, page: 'campgrounds'
                });
            }
        });
    } else {
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
    }
});

//CREATE - add new campground to DB
router.post("/", middleware.isLoggedIn, upload.single('image'), function (req, res) {
    cloudinary.uploader.upload(req.file.path, function(result){
        // get data from form
        var newCampground = req.body.campground;
        var campgroundAuthor = {
            id: req.user._id,
            username: req.user.username
        }
        newCampground.author = campgroundAuthor;
        // add cloudinary image url to the image property of the new campground
        newCampground.image = result.secure_url;
        // Create a new campground and save it to DB
        Campground.create(newCampground, function (err, newlyCreated) {
            if (err) {
                req.flash("error", err.message);
                return res.redirect("back");
            } else {
                // redirect back to the new campground
                res.redirect("/campgrounds/" + newlyCreated.id);
            }
        });
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
router.put("/:id", middleware.checkCampgroundOwnership, upload.single('image'), function (req, res) {
		cloudinary.uploader.upload(req.file.path, function (result) {
		// req.body.image = result.secure_url;
		req.body.campground.image = result.secure_url;
		Campground.findByIdAndUpdate(req.params.id, req.body.campground, function (err, updatedCampground) {
			if (err) {
				req.flash("error", err.message);
				return res.redirect("/campgrounds");
			} else {
				res.redirect("/campgrounds/" + req.params.id)
			}
		});
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

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;