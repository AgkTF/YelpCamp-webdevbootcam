var mongoose = require('mongoose');
var Campground = require('./models/campground');
var Comment = require('./models/comment');

var data = [
    {
        name: "Cloud's Rest",
        image: "https://images.unsplash.com/photo-1527786356703-4b100091cd2c?ixlib=rb-0.3.5&ixid=eyJhcHBfaWQiOjEyMDd9&s=601fcba3c5d7ddec0c8f2690e8638461&auto=format&fit=crop&w=400&q=60",
        description: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum."
    },
    {
        name: "Desert Mesa",
        image: "https://images.unsplash.com/photo-1525811902-f2342640856e?ixlib=rb-0.3.5&ixid=eyJhcHBfaWQiOjEyMDd9&s=1a7383ad093ffea99d373681b9974056&auto=format&fit=crop&w=1351&q=80",
        description: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum."
    },
    {
        name: "Canyon Floor",
        image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-0.3.5&ixid=eyJhcHBfaWQiOjEyMDd9&s=d9df10d159cc11074d9a7996e8aca442&auto=format&fit=crop&w=1350&q=80",
        description: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum."
    }
];


function seedDB() {
    // Remove all campgrounds from the DB
    Campground.remove({}, function (err) {
        if (err) {
            console.log(err);
        }
        console.log("Campgrounds Removed!");
        
        // Create a few campgrounds
        data.forEach(function (seed) {
            Campground.create(seed, function (err, addedground) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Campground added!");
                    // Create a few comments
                    Comment.create(
                        {
                            text: "This place is awesome. I wish we had better bathrooms.",
                            author: "Homer"
                        }, function (err, comment) {
                            if (err) {
                                console.log(err);
                            } else {
                                addedground.comments.push(comment);
                                addedground.save(function (err) {
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        console.log("New Comment Added!");
                                    }
                                });
                            }
                        }
                    );
                }
            });
        });
    });
};

module.exports = seedDB;