/* jshint esnext: true */

class SelectableItems {
  constructor(items, onSelected) {
    var node = document.createElement('selectable-items');
    node.addEventListener('click', (evt) => {
      if(evt.target.nodeName === 'ITEM') {
        onSelected(evt.target.innerText);
        this.setVisible(false);
      }
    });
    this.state = {items, node, fragment: undefined, values: []};
  }

  hide() { this.setVisible(false); }
  show() { this.setVisible(true); }
  setVisible(visible) {
    let {node} = this.state;
    if(visible !== undefined) { node.style.display = visible ? 'block' : 'none' ; }
    if(visible === true) { this.update(); }
  }

  filterInFragment(fragment) {
    var noFragment = (typeof fragment !== "string") || (fragment.length === 0);
    return function(d, i) {
      return noFragment || (d.indexOf(fragment) !== -1);
    };
  }
  filterOutValues(values) {
    var valuesIsArray = (Array.isArray(values)) ? true : false;
    return function(d, i) {
      return valuesIsArray && !values.includes(d);
    };
  }

  deselect(values) {
    if(this.state.values.join(',') !== values.join(',')) {
      this.state.values = values.slice();
      this.update();
    }
  }

  update() {
    let {node, items, fragment, values} = this.state;
    var activeOptions = items.filter(this.filterInFragment(fragment)).filter(this.filterOutValues(values));
    node.innerHTML = activeOptions.map((d) => { return `<item>${d}</item>`; }).join(' ');
  }


  fragment(str) {
    if(this.state.fragment !== str) {
      this.state.fragment = str;
      this.update();
    }
  }

  render() {

  }
  node() {
    return this.state.node;
  }
}
