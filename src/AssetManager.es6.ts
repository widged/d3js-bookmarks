/* jshint esnext: true */

// https://github.com/louischatriot/nedb

var Nedb = require('nedb');

class Haystack {

  static nothingToDo(haystack, needles) {
    return (!Array.isArray(needles) || !Array.isArray(haystack));
  }

  static haystackTooSmall(haystack, needles) {
    let out = false;
    if(Haystack.nothingToDo(haystack, needles)) {
      out = true;
    } else if (haystack.length < needles.length) {
      out = true;
    }
    return out;
  }

  static allOf(haystack, needles) {
    let out = false;
    if(Haystack.haystackTooSmall(haystack, needles)) {
      out = false;
    } else {
      out = true;
      for (var d of needles) {
        if(haystack.indexOf(d) === -1) {
          out = false;
          break;
        }
      }
    }
    return out;
  }

  static someOf(haystack, needles) {
    let out = false;
    if(Haystack.haystackTooSmall(haystack, needles)) {
      out = false;
    } else {
      out = false;
      for (var d of needles) {
        if(haystack.indexOf(d) !== -1) {
          out = true;
          break;
        }
      }
    }
    return out;
  }

  static noneOf(haystack, needles) {
    let out = false;
    if(Haystack.nothingToDo(haystack, needles)) {
      out = false;
    } else {
      out = true;
      for (var d of needles) {
        if(haystack.indexOf(d) !== -1) {
          out = false;
          break;
        }
      }
    }
    return out;
  }

}



class AssetManager {
  constructor(filename) {
    let db = new Nedb({ filename: filename, autoload: true });
    this.state = {db};
  }

  /*
  // Using $in. $nin is used in the same way
  db.find({ tags: { $in: tags }}, function (err, docs) {
    // docs contains Earth and Jupiter
  });
  */

  listItems(config, asyncReturn) {
    const {db} = this.state;
    const {tags,terms} = config;
    const hasTags = (tags && Array.isArray(tags));
    const hasTerms = (terms && Array.isArray(terms));
    let options = {};
    if(hasTags || hasTerms) {
      options = { $where: function () { return (hasTags && Haystack.allOf(this.tags, tags)) && (hasTerms && Haystack.allOf(this.terms, terms)); } };
    }

    db.find(options).sort({ tags: 1, terms: 1, path: 1}).exec((err, docs) => {
      if(!err) { asyncReturn(docs); }
    });
  }

  removeItem(id, asyncReturn) {
    db.remove({ _id: id }, {}, function (err, numRemoved) {
      let msg = err ? err : 'removed '+ numRemoved + ' items';
      asyncReturn(msg);
    });
  }

  static msgReplaced(asyncReturn) {
    return function (err, numReplaced) {
      let msg = err ? err : 'changed '+ numReplaced + ' items';
      asyncReturn(msg);
    };
  }

  /* ##### TAGS ##### */


  addTagToItem(id, value, asyncReturn) {
    const {db} = this.state;
    db.update({ _id: id }, { $addToSet: { tags: value }  }, { multi: true }, AssetManager.msgReplaced(asyncReturn));
  }

  removeTagFromItem(id, value, asyncReturn) {
    const {db} = this.state;
    db.update({ _id: id }, { $pull: { tags: value }  }, {}, AssetManager.msgReplaced(asyncReturn));
  }

  markAsMissing(id) {
    const {db} = this.state;
    db.update({ _id: id }, { $addToSet: { tags: 'thumb-missing' }  }, {}, AssetManager.msgReplaced((d) => {}));
  }

  /* ##### TERMS ##### */

  addTermToItem(id, value, asyncReturn) {
    const {db} = this.state;
    db.update({ _id: id }, { $addToSet: { terms: value }  }, { multi: true }, AssetManager.msgReplaced(asyncReturn));
  }

  removeTermFromItem(id, value, asyncReturn) {
    const {db} = this.state;
    db.update({ _id: id }, { $pull: { terms: value }  }, {}, AssetManager.msgReplaced(asyncReturn));
  }


  setTermsToName(asyncReturn) {
    const {db} = this.state;
    if(typeof asyncReturn !== 'function') { asyncReturn = function() {}; }
    db.find({}).exec((err, docs) => {
      if(!err) { asyncReturn(docs); }
      docs.map((d, i) => {
        if(d.hasOwnProperty('terms')) { return; }
        // if(i > 10) { return;}
        const term = d.file.split('.svg')[0].replace(/[^a-z]+$/i, '');
        db.update({ _id: d._id }, { $set: { terms: [term] }  }, { multi: true }, function (err, numReplaced) {
          let msg = err ? err : 'changed '+ numReplaced + ' items';

          asyncReturn(msg);
        });

      });
    });
  }

  renameTag(oldName, newName) {

  }

  importJson(lines) {
    const {db} = this.state;
    lines.map((d,i) => {
      console.log(d,i);
      db.insert(d, function (err, newDocs) {
        if(err) {
            console.log('[ERROR]', err);
        } else {
          console.log('[DOC]', newDocs);
        }

        // Two documents were inserted in the database
        // newDocs is an array with these documents, augmented with their _id
      });
    });
  }


}



export default AssetManager;
