const Database = require('../modules/Database');
const Utils = require('../modules/Utils');
const moment = require('moment');
const express = require('express');
let router = express.Router();

router.get('/:tag', (req, res, next) => {
    let tag = req.params.tag;
    if (typeof tag === 'undefined' || tag.length < 1) {
        return next();
    }

    let results = Database.findPost({ tag: tag.trim() });
    if (typeof results === 'undefined') {
        return res.render('home');
    }

    let posts = Utils.processPosts(results);
    return res.render('home', {
        posts
    });
});

module.exports = router;