const express = require("express");
const randtoken = require("rand-token");
const multer = require("multer");
const path = require("path");
const AdmZip = require("adm-zip");
const Utils = require("../modules/Utils");
const fs = require("fs-extra");

let acceptedExtension = ["zip"];
let accepted = ["application/x-zip-compressed"];

let storage = multer.diskStorage({
    destination: (req, file, cb) => {
        return cb(null, Utils.getTemporaryDirectory());
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

router.post("/import", upload.single("database-import-zip"), (req, res) => {
    if (typeof req.file === "undefined" || req.file === null) {
        return res.status(404).json({ message: "zip file failed to upload" });
    }

    let zip = new AdmZip(req.file["path"]);
    zip.getEntries().forEach(zipEntry => {
        let filename = zipEntry.entryName;
        if (filename === "db.json") {
            return zip.extractEntryTo(filename, "./", false, true);
        }

        for (ext of ["gif", "jpeg", "jpg", "png", "svg", "blob"]) {
            let dext = `.${ext}`;
            if (filename.endsWith(dext)) {
                return zip.extractEntryTo(filename, path.join(__dirname, "..", "public", "img"), false, true);
            }
        }
    });

    fs.removeSync(req.file["path"]);
    return res.status(200).json({ success: true });
});

module.exports = router;