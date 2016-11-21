/* jshint esnext: true */

const ITEMS_PER_PAGE = 50, PAGINATION_DELTA = 4;

class BookmarkExplorer {

  constructor() {

    this.debounced = {
      queryDb : new Debouncer(100, () => { this.queryDb(); })
    };

    this.refs = {
      itemList  : new ItemList(),
      pageNavigator: new PageNavigator({onChange: (pageIdx) => { this.state.set({activePage: pageIdx}); }}),
      tagSelect : new MultiSelect({placeholder: 'tags', onChange: (tags) => { this.state.set({tags}); }}),
      termSelect: new MultiSelect({placeholder: 'terms', onChange: (terms) => { this.state.set({terms}); }})
    };

    this.state = new StateManager(this.afterStateChange.bind(this));
    this.state.setInitial({db: [], allTags: [], allTerms: [], queried: [], tags: [], terms: [], activePage: 0, pageQty: 0, firstIdx: 0 });

    var importer = new BookmarksImporter();
    importer.load('etc/data/vs-assets.tsv', ({db, tags, terms}) => {
      this.state.set({db, allTags: tags, allTerms: terms});
    });

  }

  afterStateChange(k, v, oldV) {
    if(['db','tags','terms'].includes(k)) {
      this.debounced.queryDb.trigger();
    }

    if(k == 'allTags') { this.refs.tagSelect.setSelectableItems(v); }
    if(k == 'allTerms') { this.refs.termSelect.setSelectableItems(v); }
    if(k == 'queried') {
      var pageQty = Math.ceil(v.length / ITEMS_PER_PAGE);
      this.state.set({pageQty, activePage: 0});
    }

    if(['queried','firstIdx'].includes(k)) {
      let {db, firstIdx, queried} = this.state.get();
      let items = queried.slice(firstIdx, firstIdx + ITEMS_PER_PAGE).map((i) => {
        return db[i];
      });
      this.state.set({items});
    }

    if(k === 'items') {
      this.refs.itemList.setItems(v);
      this.render();
    }

    if(['activePage','pageQty'].includes(k)) {
      const {pageNavigator} = this.refs;
      const {activePage, pageQty} = this.state.get();
      var pages = paginationAlgorithm(activePage, pageQty, PAGINATION_DELTA);
      pageNavigator.setPages(pages);
      this.state.set({firstIdx: ITEMS_PER_PAGE * activePage});
    }

    return v;
  }

  queryDb() {
    const {db, tags: sTags, terms: sTerms} = this.state.get();
    var options = {};
    // get options
    var hasTags  = (sTags  && Array.isArray(sTags)  && sTags.length > 0);
    var hasTerms = (sTerms && Array.isArray(sTerms) && sTerms.length > 0);
    var searchFn;
    if (hasTags || hasTerms) {
      searchFn = (d) => {
        var {tags, terms} = d;
        var isIn = true;
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


  render() {

    if(!this.node) {
        this.node = document.createElement('bookmark-explorer');
        let node = this.node;
        node.innerHTML = `
            <div class="query-options">
      				<div class="tags"> </div>
      				<div class="terms"> </div>
      			</div>
            <div class="item-list"></div>
            <div class="pageNavigator"></div>
        `;
    }

    let node = this.node;
    const {itemList, pageNavigator, tagSelect, termSelect} = this.refs;
    mount(node.querySelector('.item-list'), itemList.render());
    mount(node.querySelector('.pageNavigator'), pageNavigator.render());
    mount(node.querySelector('.query-options .tags'), tagSelect.render());
    mount(node.querySelector('.query-options .terms'), termSelect.render());
    return node;
  }


}

function mount(node, component) {
  node.innerHTML = '';
  node.appendChild(component);

}
