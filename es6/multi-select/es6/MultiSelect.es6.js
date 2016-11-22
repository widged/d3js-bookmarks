/* jshint esnext: true */

class MultiSelect {

  constructor({placeholder, onChange, selectedItems}) {
    this.props = {placeholder, onChange};
    this.debounced = {
      updateFilter: new Debouncer(50, this.updateFilter.bind(this))
    };
    this.bound = {
      onActivated     : this.onActivated.bind(this),
      onDisactivated  : this.onDisactivated.bind(this),
      onFragmentChange: this.onFragmentChange.bind(this)
    };
    this.comps = {
      removable:  new RemovableItems({onChange: this.onRemovedChange.bind(this)}),
      selectable: new SelectableItems({onChange: this.onItemAdded.bind(this)})
    };

    this.state = new StateManager(this.afterStateChange.bind(this));
    if(!Array.isArray(selectedItems)) { selectedItems = []; }
    selectedItems.forEach((d) => {
      this.comps.removable.addItem(d);
    });
    this.state.setInitial({fragment: '', selectedItems, active: false});

  }

  setSelectableItems(_) {
    const {selectable} = this.comps;
    selectable.setItems(_);
  }



  afterStateChange(k, v, mutated) {
    if(k === 'active' && mutated) {
      this.render();
    }

    if(['fragment','selectedItems'].includes(k)) {
      this.debounced.updateFilter.trigger();
      this.render();
    }

    if(['selectedItems'].includes(k)) {
      let {onChange}  = this.props;
      onChange(this.state.get().selectedItems);
    }


  }

  onDisactivated()      { this.state.set({active: false}); }
  onActivated()         { this.state.set({active: true}); }
  onFragmentChange(str) { this.state.set({fragment: str}); }

  onItemAdded(item) {
    let {removable, input} = this.comps;
    this.state.set({fragment: ''});
    removable.addItem(item);
  }

  onRemovedChange(items) {
    let {removable, selectable} = this.comps;
    let {fragment} = this.state.get();
    this.state.set({selectedItems: items});
  }

  dispatchChange() {
    let {onChange} = this.props;
    onChange(items);
  }

  updateFilter() {
    let {selectable} = this.comps;
    let {fragment, selectedItems} = this.state.get();
    selectable.setFilterFn((d) => {
      var included = false;
      var noFragment = (typeof fragment !== "string") || (fragment.length === 0);
      if(noFragment || (d.indexOf(fragment) !== -1)) { included = true; }
      var itemsIsArray = (Array.isArray(selectedItems)) ? true : false;
      if(itemsIsArray && selectedItems.includes(d)) { included = false; }
      return included;
    });
  }


  render() {
    let {placeholder} = this.props;
    const {onDisactivated, onActivated, onFragmentChange} = this.bound;
    if(!this.node) {
      this.node = document.createElement('multi-select');
      let node = this.node;
      if(typeof placeholder !== 'string') { placeholder = ''; }
      node.innerHTML = `
  <div class="removable"></div>
  <div class="input"><input placeholder="${placeholder}" data-fragment></input></div>
  <div class="selectable"></div>
  `;

      node.addEventListener('mouseleave', (evt) => { onDisactivated(); }, false);
      node.addEventListener('click', (evt) => {
        var d = evt.target.dataset.fragment;
        if(d !== undefined) { onActivated(); }
      });
      node.addEventListener('keyup', (evt) => {
        var d = evt.target.dataset.fragment;
        if(d !== undefined) { onFragmentChange(evt.target.value); }
      });
    }
    let node = this.node;

    let {active, fragment} = this.state.get();
    var changed = this.state.changes();
    let {selectable, removable} = this.comps;
    node.querySelector('.selectable').innerHTML = ''; node.querySelector('.selectable').appendChild(selectable.render());
    node.querySelector('.removable').innerHTML = ''; node.querySelector('.removable').appendChild(removable.render());
    node.querySelector('.input input').value = fragment;
    setClassName(node.querySelector('.selectable').classList, 'inactive', !active);
    return node;
  }

}

function setClassName(classList, name, isAdded) {
  if (!isAdded && classList.contains(name)) {
    classList.remove(name);
  } else if(isAdded && !classList.contains(name)) {
    classList.add(name);
  }
}
