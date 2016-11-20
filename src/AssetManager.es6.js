/* jshint esnext: true */
"use strict";
// https://github.com/louischatriot/nedb
var Haystack = (function () {
    function Haystack() {
    }
    Haystack.nothingToDo = function (haystack, needles) {
        return (!Array.isArray(needles) || !Array.isArray(haystack));
    };
    Haystack.haystackTooSmall = function (haystack, needles) {
        var out = false;
        if (Haystack.nothingToDo(haystack, needles)) {
            out = true;
        }
        else if (haystack.length < needles.length) {
            out = true;
        }
        return out;
    };
    Haystack.allOf = function (haystack, needles) {
        var out = false;
        if (Haystack.haystackTooSmall(haystack, needles)) {
            out = false;
        }
        else {
            out = true;
            for (var _i = 0, needles_1 = needles; _i < needles_1.length; _i++) {
                var d = needles_1[_i];
                if (haystack.indexOf(d) === -1) {
                    out = false;
                    break;
                }
            }
        }
        return out;
    };
    Haystack.someOf = function (haystack, needles) {
        var out = false;
        if (Haystack.haystackTooSmall(haystack, needles)) {
            out = false;
        }
        else {
            out = false;
            for (var _i = 0, needles_2 = needles; _i < needles_2.length; _i++) {
                var d = needles_2[_i];
                if (haystack.indexOf(d) !== -1) {
                    out = true;
                    break;
                }
            }
        }
        return out;
    };
    Haystack.noneOf = function (haystack, needles) {
        var out = false;
        if (Haystack.nothingToDo(haystack, needles)) {
            out = false;
        }
        else {
            out = true;
            for (var _i = 0, needles_3 = needles; _i < needles_3.length; _i++) {
                var d = needles_3[_i];
                if (haystack.indexOf(d) !== -1) {
                    out = false;
                    break;
                }
            }
        }
        return out;
    };
    return Haystack;
}());
var AssetManager = (function () {
    function AssetManager(filename) {
        var db = new Nedb({ filename: filename, autoload: true });
        this.state = { db: db };
    }
    /*
    // Using $in. $nin is used in the same way
    db.find({ tags: { $in: tags }}, function (err, docs) {
      // docs contains Earth and Jupiter
    });
    */
    AssetManager.prototype.listItems = function (config, asyncReturn) {
        var db = this.state.db;
        var tags = config.tags, terms = config.terms;
        var hasTags = (tags && Array.isArray(tags));
        var hasTerms = (terms && Array.isArray(terms));
        var options = {};
        if (hasTags || hasTerms) {
            options = { $where: function () { return (hasTags && Haystack.allOf(this.tags, tags)) && (hasTerms && Haystack.allOf(this.terms, terms)); } };
        }
        db.find(options).sort({ tags: 1, terms: 1, path: 1 }).exec(function (err, docs) {
            if (!err) {
                asyncReturn(docs);
            }
        });
    };
    AssetManager.prototype.removeItem = function (id, asyncReturn) {
        db.remove({ _id: id }, {}, function (err, numRemoved) {
            var msg = err ? err : 'removed ' + numRemoved + ' items';
            asyncReturn(msg);
        });
    };
    AssetManager.msgReplaced = function (asyncReturn) {
        return function (err, numReplaced) {
            var msg = err ? err : 'changed ' + numReplaced + ' items';
            asyncReturn(msg);
        };
    };
    /* ##### TAGS ##### */
    AssetManager.prototype.addTagToItem = function (id, value, asyncReturn) {
        var db = this.state.db;
        db.update({ _id: id }, { $addToSet: { tags: value } }, { multi: true }, AssetManager.msgReplaced(asyncReturn));
    };
    AssetManager.prototype.removeTagFromItem = function (id, value, asyncReturn) {
        var db = this.state.db;
        db.update({ _id: id }, { $pull: { tags: value } }, {}, AssetManager.msgReplaced(asyncReturn));
    };
    AssetManager.prototype.markAsMissing = function (id) {
        var db = this.state.db;
        db.update({ _id: id }, { $addToSet: { tags: 'thumb-missing' } }, {}, AssetManager.msgReplaced(function (d) { }));
    };
    /* ##### TERMS ##### */
    AssetManager.prototype.addTermToItem = function (id, value, asyncReturn) {
        var db = this.state.db;
        db.update({ _id: id }, { $addToSet: { terms: value } }, { multi: true }, AssetManager.msgReplaced(asyncReturn));
    };
    AssetManager.prototype.removeTermFromItem = function (id, value, asyncReturn) {
        var db = this.state.db;
        db.update({ _id: id }, { $pull: { terms: value } }, {}, AssetManager.msgReplaced(asyncReturn));
    };
    AssetManager.prototype.setTermsToName = function (asyncReturn) {
        var db = this.state.db;
        if (typeof asyncReturn !== 'function') {
            asyncReturn = function () { };
        }
        db.find({}).exec(function (err, docs) {
            if (!err) {
                asyncReturn(docs);
            }
            docs.map(function (d, i) {
                if (d.hasOwnProperty('terms')) {
                    return;
                }
                // if(i > 10) { return;}
                var term = d.file.split('.svg')[0].replace(/[^a-z]+$/i, '');
                db.update({ _id: d._id }, { $set: { terms: [term] } }, { multi: true }, function (err, numReplaced) {
                    var msg = err ? err : 'changed ' + numReplaced + ' items';
                    asyncReturn(msg);
                });
            });
        });
    };
    AssetManager.prototype.renameTag = function (oldName, newName) {
    };
    AssetManager.prototype.importJson = function (lines) {
        var db = this.state.db;
        lines.map(function (d, i) {
            console.log(d, i);
            db.insert(d, function (err, newDocs) {
                if (err) {
                    console.log('[ERROR]', err);
                }
                else {
                    console.log('[DOC]', newDocs);
                }
                // Two documents were inserted in the database
                // newDocs is an array with these documents, augmented with their _id
            });
        });
    };
    return AssetManager;
}());
