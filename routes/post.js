const express = require('express');
let router = express.Router();

// router.get('/:id(\\d+)', function (req, res) {
//     res.send('Birds home page');
// });

router.get('/:postId', (req, res, next) => {
    let postId = req.params.postId;
    if (typeof postId === 'undefined' || postId.length < 1) {
        console.log('>> ' + postId);
        console.log('>> ' + postId.length);
        return next();
    }

    if (/^\d+$/.test(postId)) {
        return res.send('Numbr');
    }

    return res.send('Slug');
});

module.exports = router;