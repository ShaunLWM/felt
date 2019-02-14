const moment = require("moment");
const slugify = require("@sindresorhus/slugify");
const escape = require("escape-html");
const Database = require("./Database");
const _ = require("lodash");
const timeago = require("timeago.js");
const config = require("../config");
const Cryptr = require("cryptr");
const cryptr = new Cryptr(config.passwordProtected.salt);

module.exports = {
    processNewPost: function (opts) {
        let tags = opts["tags"] || "";
        if (tags.length > 0 && tags.includes(",")) { // multiple tags with ","
            tags = tags.split(",").filter(w => {
                return w.length > 0;
            });
        } else if (tags.trim().length > 0) { // only 1 word/tag
            tags = [tags.trim()];
        } else { // no tags at all
            tags = [];
        }

        let date = Math.round((new Date()).getTime());
        let title = opts["title"].trim();
        let slug = `${slugify(title.toLowerCase())}-${this.randomId(5).toLowerCase()}`;
        let body = opts["body"].trim().replace(/class="fr-fic fr-dib"/g, `class="fr-fic fr-dib materialboxed"`);
        let post = {
            slug,
            title,
            date,
            body,
            tags
        };

        Database.addPost(post);
        return post;
    },
    processPostView: function (p) {
        return {
            ...p,
            unix: timeago().format(p.date),
            month: moment(p.date).format("MMMM YYYY"), // just for /m route
            date: moment(p.date).format("MMMM Do YYYY, h:mm a"),
            tags: p.tags.length < 1 ? "none" : (p.tags.reduce((accu, curr, i, arr) => {
                accu += `<a href="/t/${curr}">${escape(curr)}</a>`;
                if (i < (arr.length - 1)) {
                    accu += ", "
                }

                return accu;
            }, ""))
        }
    },
    getPaginatedItems: function (items, page, pageSize) {
        let pg = page || 1,
            pgSize = pageSize || 5,
            offset = (pg - 1) * pgSize,
            pagedItems = _.drop(items, offset).slice(0, pgSize);
        return pagedItems;
        // return {
        //     page: pg,
        //     pageSize: pgSize,
        //     total: items.length,
        //     total_pages: Math.ceil(items.length / pgSize),
        //     data: pagedItems
        // };
    },
    validatePasswordCookies: function (cookie) {
        // cookie will be in "unix|password" format.
        if (typeof cookie === "undefined") {
            return false;
        }

        let maxDays = config.passwordProtected.maxDays;
        try {
            let decryptedCookie = cryptr.decrypt(cookie);
            let match = /([0-9]{10})\|(.*?)$/g.exec(decryptedCookie);
            if (match === null || match.length < 1) { // wrong cookie
                return false;
            }

            let cookieTime = match[1];
            let cookiePassword = match[2];
            if (cookiePassword !== config.passwordProtected.password) { // password is changed by admin
                return false;
            }

            let currentTime = Math.round((new Date()).getTime() / 1000);
            let cookieFutureTime = parseInt(cookieTime) + (60 * 60 * 24 * maxDays);
            if (currentTime >= cookieFutureTime) { // user cookie expired
                return false;
            }

            return true;
        } catch (error) {
            console.error(`[!] validatePasswordCookies: ${error}`);
            return false;
        }
    },
    randomId: function (length = 5) {
        let text = "";
        let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (var i = 0; i < length; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        return text;
    }
}