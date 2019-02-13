const Database = require("../modules/Database");
const Utils = require("../modules/Utils");
const express = require("express");
let router = express.Router();

router.get("/:slug", (req, res, next) => {
    let slug = req.params.slug;
    if (typeof slug === "undefined" || slug.length < 1) {
        return next();
    }

    let results = Database.findPost({ slug: slug.trim() });
    if (typeof results === "undefined" || results.length < 1) {
        return next();
    }

    let posts = [Utils.processPostView(results)];
    let tags = req.app.locals.tags;
    return res.render("home", {
        posts,
        tags,
        title: posts[0]["title"],
        defaultTitle: res.locals.defaultTitle,
        avatar: Database.getConfig("avatar"),
        aboutMe: Database.getConfig("aboutMe"),
        archives: req.app.locals.postsArchives
    });
});

module.exports = router;