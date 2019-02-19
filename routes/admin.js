const express = require("express");
const Database = require("../modules/Database");
const randtoken = require("rand-token");
const multer = require("multer");
const config = require("../config");
const Utils = require("../modules/Utils");
const path = require("path");

let acceptedExtension = ["gif", "jpeg", "jpg", "png", "svg", "blob"];
let accepted = ["image/gif", "image/jpeg", "image/pjpeg", "image/x-png", "image/png", "image/svg+xml"];

let storage = multer.diskStorage({
    destination: (req, file, cb) => {
        return cb(null, `${__dirname}/../public/img/`);
    },
    filename: (req, file, cb) => {
        let f = file.originalname.split(".").pop();
        return cb(null, `${randtoken.generate(16)}${Date.now()}.${f.toLowerCase()}`);
    }
});

let fileFilter = function (req, file, cb) {
    let f = file.originalname.split(".");
    if (f.length < 1) { // no extension
        return cb(null, false);
    }

    let ext = (f[f.length - 1]).toLowerCase();
    return cb(null, accepted.includes(file.mimetype) && acceptedExtension.includes(ext));
}

const upload = multer({ storage, fileFilter });
let router = express.Router();

router.get("/", (req, res, next) => {
    if (typeof req.query["u"] !== "undefined" && req.query["u"] == config.admin.username && typeof req.query["p"] !== "undefined" && req.query["p"] == config.admin.password) {
        if (typeof req.query["action"] !== "undefined" && req.query["action"] === "export") {
            return res.download(path.join(__dirname, "..", "db.json"));
        }

        let posts = Database.getPosts();
        // since we have drafts, schedules etc, we shall just filter post so we dont have to call getpost multiple times
        return res.render("admin", {
            title: res.locals.defaultTitle,
            posts: posts.filter(p => p["status"] === 1),
            drafts: posts.filter(p => p["status"] === 3),
            scheduled: posts.filter(p => p["status"] === 4),
            avatar: Database.getConfig("avatar"),
            aboutMe: Database.getConfig("aboutMe")
        });
    }

    return next();
});

router.post("/upload", upload.single("image"), (req, res) => {
    if (typeof req.file === "undefined" || req.file === null) {
        return res.status(404).json({ message: "Image failed to upload" });
    }

    return res.status(200).json({ link: `${config.host}:${config.port}/img/${req.file.filename}` });
});

router.post("/update/avatar", upload.single("file-avatar"), (req, res) => {
    if (typeof req.file === "undefined" || req.file === null) {
        return res.status(404).json({ message: "Image failed to upload" });
    }

    Database.editConfig("avatar", req.file.filename);
    return res.status(200).json({ link: `${config.host}:${config.port}/img/${req.file.filename}` });
});

router.post("/post/new", (req, res) => {
    Utils.processNewPost(req.body);
    return res.status(200).json({ message: "success" });
});

router.post("/update/aboutme", (req, res) => {
    let aboutMe = req.body["aboutMe"].trim();
    Database.editConfig("aboutMe", aboutMe);
    return res.status(200).json({ success: true });
});

router.post("/post/edit", (req, res) => {
    Database.editPost(req.body);
    return res.status(200).json({ success: true });
});

router.post("/action", (req, res) => {
    if (typeof req.body["action"] === "undefined" || typeof req.body["slug"] === "undefined") {
        return res.status(400).json({ message: "No action defined" });
    }

    let action = req.body["action"];
    let slug = req.body["slug"];
    switch (action) {
        case "edit":
            let post = Database.getPost({ slug });
            return res.status(200).json(post);
        case "delete":
            Database.deletePost(slug);
            return res.status(200).json({ message: "success" });
        case "archive":
            Database.editPostStatus({ slug, status: 2 });
            return res.status(200).json({ message: "success" });
    }
});

module.exports = router;