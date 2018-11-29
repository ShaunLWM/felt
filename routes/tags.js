const Database = require('../modules/Database');
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
    
    let posts = results.map(p => {
        return {
            ...p,
            date: moment(p.date).format('MMMM Do YYYY, h:mm:ss a'),
            tags: p.tags.length < 1 ? 'none' : (p.tags.reduce((accu, curr, index, arr) => {
                accu += `<a href="/t/${curr}">${curr}</a>`;
                if (index < (arr.length - 1)) {
                    accu += ', '
                }

                return accu;
            }, ''))
        }
    });

    return res.render('home', {
        posts
    });
});

module.exports = router;