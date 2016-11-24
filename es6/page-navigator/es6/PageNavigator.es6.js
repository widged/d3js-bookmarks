/* jshint esnext: true */




class PageNavigatorPrivate {

  constructor({onChange}) {
    this.props = {onChange};
    this.bound = { onPageClick : this.onPageClick.bind(this) };
    this.state = new StateManager(this.afterStateChange.bind(this));
    this.state.setInitial({pages: [], activeIdx: 0});
  }

  // --------------------
  // Public Accessors
  // --------------------
  setPages(pages, activeIdx)  {
    if(!pages.includes(activeIdx)) { activeIdx = 0; }
    this.state.set({pages, activeIdx});
  }

  // --------------------
  // Flow
  // --------------------
  onPageClick(e) {
    const {onChange} = this.props;
    if(typeof onChange === 'function') {
      var idx = e.target.dataset.idx;
      if(idx !== undefined) {
        idx = parseInt(idx, 10);
        this.state.set({activeIdx: idx});
        onChange(idx);
      }
    }
  }

  // --------------------
  // Dealing with state change
  // --------------------
  afterStateChange(k, v, mutated, oldV) {
    if(['pages','activeIdx'].includes(k)) {
      this.updateView();
    }
  }


  // --------------------
  // Create Element
  // --------------------
  createElement() {
    if(!this.mountNode) {
      var node = document.createElement('page-navigator');
      node.addEventListener('click', this.bound.onPageClick);
      this.mountNode = node;
    }
    this.updateView();
    return this.mountNode;
  }

  // --------------------
  // Update View
  // --------------------
  updateView() {
    let node = this.mountNode;
    let {pages, activeIdx} = this.state.get();
    node.innerHTML = pages.length < 2 ? '' : pages.map((d) => {
      var idx = d-1;
      var dataActive = (idx === activeIdx) ? ' data-active' : '';
      return (d !== '...') ? `<item data-idx=${idx}${dataActive}>${d}</item>` : d;
    }).join(' ');
    return node;
  }
}

/**
 * Public interface
 */
class PageNavigator {
  constructor(props) { this.__private = new PageNavigatorPrivate(props); }
  setPages(pages, activeIdx)  { return this.__private.setPages(pages, activeIdx); }
  createElement() { return this.__private.createElement(); }
}
