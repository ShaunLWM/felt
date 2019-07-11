const low = require("lowdb")
const FileSync = require("lowdb/adapters/FileSync")
const adapter = new FileSync("db.json");
const lodashId = require("lodash-id");
const moment = require("moment");
const randtoken = require("rand-token");

class Database {
    constructor() {
        this.db = low(adapter);
        this.db._.mixin(lodashId);
        this.db.defaults({ config: {}, posts: [], tags: [], analytics: [] }).write();
    }

    addPost({ slug, title, date, body, tags, status = 1, ttr, password }) {
        let short = randtoken.generate(5);
        try {
            let post = this.db.get("posts").find({ short }).value();
            while (typeof post !== "undefined") {
                short = randtoken.generate(5);
                post = this.db.get("posts").find({ short }).value();
            }

            console.debug(`[@] short generated: ${short}`);
            this.db.get("posts").push({
                slug, title, date, body, tags, short, ttr, pass: password,
                status // 1 = posted, 2 = archived, 3 = drafts, 4 = scheduled
            }).write();

            this.processTags(tags);
            this.processAnalytics(slug);
        } catch (error) {
            console.error(`[!] addPost error: ${error}`);
        }
    }

    getAllTags() {
        return this.db.get("tags").orderBy("updated", ["desc"]).value();
    }

    getPosts() {
        return this.db.get("posts").orderBy("date", ["desc"]).value();
    }

    getPost({ slug, short = null }) {
        if (short !== null) {
            return this.db.get("posts").find({ short }).value();
        }

        return this.db.get("posts").find({ slug }).value();
    }

    deletePost(slug) {
        return this.db.get("posts").remove({ slug }).write();
    }

    editPostStatus({ slug, short = null, status }) {
        if (short !== null) {
            return this.db.get("posts").find({ short }).assign({ status }).write();
        }

        return this.db.get("posts").find({ slug }).assign({ status }).write();
    }

    editPost({ short, body, title, slug, date }) {
        return this.db.get("posts").find({ short }).assign({ body, title, slug, date }).write();
    }

    processAnalytics(slug) {
        let analytics = this.db.get("analytics").find({ slug }).value();
        if (typeof analytics === "undefined") {
            return this.db.get("analytics").push({
                slug,
                views: 0,
                stats: []
            }).write();
        }

        return this.db.get("analytics").find({ slug }).assign({ views: analytics.views + 1 }).write();
    }

    processTags(tags) {
        if (typeof tags === "undefined" || !Array.isArray(tags) || tags.length < 1) {
            return console.log("[!] no tags to process..");
        }

        let old = this.db.get("tags").value();
        tags.forEach(tag => {
            let i = this.db._.find(old, function (o) { return o["value"] === tag; });
            if (typeof i === "undefined") {
                return this.db.get("tags").push({
                    value: tag.trim(),                    // value
                    count: 1,                           // count
                    updated: ((new Date()).getTime())     // last updated
                }).write();
            }

            return this.db.get("tags").find({ value: tag }).assign({ count: i["count"] + 1, updated: ((new Date()).getTime()) }).write();
        });
    }

    findPost({ tag = null, slug = null }) {
        let posts = this.db.get("posts").value();
        if (tag !== null) {
            return posts.filter(p => {
                return p.tags.includes(tag);
            });
        }

        if (slug !== null) {
            this.processAnalytics(slug);
            return this.db.get("posts").find({ slug }).value();
        }
    }

    getDrafts() {
        return this.db.get("posts").orderBy("date", ["desc"]).filter({ status: 3 }).value();
    }

    getScheduled() {
        return this.db.get("posts").orderBy("date", ["desc"]).filter({ status: 4 }).value();
    }

    editConfig(key, value) {
        return this.db.set(`config.${key}`, value).write()
    }

    getConfig(key = null) {
        let config = this.db.get("config").value();
        if (key === null) {
            return config;
        }

        return config[key];
    }

    parseHomepageArchives() {
        let months = [];
        this.db.get("posts").value().map(p => {
            let month = moment(p["date"]).format("MMMM YYYY");
            let index = months.findIndex(m => {
                return m["name"] === month;
            });

            if (index < 0) {
                let url = moment(p["date"]).format("MMYY");
                return months.push({ name: month, count: 1, url })
            }

            return months[index]["count"] += 1;
        });

        return months;
    }
}

module.exports = new Database();