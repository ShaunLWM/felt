const express = require("express");
const randtoken = require("rand-token");
const multer = require("multer");
const path = require("path");
const AdmZip = require("adm-zip");
const Utils = require("../modules/Utils");
const fs = require("fs-extra");
const config = require("../config");
const fg = require("fast-glob");
const pkg = require("../package.json");

let acceptedImageExtension = ["gif", "jpeg", "jpg", "png", "svg", "blob"];
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

    console.log(`[@] importing ${req.file["path"]}`);
    let zip = new AdmZip(req.file["path"]);
    zip.getEntries().forEach(zipEntry => {
        let filename = zipEntry.entryName;
        if (filename === "db.json") {
            return zip.extractEntryTo(filename, "./", false, true);
        }

        for (ext of acceptedImageExtension) {
            let dext = `.${ext}`;
            if (filename.endsWith(dext)) {
                return zip.extractEntryTo(filename, path.join(__dirname, "..", "public", "img"), false, true);
            }
        }
    });

    fs.removeSync(req.file["path"]);
    return res.status(200).json({ success: true });
});

router.post("/export", (req, res) => {
    if (typeof req.query["u"] !== "undefined" && req.query["u"] == config.admin.username && typeof req.query["p"] !== "undefined" && req.query["p"] == config.admin.password) {
        return handleExport(res);
    }

    return next();
});

function handleExport(res) {
    let zip = new AdmZip();
    fg([`${__dirname}/../public/img/p_*.{${acceptedImageExtension.join(",")}}`]).then(entries => {
        zip.addLocalFile(path.join(__dirname, "..", "db.json"));
        if (entries.length > 0) {
            entries.forEach(file => {
                zip.addLocalFile(file);
            });
        }

        Utils.getTemporaryDirectory();
        let zipName = path.join(__dirname, "..", "temp", `export_v${pkg.version}_${Math.floor(Date.now() / 1000)}.zip`);
        zip.writeZip(zipName);
        console.log(`[@] exporting ${zipName}`);
        return res.download(zipName);
    });
}

module.exports = router;