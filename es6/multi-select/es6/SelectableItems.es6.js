/* jshint esnext: true */

class SelectableItems {

  constructor({onChange}) {
    this.bound = {
      onItemSelected: (item) => { onChange(item); }
    };
    this.state = new StateManager(this.afterStateChange.bind(this));
    this.state.setInitial({ items: [], filterFn: () => { return true; } });
  }

  afterStateChange(k, v, mutated) {
    if(k === 'items' && mutated) {
      this.render();
    }
    if(k === 'filterFn' && mutated) {
      this.render();
    }
  }

  setItems(_)    { this.state.set({items: _.slice(0) }); }
  setFilterFn(_) { this.state.set({filterFn: _}); }

  render() {
    if(!this.node) {
      let {onItemSelected} = this.bound;
      this.node = document.createElement('selectable-items');
      this.node.addEventListener('click', (evt) => {
        if(evt.target.nodeName === 'ITEM') { onItemSelected(evt.target.innerText); }
      });
    }
    var node = this.node;
    let {items, filterFn} = this.state.get();
    var activeOptions = items.filter(filterFn);
    node.innerHTML = activeOptions.map((d) => { return `<item>${d}</item>`; }).join(' ');
    return node;
  }
}
