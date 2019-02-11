const Database = require("../modules/Database");
const Utils = require("../modules/Utils");
const express = require("express");
let router = express.Router();

router.get("/:tag/:pageNumber([0-9]*)?", (req, res, next) => {
    let pageNumber = req.params["pageNumber"] || 1;
    let page = parseInt(pageNumber);
    let tag = req.params.tag;
    if (typeof tag === "undefined" || tag.length < 1) {
        return next();
    }

    let results = Utils.getPaginatedItems(Database.findPost({ tag: tag.trim() }), page);
    if (typeof results === "undefined" || results.length < 1) {
        return next();
    }

    let posts = results.map(p => Utils.processPostView(p)).sort((a, b) => (a.date > b.date) ? -1 : ((b.date > a.date) ? 1 : 0));
    let tags = req.app.locals.tags;
    return res.render("home", {
        title: res.locals.title,
        posts,
        tags,
        avatar: Database.getConfig("avatar"),
        aboutMe: Database.getConfig("aboutMe"),
        archives: req.app.locals.postsArchives
    });
});

module.exports = router;