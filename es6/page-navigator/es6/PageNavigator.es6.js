/* jshint esnext: true */

class PageNavigator {

  constructor({onChange}) {
    this.props = {onChange};
    this.bound = { onPageClick : this.onPageClick.bind(this) };
    this.state = new StateManager(this.afterStateChange.bind(this));
    this.state.setInitial({pages: []});
  }

  afterStateChange(k, v, mutated, oldV) {
    if(k === 'pages') { this.render(); }
  }

  onPageClick(e) {
    const {onChange} = this.props;
    if(typeof onChange === 'function') {
      var idx = e.target.dataset.idx;
      if(idx !== undefined) { onChange(parseInt(idx, 10)); }
    }
  }

  setPages(_)  { this.state.set({pages: _}); }

  render() {
    if(!this.node) {
      this.node = document.createElement('page-navigator');
      this.node.addEventListener('click', this.bound.onPageClick);
    }
    let node = this.node;
    let {pages} = this.state.get();
    node.innerHTML = pages.length < 2 ? '' : pages.map((d) => {
      return (d !== '...') ? `<item data-idx=${d-1}>${d}</item>` : d;
    }).join(' ');
    return node;
  }


}
