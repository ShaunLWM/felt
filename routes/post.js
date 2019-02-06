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
    let tags = res.locals.tags;
    return res.render("home", {
        title: res.locals.title,
        posts,
        tags,
        avatar: Database.getConfig("avatar")
    });
});

module.exports = router;