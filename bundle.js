/* jshint esnext: true */

'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var BookmarkExplorer = (function () {
  function BookmarkExplorer(_ref) {
    var _this = this;

    var itemsPerPage = _ref.itemsPerPage;
    var paginationDelta = _ref.paginationDelta;
    var tags = _ref.tags;
    var terms = _ref.terms;

    _classCallCheck(this, BookmarkExplorer);

    if (!Array.isArray(tags)) {
      tags = [];
    }
    if (!Array.isArray(terms)) {
      terms = [];
    }
    this.props = Object.assign({ itemsPerPage: itemsPerPage, paginationDelta: paginationDelta }, { itemsPerPage: 48, paginationDelta: 4 });
    this.debounced = {
      queryDb: new Debouncer(100, function () {
        _this.queryDb();
      })
    };

    this.refs = {
      itemList: new ItemList(),
      pageNavigator: new PageNavigator({ onChange: function onChange(pageIdx) {
          _this.state.set({ activePage: pageIdx });
        } }),
      tagSelect: new MultiSelect({ placeholder: 'tags', onChange: function onChange(tags) {
          _this.state.set({ tags: tags });
        } }),
      termSelect: new MultiSelect({ placeholder: 'terms', onChange: function onChange(terms) {
          _this.state.set({ terms: terms });
        } })
    };

    this.state = new StateManager(this.afterStateChange.bind(this));
    this.state.setInitial({ db: [], allTags: [], allTerms: [], queried: [], tags: tags, terms: terms, activePage: 0, pageQty: 0, firstIdx: 0 });
    var importer = new BookmarksImporter();
    importer.load('etc/data/vs-assets.tsv', function (_ref2) {
      var db = _ref2.db;
      var aTags = _ref2.tags;
      var aTerms = _ref2.terms;

      _this.state.set({ db: db, allTags: aTags, allTerms: aTerms });
    });
  }

  _createClass(BookmarkExplorer, [{
    key: 'afterStateChange',
    value: function afterStateChange(k, v, oldV) {
      var _this2 = this;

      if (['db', 'tags', 'terms'].includes(k)) {
        this.debounced.queryDb.trigger();
      }

      if (k == 'allTags') {
        this.refs.tagSelect.setSelectableItems(v);
      }
      if (k == 'allTerms') {
        this.refs.termSelect.setSelectableItems(v);
      }
      if (k == 'queried') {
        var itemsPerPage = this.props.itemsPerPage;

        var pageQty = Math.ceil(v.length / itemsPerPage);
        this.state.set({ pageQty: pageQty, activePage: 0 });
      }

      if (['queried', 'firstIdx'].includes(k)) {
        (function () {
          var itemsPerPage = _this2.props.itemsPerPage;

          var _state$get = _this2.state.get();

          var db = _state$get.db;
          var firstIdx = _state$get.firstIdx;
          var queried = _state$get.queried;

          var items = queried.slice(firstIdx, firstIdx + itemsPerPage).map(function (i) {
            return db[i];
          });
          _this2.state.set({ items: items });
        })();
      }

      if (k === 'items') {
        this.refs.itemList.setItems(v);
        this.render();
      }

      if (['activePage', 'pageQty'].includes(k)) {
        var _props = this.props;
        var itemsPerPage = _props.itemsPerPage;
        var paginationDelta = _props.paginationDelta;
        var pageNavigator = this.refs.pageNavigator;

        var _state$get2 = this.state.get();

        var activePage = _state$get2.activePage;
        var _pageQty = _state$get2.pageQty;

        var pages = paginationAlgorithm(activePage, _pageQty, paginationDelta);
        pageNavigator.setPages(pages);
        this.state.set({ firstIdx: itemsPerPage * activePage });
      }

      return v;
    }
  }, {
    key: 'queryDb',
    value: function queryDb() {
      var _state$get3 = this.state.get();

      var db = _state$get3.db;
      var sTags = _state$get3.tags;
      var sTerms = _state$get3.terms;

      var options = {};
      // get options
      var hasTags = sTags && Array.isArray(sTags) && sTags.length > 0;
      var hasTerms = sTerms && Array.isArray(sTerms) && sTerms.length > 0;
      var searchFn;
      if (hasTags || hasTerms) {
        searchFn = function (d) {
          var tags = d.tags;
          var terms = d.terms;

          var isIn = true;
          if (hasTags && !Haystack.allOf(tags, sTags)) {
            isIn = false;
          }
          if (hasTerms && !Haystack.allOf(terms, sTerms)) {
            isIn = false;
          }
          return isIn;
        };
      }
      // search
      var queried = [];
      if (searchFn === undefined) {
        queried = Object.keys(db);
      } else {
        for (var i = 0, ni = db.length; i < ni; i++) {
          if (searchFn === undefined || searchFn(db[i])) {
            queried.push(i);
          }
        }
      }
      this.state.set({ queried: queried });
    }
  }, {
    key: 'render',
    value: function render() {

      if (!this.node) {
        this.node = document.createElement('bookmark-explorer');
        var _node = this.node;
        _node.innerHTML = '\n            <div class="query-options">\n      \t\t\t\t<div class="tags"> </div>\n      \t\t\t\t<div class="terms"> </div>\n      \t\t\t</div>\n            <div class="item-list"></div>\n            <div class="pageNavigator"></div>\n        ';
      }

      var node = this.node;
      var _refs = this.refs;
      var itemList = _refs.itemList;
      var pageNavigator = _refs.pageNavigator;
      var tagSelect = _refs.tagSelect;
      var termSelect = _refs.termSelect;

      mount(node.querySelector('.item-list'), itemList.render());
      mount(node.querySelector('.pageNavigator'), pageNavigator.render());
      mount(node.querySelector('.query-options .tags'), tagSelect.render());
      mount(node.querySelector('.query-options .terms'), termSelect.render());
      return node;
    }
  }]);

  return BookmarkExplorer;
})();

function mount(node, component) {
  node.innerHTML = '';
  node.appendChild(component);
}
/* jshint esnext: true */

'use strict';

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var BookmarksImporter = (function () {
  function BookmarksImporter() {
    _classCallCheck(this, BookmarksImporter);
  }

  _createClass(BookmarksImporter, [{
    key: 'load',
    value: function load(file, asyncReturn) {

      xhr(file, function (tsv) {

        var aTags = new Set(),
            aTerms = new Set();
        var db = tsv.split('\n').reduce(function (acc, d, i) {
          if (d.length) {
            var _d$split = d.split('\t');

            var _d$split2 = _slicedToArray(_d$split, 5);

            var src = _d$split2[0];
            var fmt = _d$split2[1];
            var tags = _d$split2[2];
            var terms = _d$split2[3];
            var others = _d$split2[4];

            tags = tags.split(';');
            tags.forEach(function (t) {
              aTags.add(t);
            });
            terms = terms.split(';');
            terms.forEach(function (t) {
              aTerms.add(t);
            });
            others = others.split(';');
            var url = 'http://bl.ocks.org/' + src;
            var thumb = 'etc/snapshots/_no-pict.png';
            if (fmt && fmt.indexOf('gtb:') !== -1) {
              var rid = fmt.replace('gtb:', '');
              thumb = 'https://gist.githubusercontent.com/' + src + '/raw/' + rid + '/thumbnail.png';
            } else if (fmt && fmt.indexOf('s') !== -1) {
              thumb = 'etc/snapshots/raw_' + src.replace('/', '-') + '.png';
            }
            var doc = { src: url, thumb: thumb, fmt: fmt, tags: tags, terms: terms, others: others };
            acc.push(doc);
          }
          return acc;
        }, []);

        asyncReturn({ db: db, tags: Array.from(aTags.values()).sort(), terms: Array.from(aTerms.values()).sort() });
      });
    }
  }]);

  return BookmarksImporter;
})();
/* jshint esnext: true */

'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var ItemList = (function () {
  function ItemList() {
    _classCallCheck(this, ItemList);

    this.state = new StateManager(this.afterStateChange.bind(this));
    this.state.setInitial({ items: [] });
  }

  _createClass(ItemList, [{
    key: 'afterStateChange',
    value: function afterStateChange(k, v, oldV) {
      if (k === 'items') {
        this.render();
      }
    }
  }, {
    key: 'setItems',
    value: function setItems(_) {
      this.state.set({ items: _ });
    }
  }, {
    key: 'render',
    value: function render() {
      var itemNode = function itemNode(d) {
        return d && d.length ? '<item>' + d + '</item>' : '';
      };
      var state = this.state;

      if (!this.node) {
        this.node = document.createElement('item-list');
        this.node.addEventListener('click', function (e) {
          var type = e.target.dataset.src;

          if (type) {
            var idx = e.target.dataset.idx;
            var src = state.get().items[idx].src;
            if (type === 'block') {}
            if (type === 'gist') {
              src = src.replace('bl.ocks.org', 'gist.github.com');
            }
            if (type === 'inlet') {
              src = src.replace(/http:\/\/bl.ocks.org\/([^\/]+)\/(\w+)$/, 'http://tributary.io/inlet/$2?user=$1');
            }
            window.open(src, '_blank');
          }
        });
      }

      var _state$get = state.get();

      var items = _state$get.items;

      var node = this.node;
      var nodes = items.map(function (d, i) {
        var tags = d.tags.map(itemNode).join(' ');
        var terms = d.terms.map(itemNode).join(' ');
        var others = d.others.map(itemNode).join(' ');
        var thumbPath = d.thumb;
        var blockLinks = '<div>\n  <span data-src="gist" data-idx="' + i + '">gist</span> \n  (<span data-src="block" data-idx="' + i + '">block</span>,\n  <span data-src="inlet" data-idx="' + i + '">inlet</span>)\n</div>';

        return '<item>\n  <div class="asset-item">\n    <div class="preview">\n      <div class="thumb"><img data-path="' + thumbPath + '" src="' + thumbPath + '" alt="svg"></div>\n      <div class="links">' + blockLinks + '</div>\n    </div>\n    <div class="desc">\n      <div class="tagged tags">' + tags + '</div>\n      <div class="tagged terms">' + terms + '</div>\n      <div class="tagged others">' + others + '</div>\n    </div>\n  </div>\n</item>';
      });
      node.innerHTML = nodes.join('\n');
      return node;
    }
  }]);

  return ItemList;
})();

/* src is good to go */
/* jshint esnext: true */

'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var MultiSelect = (function () {
  function MultiSelect(_ref) {
    var placeholder = _ref.placeholder;
    var onChange = _ref.onChange;

    _classCallCheck(this, MultiSelect);

    this.props = { placeholder: placeholder, onChange: onChange };
    this.debounced = {
      updateFilter: new Debouncer(50, this.updateFilter.bind(this))
    };
    this.bound = {
      onActivated: this.onActivated.bind(this),
      onDisactivated: this.onDisactivated.bind(this),
      onFragmentChange: this.onFragmentChange.bind(this)
    };
    this.comps = {
      removable: new RemovableItems({ onChange: this.onRemovedChange.bind(this) }),
      selectable: new SelectableItems({ onChange: this.onItemAdded.bind(this) })
    };

    this.state = new StateManager(this.afterStateChange.bind(this));
    this.state.setInitial({ fragment: '', selectedItems: [], active: false });
  }

  _createClass(MultiSelect, [{
    key: 'setSelectableItems',
    value: function setSelectableItems(_) {
      var selectable = this.comps.selectable;

      selectable.setItems(_);
    }
  }, {
    key: 'afterStateChange',
    value: function afterStateChange(k, v, mutated) {
      if (k === 'active' && mutated) {
        this.render();
      }

      if (['fragment', 'selectedItems'].includes(k)) {
        this.debounced.updateFilter.trigger();
        this.render();
      }

      if (['selectedItems'].includes(k)) {
        var onChange = this.props.onChange;

        onChange(this.state.get().selectedItems);
      }
    }
  }, {
    key: 'onDisactivated',
    value: function onDisactivated() {
      this.state.set({ active: false });
    }
  }, {
    key: 'onActivated',
    value: function onActivated() {
      this.state.set({ active: true });
    }
  }, {
    key: 'onFragmentChange',
    value: function onFragmentChange(str) {
      this.state.set({ fragment: str });
    }
  }, {
    key: 'onItemAdded',
    value: function onItemAdded(item) {
      var _comps = this.comps;
      var removable = _comps.removable;
      var input = _comps.input;

      this.state.set({ fragment: '' });
      removable.addItem(item);
    }
  }, {
    key: 'onRemovedChange',
    value: function onRemovedChange(items) {
      var _comps2 = this.comps;
      var removable = _comps2.removable;
      var selectable = _comps2.selectable;

      var _state$get = this.state.get();

      var fragment = _state$get.fragment;

      this.state.set({ selectedItems: items });
    }
  }, {
    key: 'dispatchChange',
    value: function dispatchChange() {
      var onChange = this.props.onChange;

      onChange(items);
    }
  }, {
    key: 'updateFilter',
    value: function updateFilter() {
      var selectable = this.comps.selectable;

      var _state$get2 = this.state.get();

      var fragment = _state$get2.fragment;
      var selectedItems = _state$get2.selectedItems;

      selectable.setFilterFn(function (d) {
        var included = false;
        var noFragment = typeof fragment !== 'string' || fragment.length === 0;
        if (noFragment || d.indexOf(fragment) !== -1) {
          included = true;
        }
        var itemsIsArray = Array.isArray(selectedItems) ? true : false;
        if (itemsIsArray && selectedItems.includes(d)) {
          included = false;
        }
        return included;
      });
    }
  }, {
    key: 'render',
    value: function render() {
      var placeholder = this.props.placeholder;
      var _bound = this.bound;
      var onDisactivated = _bound.onDisactivated;
      var onActivated = _bound.onActivated;
      var onFragmentChange = _bound.onFragmentChange;

      if (!this.node) {
        this.node = document.createElement('multi-select');
        var _node = this.node;
        if (typeof placeholder !== 'string') {
          placeholder = '';
        }
        _node.innerHTML = '\n  <div class="removable"></div>\n  <div class="input"><input placeholder="' + placeholder + '" data-fragment></input></div>\n  <div class="selectable"></div>\n  ';

        _node.addEventListener('mouseleave', function (evt) {
          onDisactivated();
        }, false);
        _node.addEventListener('click', function (evt) {
          var d = evt.target.dataset.fragment;
          if (d !== undefined) {
            onActivated();
          }
        });
        _node.addEventListener('keyup', function (evt) {
          var d = evt.target.dataset.fragment;
          if (d !== undefined) {
            onFragmentChange(evt.target.value);
          }
        });
      }
      var node = this.node;

      var _state$get3 = this.state.get();

      var active = _state$get3.active;
      var fragment = _state$get3.fragment;

      var changed = this.state.changes();
      var _comps3 = this.comps;
      var selectable = _comps3.selectable;
      var removable = _comps3.removable;

      node.querySelector('.selectable').innerHTML = '';node.querySelector('.selectable').appendChild(selectable.render());
      node.querySelector('.removable').innerHTML = '';node.querySelector('.removable').appendChild(removable.render());
      node.querySelector('.input input').value = fragment;
      setClassName(node.querySelector('.selectable').classList, 'inactive', !active);
      return node;
    }
  }]);

  return MultiSelect;
})();

function setClassName(classList, name, isAdded) {
  if (!isAdded && classList.contains(name)) {
    classList.remove(name);
  } else if (isAdded && !classList.contains(name)) {
    classList.add(name);
  }
}
/* jshint esnext: true */

'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var RemovableItems = (function () {
  function RemovableItems(_ref) {
    var onChange = _ref.onChange;

    _classCallCheck(this, RemovableItems);

    this.props = { onChange: onChange };
    this.bound = {
      onRemoveItem: this.onRemoveItem.bind(this)
    };
    this.state = new StateManager(this.afterStateChange.bind(this));
    this.state.setInitial({ items: [] });
  }

  _createClass(RemovableItems, [{
    key: 'afterStateChange',
    value: function afterStateChange(k, v, mutated) {
      if (k === 'items' && mutated) {
        var onChange = this.props.onChange;

        onChange(v);
        this.render();
      }
    }
  }, {
    key: 'addItem',
    value: function addItem(item) {
      var _state$get = this.state.get();

      var items = _state$get.items;

      if (!items.includes(item)) {
        var clone = items.slice(0);clone.push(item);
        this.state.set({ items: clone });
      }
    }
  }, {
    key: 'onRemoveItem',
    value: function onRemoveItem(idx) {
      var _state$get2 = this.state.get();

      var items = _state$get2.items;

      var clone = items.slice(0);clone.splice(idx, 1);
      this.state.set({ items: clone });
    }
  }, {
    key: 'render',
    value: function render() {
      var _this = this;

      if (!this.node) {
        (function () {
          var onRemoveItem = _this.bound.onRemoveItem;

          _this.node = document.createElement('removable-items');
          _this.node.addEventListener('click', function (evt) {
            var idx = evt.target.dataset.removeidx;
            if (idx !== undefined) {
              onRemoveItem(parseInt(idx, 10));
            }
          });
        })();
      }
      var node = this.node;

      var _state$get3 = this.state.get();

      var items = _state$get3.items;

      node.innerHTML = items.map(function (d, i) {
        return '<item>' + d + '<span data-removeidx="' + i + '">x</span></item>';
      }).join(' ');

      return node;
    }
  }]);

  return RemovableItems;
})();
/* jshint esnext: true */

'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var SelectableItems = (function () {
  function SelectableItems(_ref) {
    var onChange = _ref.onChange;

    _classCallCheck(this, SelectableItems);

    this.bound = {
      onItemSelected: function onItemSelected(item) {
        onChange(item);
      }
    };
    this.state = new StateManager(this.afterStateChange.bind(this));
    this.state.setInitial({ items: [], filterFn: function filterFn() {
        return true;
      } });
  }

  _createClass(SelectableItems, [{
    key: 'afterStateChange',
    value: function afterStateChange(k, v, mutated) {
      if (k === 'items' && mutated) {
        this.render();
      }
      if (k === 'filterFn' && mutated) {
        this.render();
      }
    }
  }, {
    key: 'setItems',
    value: function setItems(_) {
      this.state.set({ items: _.slice(0) });
    }
  }, {
    key: 'setFilterFn',
    value: function setFilterFn(_) {
      this.state.set({ filterFn: _ });
    }
  }, {
    key: 'render',
    value: function render() {
      var _this = this;

      if (!this.node) {
        (function () {
          var onItemSelected = _this.bound.onItemSelected;

          _this.node = document.createElement('selectable-items');
          _this.node.addEventListener('click', function (evt) {
            if (evt.target.nodeName === 'ITEM') {
              onItemSelected(evt.target.innerText);
            }
          });
        })();
      }
      var node = this.node;

      var _state$get = this.state.get();

      var items = _state$get.items;
      var filterFn = _state$get.filterFn;

      var activeOptions = items.filter(filterFn);
      node.innerHTML = activeOptions.map(function (d) {
        return '<item>' + d + '</item>';
      }).join(' ');
      return node;
    }
  }]);

  return SelectableItems;
})();
/* jshint esnext: true */

"use strict";

var lorem = "The quick, brown fox jumps over a lazy dog. DJs flock by when MTV ax quiz prog. Junk MTV quiz graced by fox whelps. Bawds jog, flick quartz, vex nymphs. Waltz, bad nymph, for quick jigs vex! Fox nymphs grab quick-jived waltz. Brick quiz whangs jumpy veldt fox. Bright vixens jump; dozy fowl quack. Quick wafting zephyrs vex bold Jim. Quick zephyrs blow, vexing daft Jim. Sex-charged fop blew my junk TV quiz. How quickly daft jumping zebras vex. Two driven jocks help fax my big quiz. Quick, Baz, get my woven flax jodhpurs! \"Now fax quiz Jack!\" my brave ghost pled. Five quacking zephyrs jolt my wax bed. Flummoxed by job, kvetching W. zaps Iraq. Cozy sphinx waves quart jug of bad milk. A very bad quack might jinx zippy fowls. Few quips galvanized the mock jury box. Quick brown dogs jump over the lazy fox. The jay, pig, fox, zebra, and my wolves quack! Blowzy red vixens fight for a quick jump. Joaquin Phoenix was gazed by MTV for luck. A wizard’s job is to vex chumps quickly in fog. Watch \"Jeopardy!\", Alex Trebek's fun TV quiz game. Woven silk pyjamas exchanged for blue quartz. Brawny gods just";
/* jshint esnext: true */

'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var PageNavigator = (function () {
  function PageNavigator(_ref) {
    var onChange = _ref.onChange;

    _classCallCheck(this, PageNavigator);

    this.props = { onChange: onChange };
    this.bound = { onPageClick: this.onPageClick.bind(this) };
    this.state = new StateManager(this.afterStateChange.bind(this));
    this.state.setInitial({ pages: [] });
  }

  _createClass(PageNavigator, [{
    key: 'afterStateChange',
    value: function afterStateChange(k, v, mutated, oldV) {
      if (k === 'pages') {
        this.render();
      }
    }
  }, {
    key: 'onPageClick',
    value: function onPageClick(e) {
      var onChange = this.props.onChange;

      if (typeof onChange === 'function') {
        var idx = e.target.dataset.idx;
        if (idx !== undefined) {
          onChange(parseInt(idx, 10));
        }
      }
    }
  }, {
    key: 'setPages',
    value: function setPages(_) {
      this.state.set({ pages: _ });
    }
  }, {
    key: 'render',
    value: function render() {
      if (!this.node) {
        this.node = document.createElement('page-navigator');
        this.node.addEventListener('click', this.bound.onPageClick);
      }
      var node = this.node;

      var _state$get = this.state.get();

      var pages = _state$get.pages;

      node.innerHTML = pages.length < 2 ? '' : pages.map(function (d) {
        return d !== '...' ? '<item data-idx=' + (d - 1) + '>' + d + '</item>' : d;
      }).join(' ');
      return node;
    }
  }]);

  return PageNavigator;
})();
/* jshint esnext: true */

// http://stackoverflow.com/questions/163809/smart-pagination-algorithm
// Implementation in ES6
'use strict';

function paginationAlgorithm(c, m, delta) {
    // c, m must be numbers
    var current = c,
        last = m,
        left = current - delta,
        right = current + delta + 1,
        range = [],
        rangeWithDots = [],
        l;

    for (var i = 1; i <= last; i++) {
        if (i == 1 || i == last || i >= left && i < right) {
            range.push(i);
        }
    }

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = range[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var i = _step.value;

            if (l) {
                if (i - l === 2) {
                    rangeWithDots.push(l + 1);
                } else if (i - l !== 1) {
                    rangeWithDots.push('...');
                }
            }
            rangeWithDots.push(i);
            l = i;
        }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion && _iterator['return']) {
                _iterator['return']();
            }
        } finally {
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }

    return rangeWithDots;
}

/*
Test it:
for (let i = 1, l = 20; i <= l; i++)
    console.log(`Selected page ${i}:`, pagination(i, l));
Expected output:
Selected page 1: [1, 2, 3, "...", 20]
Selected page 2: [1, 2, 3, 4, "...", 20]
Selected page 3: [1, 2, 3, 4, 5, "...", 20]
Selected page 4: [1, 2, 3, 4, 5, 6, "...", 20]
Selected page 5: [1, 2, 3, 4, 5, 6, 7, "...", 20]
Selected page 6: [1, "...", 4, 5, 6, 7, 8, "...", 20]
Selected page 7: [1, "...", 5, 6, 7, 8, 9, "...", 20]
Selected page 8: [1, "...", 6, 7, 8, 9, 10, "...", 20]
Selected page 9: [1, "...", 7, 8, 9, 10, 11, "...", 20]
Selected page 10: [1, "...", 8, 9, 10, 11, 12, "...", 20]
Selected page 11: [1, "...", 9, 10, 11, 12, 13, "...", 20]
Selected page 12: [1, "...", 10, 11, 12, 13, 14, "...", 20]
Selected page 13: [1, "...", 11, 12, 13, 14, 15, "...", 20]
Selected page 14: [1, "...", 12, 13, 14, 15, 16, "...", 20]
Selected page 15: [1, "...", 13, 14, 15, 16, 17, "...", 20]
Selected page 16: [1, "...", 14, 15, 16, 17, 18, 19, 20]
Selected page 17: [1, "...", 15, 16, 17, 18, 19, 20]
Selected page 18: [1, "...", 16, 17, 18, 19, 20]
Selected page 19: [1, "...", 17, 18, 19, 20]
Selected page 20: [1, "...", 18, 19, 20]
*/
/* jshint esnext: true */

"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Debouncer = (function () {
  function Debouncer(delay, cb) {
    _classCallCheck(this, Debouncer);

    this.state = { cb: cb, delay: delay };
    this.timeout = undefined;
    this.bound = { clear: this.clear.bind(this) };
  }

  _createClass(Debouncer, [{
    key: "clear",
    value: function clear() {
      if (this.timeout) {
        clearTimeout(this.timeout);this.timeout = undefined;
      }
    }
  }, {
    key: "trigger",
    value: function trigger() {
      var _state = this.state;
      var cb = _state.cb;
      var delay = _state.delay;

      var clear = this.bound.clear;
      clear();
      this.timeout = setTimeout(function () {
        clear();cb();
      }, delay);
    }
  }]);

  return Debouncer;
})();
/* jshint esnext: true */

'use strict';

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

function getQueryString(url) {
  url = url || location.href; //used location.href to avoid bug on IE6 and pseudo query string inside location.hash
  url = url.replace(/#.*/, ''); //removes hash (to avoid getting hash query)
  var queryString = /\?[a-zA-Z0-9\=\&\%\$\-\_\.\+\!\*\'\(\)\,\:]+/.exec(url); //valid chars according to: http://www.ietf.org/rfc/rfc1738.txt
  return queryString ? decodeURIComponent(queryString[0]) : '';
}

function decodeQuery(str) {
  return (str || '').replace('?', '').split('&').reduce(function (acc, d, i) {
    var _ref = d.split('=') || [];

    var _ref2 = _slicedToArray(_ref, 2);

    var k = _ref2[0];
    var v = _ref2[1];

    if (k) {
      if (!/\D/.exec(v)) {
        v = parseInt(v, 10);
      }
      if (!/[^\d\.]/.exec(v)) {
        v = parseFloat(v);
      }
      acc[k] = v;
    }
    return acc;
  }, {});
}
/* jshint esnext: true */

"use strict";

var Haystack = {};

Haystack.nothingToDo = function (haystack, needles) {
    return !Array.isArray(needles) || !Array.isArray(haystack);
};
Haystack.haystackTooSmall = function (haystack, needles) {
    var out = false;
    if (Haystack.nothingToDo(haystack, needles)) {
        out = true;
    } else if (haystack.length < needles.length) {
        out = true;
    }
    return out;
};
Haystack.allOf = function (haystack, needles) {
    var out = false;
    if (Haystack.haystackTooSmall(haystack, needles)) {
        out = false;
    } else {
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
    } else {
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
    } else {
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
/* jshint esnext: true */

'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var StateManager = (function () {
  function StateManager(afterKeyChange, beforeKeySet) {
    _classCallCheck(this, StateManager);

    if (typeof beforeKeySet === 'function') {
      this.beforeKeySet = beforeKeySet;
    }
    if (typeof afterKeyChange === 'function') {
      this.afterKeyChange = afterKeyChange;
    }
    this.state = {};
    this.changed = new Set();
  }

  _createClass(StateManager, [{
    key: 'set',
    value: function set(obj) {
      var _this = this;

      if (typeof obj !== 'object') {
        throw new TypeError('StateManager.set expects an object as parameter');
      }
      if (typeof obj === 'object') {
        var keys = Object.keys(obj);
        keys.forEach(function (k) {
          _this.changed.add(k);
          var oldV = _this.state[k];
          var v = _this.beforeKeySet(k, obj[k]);
          _this.state[k] = v;
          _this.afterKeyChange(k, v, v !== oldV, oldV);
        });
      }
    }
  }, {
    key: 'setInitial',
    value: function setInitial(obj) {
      if (typeof obj !== 'object') {
        throw new TypeError('StateManager.set expects an object as parameter');
      }
      this.state = Object.assign(this.state, obj);
    }
  }, {
    key: 'get',
    value: function get() {
      return this.state;
    }
  }, {
    key: 'changes',
    value: function changes() {
      var l = Array.from(this.changed.values());
      this.changed = new Set();
      return l;
    }
  }, {
    key: 'beforeKeySet',
    value: function beforeKeySet(k, v) {
      return v;
    }
  }, {
    key: 'afterKeyChange',
    value: function afterKeyChange(key, v, oldV) {
      return v;
    }
  }]);

  return StateManager;
})();
'use strict';

function xhr(path, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', path);
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 200) {
      callback(xhr.responseText);
    }
  };
  xhr.send();
  return xhr;
}
