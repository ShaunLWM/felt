const low = require("lowdb")
const FileSync = require("lowdb/adapters/FileSync")
const adapter = new FileSync("db.json");
const lodashId = require("lodash-id");
const moment = require("moment");

class Database {
    constructor() {
        this.db = low(adapter);
        this.db._.mixin(lodashId);
        this.db.defaults({ config: {}, posts: [], tags: [], analytics: [], drafts: [] }).write();
    }

    addPost({ slug, title, date, body, tags }) {
        this.db.get("posts").push({
            slug, title, date, body, tags
        }).write();

        this.processTags(tags);
        this.processAnalytics(slug);
    }

    getAllTags() {
        return this.db.get("tags").orderBy("u", ["desc"]).value();
    }

    getPosts() {
        return this.db.get("posts").orderBy("date", ["desc"]).value();
    }

    deletePost(id) {
        return this.db.get("posts").remove({ id }).write();
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
            return console.log('[!] no tags to process..');
        }

        let old = this.db.get("tags").value();
        tags.forEach(t => {
            let i = this.db._.find(old, function (o) { return o.v === t; });
            if (typeof i === "undefined") {
                return this.db.get("tags").push({
                    v: t.trim(),                    // value
                    c: 1,                           // count
                    u: ((new Date()).getTime())     // last updated
                }).write();
            }

            return this.db.get("tags").find({ v: t }).assign({ c: i.c + 1, u: ((new Date()).getTime()) }).write();
        });
    }

    findPost({ tag = null, date = null, slug = null }) {
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

    getDrafts(removeSchedule = false) {
        if (removeSchedule) {
            return this.db.get("drafts").orderBy("date", ["desc"]).filter({ scheduled: 0 }).value();
        }

        return this.db.get("drafts").orderBy("date", ["desc"]).value();
    }

    getScheduled() {
        return this.db._.remove(this.db.get("drafts").orderBy("date", ["desc"]).value(), function (n) {
            return n.scheduled === 0;
        }); // remove those that are not scheduled post
    }

    saveDraft({ id, title, body, tags, scheduled = 0 }) {
        let date = new Date().getTime();
        let post = this.db.get("drafts").find({ id }).value();
        if (typeof post === "undefined") {
            return this.db.get("drafts").push({
                title, body, tags, date, scheduled
            }).write();
        }

        return this.db.get("drafts").find({ id }).assign({ date, title, body, tags, scheduled }).write();
    }

    deleteDraft(id) {
        return this.db.get("drafts").remove({ id }).write();
    }

    publicDraft(id) {
        let post = this.db.get("drafts").find({ id }).value();
        this.addPost(post);
        return this.db.get("drafts").remove({ id }).write();
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