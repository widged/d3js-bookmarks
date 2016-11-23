/* jshint esnext: true */

'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var BookmarkExplorerPrivate = (function () {
  function BookmarkExplorerPrivate(_ref) {
    var _this = this;

    var itemsPerPage = _ref.itemsPerPage;
    var paginationDelta = _ref.paginationDelta;
    var tags = _ref.tags;
    var terms = _ref.terms;
    var nopic = _ref.nopic;

    _classCallCheck(this, BookmarkExplorerPrivate);

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

    this.state = new StateManager(this.afterStateChange.bind(this));
    this.state.setInitial({ db: [], allTags: [], allTerms: [], nopic: nopic, queried: [], tags: tags, terms: terms, activePage: 0, pageQty: 0, firstIdx: 0 });
    var importer = new BookmarksImporter();
    importer.load('etc/data/vs-assets.tsv', function (_ref2) {
      var db = _ref2.db;
      var aTags = _ref2.tags;
      var aTerms = _ref2.terms;

      _this.state.set({ db: db, allTags: aTags, allTerms: aTerms });
    });

    this.refs = {
      tagSelect: new MultiSelect({
        placeholder: 'tags',
        onChange: function onChange(tags) {
          _this.state.set({ tags: tags });
        },
        selectedItems: tags
      }),
      termSelect: new MultiSelect({
        placeholder: 'terms',
        onChange: function onChange(terms) {
          _this.state.set({ terms: terms });
        },
        selectedItems: terms
      }),
      itemList: new ItemList({
        ItemRenderer: BookmarkItem
      }),
      pageNavigator: new PageNavigator({
        onChange: function onChange(pageIdx) {
          _this.state.set({ activePage: pageIdx });
        }
      })
    };
  }

  _createClass(BookmarkExplorerPrivate, [{
    key: 'afterStateChange',

    // #####################
    // # Dealing with state change
    // #####################
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
        this.updateView();
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
        pageNavigator.setPages(pages, activePage);
        this.state.set({ firstIdx: itemsPerPage * activePage });
      }

      return v;
    }
  }, {
    key: 'queryDb',

    // #####################
    // # Main
    // #####################
    value: function queryDb() {
      var _state$get3 = this.state.get();

      var db = _state$get3.db;
      var sTags = _state$get3.tags;
      var sTerms = _state$get3.terms;
      var nopic = _state$get3.nopic;

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
          if (nopic === 'true') {
            return !d.fmt;
          }
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
    key: 'createElement',

    // #####################
    // # Create Element
    // #####################
    value: function createElement() {
      if (!this.mountNode) {
        var _refs = this.refs;
        var itemList = _refs.itemList;
        var pageNavigator = _refs.pageNavigator;
        var tagSelect = _refs.tagSelect;
        var termSelect = _refs.termSelect;

        var node = document.createElement('bookmark-explorer');
        node.innerHTML = '\n<div class="query-options">\n\t<div class="tags"> </div>\n\t<div class="terms"> </div>\n</div>\n<div class="item-list"></div>\n<div class="pageNavigator"></div>';
        node.querySelector('.query-options .tags').appendChild(tagSelect.createElement());
        node.querySelector('.query-options .terms').appendChild(termSelect.createElement());
        node.querySelector('.item-list').appendChild(itemList.createElement());
        node.querySelector('.pageNavigator').appendChild(pageNavigator.createElement());
        this.mountNode = node;
      }
      this.updateView();
      return this.mountNode;
    }
  }, {
    key: 'updateView',

    // #####################
    // # Update View
    // #####################
    value: function updateView() {}
  }]);

  return BookmarkExplorerPrivate;
})();

/**
 * Public interface
 */

var BookmarkExplorer = (function () {
  function BookmarkExplorer(props) {
    _classCallCheck(this, BookmarkExplorer);

    this.__private = new BookmarkExplorerPrivate(props);
  }

  _createClass(BookmarkExplorer, [{
    key: 'createElement',
    value: function createElement() {
      return this.__private.createElement();
    }
  }]);

  return BookmarkExplorer;
})();

/* Nothing to do */
/* jshint esnext: true */

'use strict';

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var itemNode = function itemNode(d) {
  return d && d.length ? '<item>' + d + '</item>' : '';
};

var BookmarkItemPrivate = (function () {
  function BookmarkItemPrivate() {
    var _this = this;

    _classCallCheck(this, BookmarkItemPrivate);

    this.state = new StateManager(this.afterStateChange.bind(this));
    this.state.setInitial({ data: undefined });
    this.bound = ['onLinkClick'].reduce(function (acc, d) {
      acc[d] = _this[d].bind(_this);return acc;
    }, {});
  }

  _createClass(BookmarkItemPrivate, [{
    key: 'setData',

    // #####################
    // # Public Accessors
    // #####################
    value: function setData(_) {
      this.state.set({ data: _ });
    }
  }, {
    key: 'onLinkClick',

    // #####################
    // # Flow
    // #####################
    value: function onLinkClick(e) {
      var type = e.target.dataset.src;
      if (type) {
        var idx = e.target.dataset.idx;
        var src = this.state.get().data.src;

        if (type === 'block') {
          src = 'http://bl.ocks.org/' + src;
        }
        if (type === 'gist') {
          src = 'http://gist.github.com/' + src;
        }
        if (type === 'inlet') {
          src = 'http://tributary.io/inlet/' + src.replace(/([^\/]+)\/(\w+)$/, '$2?user=$1');
        }
        window.open(src, '_blank');
      }
    }
  }, {
    key: 'afterStateChange',

    // #####################
    // # Dealing with state change
    // #####################
    value: function afterStateChange(k, v, oldV) {
      if (k === 'data') {
        this.updateView();
      }
    }
  }, {
    key: 'createElement',

    // #####################
    // # Create Element
    // #####################
    value: function createElement() {
      var node = document.createElement('bookmark-item');
      node.addEventListener('click', this.bound.onLinkClick);
      this.mountNode = node;
      return this.mountNode;
    }
  }, {
    key: 'updateView',
    value: function updateView() {
      var _state$get = this.state.get();

      var data = _state$get.data;

      if (data === undefined) {
        node.innerHTML = '';return;
      }

      var node = this.mountNode;
      var tags = data.tags.map(itemNode).join(' ');
      var terms = data.terms.map(itemNode).join(' ');
      var others = data.others.map(itemNode).join(' ');

      var _data$src$split = data.src.split('/');

      var _data$src$split2 = _slicedToArray(_data$src$split, 1);

      var handle = _data$src$split2[0];

      var fmt = data.fmt;
      var thumbPath = 'etc/snapshots/_no-pict.png';
      if (fmt && fmt.indexOf('gst') !== -1) {
        thumbPath = 'https://gist.githubusercontent.com/' + data.src + '/raw/thumbnail.png';
      } else if (fmt && fmt.indexOf('s') !== -1) {
        thumbPath = 'etc/snapshots/' + data.src.replace('/', '-') + '.png';
      }

      var blockLinks = '<div>\n    <span data-src="gist">gist</span>\n    (<span data-src="block">block</span>,\n    <span data-src="inlet">inlet</span>)\n    </div><div><span>@' + handle + '</span></div>\n    ';
      node.innerHTML = '\n    <div class="asset-item">\n    <div class="preview">\n    <div class="thumb"><img data-path="' + thumbPath + '" src="' + thumbPath + '" alt="svg"></div>\n    <div class="links">' + blockLinks + '</div>\n    </div>\n    <div class="desc">\n    <div class="tagged tags">' + tags + '</div>\n    <div class="tagged terms">' + terms + '</div>\n    <div class="tagged others">' + others + '</div>\n    </div>\n    </div>';
    }
  }, {
    key: 'destroyElement',

    // #####################
    // # Destroy Element
    // #####################
    value: function destroyElement() {}
  }]);

  return BookmarkItemPrivate;
})();

/**
 * Public interface
 */

var BookmarkItem = (function () {
  function BookmarkItem(props) {
    _classCallCheck(this, BookmarkItem);

    this.__private = new BookmarkItemPrivate(props);
  }

  _createClass(BookmarkItem, [{
    key: 'setData',
    value: function setData() {
      var _private;

      return (_private = this.__private).setData.apply(_private, arguments);
    }
  }, {
    key: 'createElement',
    value: function createElement() {
      return this.__private.createElement();
    }
  }, {
    key: 'destroyElement',
    value: function destroyElement() {
      return this.__private.destroyElement();
    }
  }]);

  return BookmarkItem;
})();

// cleanup and remove any event listener
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

            tags = (tags || '').split(';');
            tags.forEach(function (t) {
              aTags.add(t);
            });
            terms = (terms || '').split(';');
            terms.forEach(function (t) {
              aTerms.add(t);
            });
            others = (others || '').split(';');

            var doc = { src: src, fmt: fmt, tags: tags, terms: terms, others: others };
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
  function ItemList(_ref) {
    var ItemRenderer = _ref.ItemRenderer;

    _classCallCheck(this, ItemList);

    this.props = { ItemRenderer: ItemRenderer };
    this.state = new StateManager(this.afterStateChange.bind(this));
    this.state.setInitial({ items: [] });
    this.refs = [];
  }

  _createClass(ItemList, [{
    key: 'afterStateChange',
    value: function afterStateChange(k, v, oldV) {
      if (k === 'items') {
        this.updateView();
      }
    }
  }, {
    key: 'setItems',
    value: function setItems(_) {
      this.state.set({ items: _ });
    }
  }, {
    key: 'createElement',

    // #####################
    // # Create Element
    // #####################
    value: function createElement() {
      if (!this.mountNode) {
        var node = document.createElement('item-list');
        this.mountNode = node;
      }
      this.updateView();
      return this.mountNode;
    }
  }, {
    key: 'updateView',
    value: function updateView() {
      var _this = this;

      var node = this.mountNode;
      var ItemRenderer = this.props.ItemRenderer;

      var _state$get = this.state.get();

      var items = _state$get.items;

      // destroy nodes not in use.
      var children = Array.from(node.children);
      children.forEach(function (d, i) {
        if (!items.hasOwnProperty(i)) {
          _this.refs[i].destroyElement();
          delete _this.refs[i];
          d.parentNode.removeChild(d);
        }
      });

      // destroy nodes not in use.
      items.forEach(function (d, i) {
        if (!children.hasOwnProperty(i)) {
          var ref = new ItemRenderer();
          _this.refs[i] = ref;
          var itemNode = document.createElement('item');
          itemNode.dataset.idx = i;
          itemNode.appendChild(ref.createElement());
          node.appendChild(itemNode);
        }
        _this.refs[i].setData(d, i);
      });
      return node;
    }
  }]);

  return ItemList;
})();

/*
class ItemListWithDelegation extends ItemList {
  createElement {
    super.createElement()
    const {ItemRenderer} = this.props;
      // delegate saves CPU when binding event handlers;
      // bind saves CPU when events trigger (e.g. a user clicks something, as events bubble up the DOM to the "root" element).
    if(ItemRenderer.hasOwnProperty('delegateEvents')) {
      ItemRenderer.delegateEvents({
        addEventListener: (eventType, eventFn) => {
          node.addEventListener(eventType, (e) => {
            eventFn(e, this.state.get().items);
          });
        }
      });
    }
  }
}
*/
/* jshint esnext: true */

'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var MultiSelectPrivate = (function () {
  function MultiSelectPrivate(_ref) {
    var _this = this;

    var placeholder = _ref.placeholder;
    var onChange = _ref.onChange;
    var selectedItems = _ref.selectedItems;

    _classCallCheck(this, MultiSelectPrivate);

    this.props = { placeholder: placeholder, onChange: onChange };

    this.state = new StateManager(this.afterStateChange.bind(this));
    if (!Array.isArray(selectedItems)) {
      selectedItems = [];
    }
    this.state.setInitial({ fragment: '', selectedItems: selectedItems, active: false });

    this.debounced = {
      updateFilter: new Debouncer(50, this.updateFilter.bind(this))
    };
    this.bound = ['onActivated', 'onDisactivated', 'onFragmentChange', 'onRemovedChange', 'onItemAdded'].reduce(function (acc, k) {
      acc[k] = _this[k].bind(_this);return acc;
    }, {});
    this.refs = {
      selection: new RemovableItems({ onChange: this.bound.onRemovedChange, items: this.state.get().selectedItems }),
      selectable: new SelectableItems({ onChange: this.bound.onItemAdded })
    };
  }

  _createClass(MultiSelectPrivate, [{
    key: 'setSelectableItems',

    // #####################
    // # Public Accessors
    // #####################
    value: function setSelectableItems(_) {
      var selectable = this.refs.selectable;

      if (!Array.isArray(_)) {
        throw new TypeError('MultiSelect.setSelectableItems expects an \'Array\' as argument ' + _);
      }
      selectable.setItems(_);
    }
  }, {
    key: 'onDisactivated',

    // #####################
    // # Flow
    // #####################
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
      this.state.set({ fragment: '' });
      this.refs.selection.addItem(item);
    }
  }, {
    key: 'onRemovedChange',
    value: function onRemovedChange(items) {
      this.state.set({ selectedItems: items });
    }
  }, {
    key: 'afterStateChange',

    // #####################
    // # Dealing with state change
    // #####################
    value: function afterStateChange(k, v, mutated) {
      if (['fragment', 'selectedItems'].includes(k)) {
        this.debounced.updateFilter.trigger();
      }
      if (['selectedItems'].includes(k)) {
        var onChange = this.props.onChange;

        onChange(v);
        this.updateView();
      }
      if (['active', 'fragment'].includes(k)) {
        this.updateView();
      }
    }
  }, {
    key: 'updateFilter',

    // #####################
    // # Main
    // #####################
    value: function updateFilter() {
      var selectable = this.refs.selectable;

      var _state$get = this.state.get();

      var fragment = _state$get.fragment;
      var selectedItems = _state$get.selectedItems;

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
    key: 'createElement',

    // #####################
    // # Create Element
    // #####################
    value: function createElement() {
      var _this2 = this;

      if (!this.mountNode) {
        var isFragment;

        (function () {
          var _bound = _this2.bound;
          var onDisactivated = _bound.onDisactivated;
          var onActivated = _bound.onActivated;
          var onFragmentChange = _bound.onFragmentChange;
          var placeholder = _this2.props.placeholder;

          if (typeof placeholder !== 'string') {
            placeholder = '';
          }

          var node = document.createElement('multi-select');
          node.innerHTML = '\n<div class="selection"></div>\n<div class="input"><input placeholder="' + placeholder + '" data-fragment></input></div>\n<div class="selectable"></div>';

          node.querySelector('.selection').appendChild(_this2.refs.selection.createElement());
          node.querySelector('.selectable').appendChild(_this2.refs.selectable.createElement());

          node.addEventListener('mouseleave', function (evt) {
            onDisactivated();
          }, false);

          isFragment = function isFragment(target) {
            return target.dataset.fragment !== undefined;
          };

          node.addEventListener('mouseover', function (evt) {
            if (isFragment(evt.target)) {
              onActivated();
            }
          });
          node.addEventListener('keyup', function (evt) {
            if (isFragment(evt.target)) {
              onFragmentChange(evt.target.value);
            }
          });
          _this2.mountNode = node;
        })();
      }
      this.updateView();
      return this.mountNode;
    }
  }, {
    key: 'updateView',

    // #####################
    // # Update View
    // #####################
    value: function updateView() {

      var node = this.mountNode;

      var _state$get2 = this.state.get();

      var active = _state$get2.active;
      var fragment = _state$get2.fragment;

      var changed = this.state.changes();

      // selection element
      // input element
      var inputNode = node.querySelector('.input input');
      if (changed.includes(fragment)) {
        inputNode.value = fragment;
      }

      // input element
      var selectableNode = node.querySelector('.selectable');
      if (changed.includes('active')) {
        setClassName(selectableNode, 'inactive', !active);
      }

      return node;
    }
  }]);

  return MultiSelectPrivate;
})();

// #####################
// # Utilities
// #####################
function setClassName(node, name, isAdded) {
  var classList = node.classList;
  if (!isAdded && classList.contains(name)) {
    classList.remove(name);
  } else if (isAdded && !classList.contains(name)) {
    classList.add(name);
  }
}

/**
 * Public interface
 */

var MultiSelect = (function () {
  function MultiSelect(props) {
    _classCallCheck(this, MultiSelect);

    this.__private = new MultiSelectPrivate(props);
  }

  _createClass(MultiSelect, [{
    key: 'setSelectableItems',
    value: function setSelectableItems(_) {
      return this.__private.setSelectableItems(_);
    }
  }, {
    key: 'createElement',
    value: function createElement() {
      return this.__private.createElement();
    }
  }]);

  return MultiSelect;
})();
/* jshint esnext: true */

'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var RemovableItemsPrivate = (function () {
  function RemovableItemsPrivate(_ref) {
    var onChange = _ref.onChange;
    var items = _ref.items;

    _classCallCheck(this, RemovableItemsPrivate);

    this.props = { onChange: onChange };
    this.bound = {
      onRemoveItem: this.onRemoveItem.bind(this)
    };
    this.state = new StateManager(this.afterStateChange.bind(this));
    if (!Array.isArray(items)) {
      items = [];
    }
    this.state.setInitial({ items: items });
  }

  _createClass(RemovableItemsPrivate, [{
    key: 'addItem',

    // #####################
    // # Public Accessors
    // #####################
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

    // #####################
    // # Flow
    // #####################
    value: function onRemoveItem(idx) {
      var _state$get2 = this.state.get();

      var items = _state$get2.items;

      var clone = items.slice(0);clone.splice(idx, 1);
      this.state.set({ items: clone });
    }
  }, {
    key: 'afterStateChange',

    // #####################
    // # Dealing with state change
    // #####################
    value: function afterStateChange(k, v, mutated) {
      if (k === 'items' && mutated) {
        var onChange = this.props.onChange;

        onChange(v);
        this.updateView();
      }
    }
  }, {
    key: 'createElement',

    // #####################
    // # Create Element
    // #####################
    value: function createElement() {
      var _this = this;

      if (!this.mountNode) {
        (function () {
          var onRemoveItem = _this.bound.onRemoveItem;

          var node = document.createElement('removable-items');
          node.addEventListener('click', function (evt) {
            var idx = evt.target.dataset.removeidx;
            if (idx !== undefined) {
              onRemoveItem(parseInt(idx, 10));
            }
          });
          _this.mountNode = node;
        })();
      }
      this.updateView();
      return this.mountNode;
    }
  }, {
    key: 'updateView',

    // #####################
    // # Udpdate View
    // #####################

    value: function updateView() {
      var node = this.mountNode;

      var _state$get3 = this.state.get();

      var items = _state$get3.items;

      node.innerHTML = items.map(function (d, i) {
        return '<item>' + d + '<span data-removeidx="' + i + '">x</span></item>';
      }).join(' ');
      return node;
    }
  }]);

  return RemovableItemsPrivate;
})();

/**
 * Public interface
 */

var RemovableItems = (function () {
  function RemovableItems(props) {
    _classCallCheck(this, RemovableItems);

    this.__private = new RemovableItemsPrivate(props);
  }

  _createClass(RemovableItems, [{
    key: 'addItem',
    value: function addItem(item) {
      return this.__private.addItem(item);
    }
  }, {
    key: 'createElement',
    value: function createElement() {
      return this.__private.createElement();
    }
  }]);

  return RemovableItems;
})();
/* jshint esnext: true */

'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var SelectableItemsPrivate = (function () {
  function SelectableItemsPrivate(_ref) {
    var onChange = _ref.onChange;
    var items = _ref.items;

    _classCallCheck(this, SelectableItemsPrivate);

    this.bound = {
      onItemSelected: function onItemSelected(item) {
        onChange(item);
      }
    };
    this.state = new StateManager(this.afterStateChange.bind(this));
    items = Array.isArray(items) ? items.slice(0) : items = [];
    this.state.setInitial({ items: items, filterFn: function filterFn() {
        return true;
      } });
  }

  _createClass(SelectableItemsPrivate, [{
    key: 'setItems',

    // #####################
    // # Public Accessors
    // #####################
    value: function setItems(_) {
      if (!Array.isArray(_)) {
        throw new TypeError('SelectableItems.setItems expects an \'Array\' as argument ' + _);
      }
      this.state.set({ items: _ });
    }
  }, {
    key: 'setFilterFn',
    value: function setFilterFn(_) {
      if (typeof _ !== 'function') {
        throw new TypeError('SelectableItems.setFilterFn expects a \'function\' as argument');
      }
      this.state.set({ filterFn: _ });
    }
  }, {
    key: 'afterStateChange',

    // #####################
    // # Dealing with state change
    // #####################
    value: function afterStateChange(k, v, mutated) {
      if (['items', 'filterFn'].includes(k) && mutated) {
        this.updateView();
      }
    }
  }, {
    key: 'createElement',

    // #####################
    // # Create Element
    // #####################
    value: function createElement() {
      var _this = this;

      if (!this.mountNode) {
        (function () {
          var onItemSelected = _this.bound.onItemSelected;

          var node = document.createElement('selectable-items');
          node.addEventListener('click', function (evt) {
            if (evt.target.nodeName === 'ITEM') {
              onItemSelected(evt.target.innerText);
            }
          });
          _this.mountNode = node;
        })();
      }
      this.updateView();
      return this.mountNode;
    }
  }, {
    key: 'updateView',

    // #####################
    // # Update View
    // #####################
    value: function updateView() {
      var node = this.mountNode;

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

  return SelectableItemsPrivate;
})();

/**
 * Public interface
 */

var SelectableItems = (function () {
  function SelectableItems(props) {
    _classCallCheck(this, SelectableItems);

    this.__private = new SelectableItemsPrivate(props);
  }

  _createClass(SelectableItems, [{
    key: 'setItems',
    value: function setItems(_) {
      return this.__private.setItems(_);
    }
  }, {
    key: 'setFilterFn',
    value: function setFilterFn(_) {
      return this.__private.setFilterFn(_);
    }
  }, {
    key: 'createElement',
    value: function createElement() {
      return this.__private.createElement();
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

var PageNavigatorPrivate = (function () {
  function PageNavigatorPrivate(_ref) {
    var onChange = _ref.onChange;

    _classCallCheck(this, PageNavigatorPrivate);

    this.props = { onChange: onChange };
    this.bound = { onPageClick: this.onPageClick.bind(this) };
    this.state = new StateManager(this.afterStateChange.bind(this));
    this.state.setInitial({ pages: [], activeIdx: 0 });
  }

  _createClass(PageNavigatorPrivate, [{
    key: 'setPages',

    // #####################
    // # Public Accessors
    // #####################
    value: function setPages(pages, activeIdx) {
      if (!pages.includes(activeIdx)) {
        activeIdx = 0;
      }
      this.state.set({ pages: pages, activeIdx: activeIdx });
    }
  }, {
    key: 'onPageClick',

    // #####################
    // # Flow
    // #####################
    value: function onPageClick(e) {
      var onChange = this.props.onChange;

      if (typeof onChange === 'function') {
        var idx = e.target.dataset.idx;
        if (idx !== undefined) {
          idx = parseInt(idx, 10);
          this.state.set({ activeIdx: idx });
          onChange(idx);
        }
      }
    }
  }, {
    key: 'afterStateChange',

    // #####################
    // # Dealing with state change
    // #####################
    value: function afterStateChange(k, v, mutated, oldV) {
      if (['pages', 'activeIdx'].includes(k)) {
        this.updateView();
      }
    }
  }, {
    key: 'createElement',

    // #####################
    // # Create Element
    // #####################
    value: function createElement() {
      if (!this.mountNode) {
        var node = document.createElement('page-navigator');
        node.addEventListener('click', this.bound.onPageClick);
        this.mountNode = node;
      }
      this.updateView();
      return this.mountNode;
    }
  }, {
    key: 'updateView',

    // #####################
    // # Update View
    // #####################
    value: function updateView() {
      var node = this.mountNode;

      var _state$get = this.state.get();

      var pages = _state$get.pages;
      var activeIdx = _state$get.activeIdx;

      node.innerHTML = pages.length < 2 ? '' : pages.map(function (d) {
        var idx = d - 1;
        var dataActive = idx === activeIdx ? ' data-active' : '';
        return d !== '...' ? '<item data-idx=' + idx + dataActive + '>' + d + '</item>' : d;
      }).join(' ');
      return node;
    }
  }]);

  return PageNavigatorPrivate;
})();

/**
 * Public interface
 */

var PageNavigator = (function () {
  function PageNavigator(props) {
    _classCallCheck(this, PageNavigator);

    this.__private = new PageNavigatorPrivate(props);
  }

  _createClass(PageNavigator, [{
    key: 'setPages',
    value: function setPages(pages, activeIdx) {
      return this.__private.setPages(pages, activeIdx);
    }
  }, {
    key: 'createElement',
    value: function createElement() {
      return this.__private.createElement();
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
  var queryString = /\?[a-zA-Z0-9\=\&\%\$\-\_\.\+\!\*\'\(\)\,\:\;]+/.exec(url); //valid chars according to: http://www.ietf.org/rfc/rfc1738.txt
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
      var _this2 = this;

      if (typeof obj !== 'object') {
        throw new TypeError('StateManager.set expects an object as parameter');
      }
      this.state = Object.assign(this.state, obj);
      var keys = Object.keys(obj);
      keys.forEach(function (k) {
        _this2.changed.add(k);
      });
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
// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
// requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel
// MIT license

'use strict';

(function () {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function (callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function () {
                callback(currTime + timeToCall);
            }, timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
    }

    if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function (id) {
            clearTimeout(id);
        };
    }
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
