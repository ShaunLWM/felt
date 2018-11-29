const Database = require('../modules/Database');
const Utils = require('../modules/Utils');
const _ = require('lodash');
const moment = require('moment');
const express = require('express');
let router = express.Router();

router.get('/:slug', (req, res, next) => {
    let slug = req.params.slug;
    if (typeof slug === 'undefined' || slug.length < 1) {
        return next();
    }

    let results = Database.findPost({ slug: slug.trim() });
    if (typeof results === 'undefined') {
        return res.render('home');
    }

    let posts = Utils.processPosts(results);
    return res.render('home', {
        posts
    });
});

module.exports = router;