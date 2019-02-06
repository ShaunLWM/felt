const moment = require("moment");
const slugify = require("@sindresorhus/slugify");
const escape = require("escape-html");
const Database = require("./Database");
const _ = require("lodash");

module.exports = {
    processNewPost: function (opts) {
        let tags = opts["tags"] || "";
        if (tags.length > 0 && tags.includes(",")) {
            tags = tags.split(",").filter(w => {
                return w.length > 0;
            });
        } else {
            if (tags.trim().length > 0) {
                tags = [tags.trim()];
            }
        }

        let date = Math.round((new Date()).getTime());
        let title = opts["title"].trim();
        let slug = slugify(title).trim();
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
    }
}