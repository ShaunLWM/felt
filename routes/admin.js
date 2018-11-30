const express = require('express');
const slugify = require('@sindresorhus/slugify');
const Database = require('../modules/Database');
const randtoken = require('rand-token');
const multer = require('multer');
const config = require('../config');

let acceptedExtension = ['gif', 'jpeg', 'jpg', 'png', 'svg', 'blob'];
let accepted = ['image/gif', 'image/jpeg', 'image/pjpeg', 'image/x-png', 'image/png', 'image/svg+xml'];

let storage = multer.diskStorage({
    destination: function (req, file, cb) {
        return cb(null, `${__dirname}/../public/img/`);
    },
    filename: function (req, file, cb) {
        let f = file.originalname.split('.').pop();
        return cb(null, `${randtoken.generate(16)}${Date.now()}.${f.toLowerCase()}`);
    }
});

let fileFilter = function fileFilter(req, file, cb) {
    let f = file.originalname.split('.');
    if (f.length < 1) { // no extension
        return cb(null, false);
    }

    let ext = (f[f.length - 1]).toLowerCase();
    return cb(null, accepted.includes(file.mimetype) && acceptedExtension.includes(ext));
}

const upload = multer({ storage, fileFilter });
let router = express.Router();

router.get('/', function (req, res, next) {
    if (typeof req.query.u !== 'undefined' && req.query.u == config.admin.username && typeof req.query.p !== 'undefined' && req.query.p == config.admin.password) {
        return res.render('admin');
    }

    return next();
});

router.post('/upload', upload.single('image'), (req, res) => {
    if (typeof req.file === 'undefined' || req.file === null) {
        return res.status(404).json({ message: 'Image failed to upload' });
    }

    return res.status(200).json({ link: `${config.host}:${config.port}/img/${req.file.filename}` });
});

router.post('/new', (req, res) => {
    let tags = req.body.tags || '';
    if (tags.length > 0 && tags.includes(',')) {
        tags = tags.split(',').filter(w => {
            return w.length > 0;
        });
    } else {
        if (tags.trim().length > 0) {
            tags = [tags.trim()];
        }
    }

    let date = Math.round((new Date()).getTime());
    let title = req.body.title.trim();
    let slug = slugify(title).trim();
    let body = req.body.body.trim();
    let post = {
        slug,
        title,
        date,
        body,
        tags
    };

    Database.addPost(post);
    return res.status(200).send(post);
});

module.exports = router;