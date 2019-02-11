const Database = require("../modules/Database");
const Utils = require("../modules/Utils");
const express = require("express");
const moment = require("moment");
let router = express.Router();

router.get("^/:mmyy([0-9]{4})/:pageNumber([0-9]*)?", (req, res, next) => {
    let pageNumber = req.params["pageNumber"] || 1;
    let page = parseInt(pageNumber);
    let mmyy = req.params["mmyy"];
    let posts = Utils.getPaginatedItems(Database.getPosts().filter(p => {
        let postDate = moment(p["date"]).format("MMYY");
        return postDate === mmyy;
    }).map(p => Utils.processPostView(p)), page);

    let tags = req.app.locals.tags;
    return res.render("home", {
        posts,
        tags,
        title: res.locals.title,
        avatar: Database.getConfig("avatar"),
        aboutMe: Database.getConfig("aboutMe"),
        archives: req.app.locals.postsArchives
    });
});

module.exports = router;