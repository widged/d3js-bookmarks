/* jshint esnext: true */

class PageNavigator {

  constructor({onChange}) {
    this.props = {onChange};
    this.bound = { onPageClick : this.onPageClick.bind(this) };
    this.state = new StateManager(this.afterStateChange.bind(this));
    this.state.setInitial({pages: [], activeIdx: 0});
  }

  afterStateChange(k, v, mutated, oldV) {
    if(k === 'pages') {
      this.updateView();
    }
  }

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

  setPages(pages, activeIdx)  { this.state.set({pages, activeIdx}); }

  createElement() {
    if(!this.mountNode) {
      var node = document.createElement('page-navigator');
      node.addEventListener('click', this.bound.onPageClick);
      this.mountNode = node;
    }
    this.updateView();
    return this.mountNode;
  }

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
