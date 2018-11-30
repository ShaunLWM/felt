const Database = require('../modules/Database');
const Utils = require('../modules/Utils');
const express = require('express');
let router = express.Router();

router.get('/:tag', (req, res, next) => {
    let tag = req.params.tag;
    if (typeof tag === 'undefined' || tag.length < 1) {
        return next();
    }

    let results = Database.findPost({ tag: tag.trim() });
    if (typeof results === 'undefined' || results.length < 1) {
        return next();
    }

    let posts = results.map(p => Utils.processPost(p)).sort((a, b) => (a.date > b.date) ? -1 : ((b.date > a.date) ? 1 : 0));
    return res.render('home', {
        posts
    });
});

module.exports = router;