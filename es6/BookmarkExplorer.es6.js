/* jshint esnext: true */


class BookmarkExplorerPrivate {

  constructor({itemsPerPage, paginationDelta, tags, terms, nopic}) {
    if(!Array.isArray(tags)) { tags = []; }
    if(!Array.isArray(terms)) { terms = []; }
    this.props = Object.assign({itemsPerPage, paginationDelta}, { itemsPerPage : 48, paginationDelta: 4 });
    this.debounced = {
      queryDb : new Debouncer(100, () => { this.queryDb(); })
    };

    this.state = new StateManager(this.afterStateChange.bind(this));
    this.state.setInitial({db: [], allTags: [], allTerms: [], nopic, queried: [], tags, terms, activePage: 0, pageQty: 0, firstIdx: 0 });
    var importer = new BookmarksImporter();
    importer.load('etc/data/vs-assets.tsv', ({db, tags: aTags, terms: aTerms}) => {
      this.state.set({db, allTags: aTags, allTerms: aTerms});
    });

    this.refs = {
      tagSelect : new MultiSelect({
        placeholder: 'tags',
        onChange: (tags) => { this.state.set({tags}); },
        selectedItems: tags
      }),
      termSelect: new MultiSelect({
        placeholder: 'terms',
        onChange: (terms) => { this.state.set({terms}); },
        selectedItems: terms
      }),
      itemList  : new ItemList({
        ItemRenderer: BookmarkItem
      }),
      pageNavigator: new PageNavigator({
        onChange: (pageIdx) => { this.state.set({activePage: pageIdx}); }
      })
    };
  }

  // #####################
  // # Dealing with state change
  // #####################
  afterStateChange(k, v, oldV) {
    if(['db','tags','terms'].includes(k)) {
      this.debounced.queryDb.trigger();
    }

    if(k == 'allTags') {
      this.refs.tagSelect.setSelectableItems(v);
    }
    if(k == 'allTerms') {
      this.refs.termSelect.setSelectableItems(v);
    }
    if(k == 'queried') {
      const {itemsPerPage} = this.props;
      var pageQty = Math.ceil(v.length / itemsPerPage);
      this.state.set({pageQty, activePage: 0});
    }

    if(['queried','firstIdx'].includes(k)) {
      const {itemsPerPage} = this.props;
      let {db, firstIdx, queried} = this.state.get();
      let items = queried.slice(firstIdx, firstIdx + itemsPerPage).map((i) => {
        return db[i];
      });
      this.state.set({items});
    }

    if(k === 'items') {
      this.refs.itemList.setItems(v);
      this.updateView();
    }

    if(['activePage','pageQty'].includes(k)) {
      const {itemsPerPage, paginationDelta} = this.props;
      const {pageNavigator} = this.refs;
      const {activePage, pageQty} = this.state.get();
      var pages = paginationAlgorithm(activePage, pageQty, paginationDelta);
      pageNavigator.setPages(pages, activePage);
      this.state.set({firstIdx: itemsPerPage * activePage});
    }

    return v;
  }

  // #####################
  // # Main
  // #####################
  queryDb() {
    const {db, tags: sTags, terms: sTerms, nopic} = this.state.get();
    var options = {};
    // get options
    var hasTags  = (sTags  && Array.isArray(sTags)  && sTags.length > 0);
    var hasTerms = (sTerms && Array.isArray(sTerms) && sTerms.length > 0);
    var searchFn;
    if (hasTags || hasTerms) {
      searchFn = (d) => {
        var {tags, terms} = d;
        var isIn = true;
        if (nopic === "true") { return !d.fmt }
        if (hasTags  && !Haystack.allOf(tags, sTags))   { isIn = false; }
        if (hasTerms && !Haystack.allOf(terms, sTerms)) { isIn = false; }
        return isIn;
      };
    }
    // search
    var queried = [];
    if(searchFn === undefined) {
      queried = Object.keys(db);
    } else {
      for(let i = 0, ni = db.length; i < ni; i++) {
        if(searchFn === undefined || searchFn(db[i])) { queried.push(i); }
      }
    }
    this.state.set({queried});
  }

  // #####################
  // # Create Element
  // #####################
  createElement() {
    if(!this.mountNode) {
      const {itemList, pageNavigator, tagSelect, termSelect} = this.refs;
      let node = document.createElement('bookmark-explorer');
      node.innerHTML = `
<div class="query-options">
	<div class="tags"> </div>
	<div class="terms"> </div>
</div>
<div class="item-list"></div>
<div class="pageNavigator"></div>`;
      node.querySelector('.query-options .tags').appendChild(tagSelect.createElement());
      node.querySelector('.query-options .terms').appendChild(termSelect.createElement());
      node.querySelector('.item-list').appendChild(itemList.createElement());
      node.querySelector('.pageNavigator').appendChild(pageNavigator.createElement());
      this.mountNode = node;
    }
    this.updateView();
    return this.mountNode;
  }

  // #####################
  // # Update View
  // #####################
  updateView() {
    /* Nothing to do */
  }

}

/**
 * Public interface
 */
class BookmarkExplorer {
  constructor(props) { this.__private = new BookmarkExplorerPrivate(props); }
  createElement() { return this.__private.createElement(); }
}
