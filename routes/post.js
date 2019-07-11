const Database = require("../modules/Database");
const Utils = require("../modules/Utils");
const express = require("express");
let router = express.Router();

router.get("/:slug", (req, res, next) => {
    let slug = req.params.slug;
    if (typeof slug === "undefined" || slug.trim().length < 1) {
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

router.post("/protected", (req, res, next) => {
    let { short, password } = req.body;
    if (typeof short === "undefined" || short.length < 1 || typeof password === "undefined" || password.length < 1) return res.status(400).json({success: false, message: "No input paramters"});

    let results = Database.findPost({ short: short.trim() });
    if (typeof results === "undefined" || results.length < 1) {
        return res.status(400).json({success: false, message: "Blog post not found."});
    }

    if (password !== results["pass"]) return res.status(400).json({success: false, message: "Wrong password"});
    return res.status(200).json({body: results["body"]});
});

module.exports = router;