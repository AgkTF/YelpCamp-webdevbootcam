var express = require('express');
// User express Router
var router = express.Router({mergeParams: true});

var Campground = require('../models/campground');
var Comment = require('../models/comment');
var middleware = require('../middleware');

// Nested Route (add a new comment using the form)
router.get("/new", middleware.isLoggedIn, function (req, res) {
    Campground.findById(req.params.id, function (err, foundGround) {
        if (err) {
            console.log(err);
        } else {
            res.render("comments/new", {campground: foundGround});
        }
    });
});

// Nested Route (creating this comment and adding it to DB)
router.post("/", middleware.isLoggedIn, function (req, res) {
    // Lookup campground using ID
    Campground.findById(req.params.id, function (err, foundCampground) {
        if (err) {
            console.log(err);
            res.redirect("/campgrounds");
        } else {
            // Create a new comment
            Comment.create(req.body.comment, function (err, createdComment) {
                if (err) {
                    req.flash("error", "Something went wrong");
                    console.log(err);
                } else {
                    // add a username and id to to the comment
                    createdComment.author.id = req.user._id;
                    createdComment.author.username = req.user.username;
                    // save the comment
                    createdComment.save();
                    // Assocciate that comment with that campground
                    foundCampground.comments.push(createdComment);
                    foundCampground.save();
                    req.flash("success", "Successfully created comment");
                    // Redirect back to the show page of that campground
                    res.redirect("/campgrounds/" + foundCampground._id);
                }
            });
        }
    });
});

// Nested Route (edit a comment using the form)
router.get("/:comment_id/edit", middleware.checkCommentOwnership, function (req, res) {
    // Lookup comment using comment_id
    Comment.findById(req.params.comment_id, function (err, foundComment) {
        if (err) {
            console.log(err);
            res.redirect("back");
        } else {
            res.render("comments/edit", {
                campground_id:req.params.id,
                comment: foundComment
            });
        }
    });
});


// Nested Route (update a comment)
router.put("/:comment_id", middleware.checkCommentOwnership, function (req, res) {
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function (err, updatedComment) {
        if (err) {
            res.redirect("back");
        } else {
            res.redirect("/campgrounds/" + req.params.id);
        }
    });
});

// Nested Route (Destroy a comment)
router.delete("/:comment_id", middleware.checkCommentOwnership, function (req, res) {
    Comment.findByIdAndRemove(req.params.comment_id, function (err) {
        if (err) {
            res.redirect("back");
        } else {
            req.flash("success", "Successfully deleted comment");
            res.redirect("/campgrounds/" + req.params.id);
        }
    });
});

module.exports = router;