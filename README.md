# d3js-bookmarks

To help browse/edit bookmarks in different area, I wrote an electron app, backed with a [nedb](https://github.com/louischatriot/nedb) format.

In this repo, I share any d3js related bookmark that points to some online resource. Data have been converted to a tsv format, to reduce file size. All bookmarks are annotated with an ontology inspired by the grammar of graphic. That ontology captures information about:
* the information type (i.e, relationship, hierarchy, etc.), 
* the coordinate system (i.e., cartesian, polar, isometric, 3D, geographic, etc.), 
* the type of layout (chord, treemap, pie, donut, etc.), 
* the geom shape (i.e., area, square, triangle, etc.)

An explorer app is provided - https://widged.github.io/d3js-bookmarks/app.html

I am using it to experiment with coding es6 without dependencies, without the need to transpile and hot reload during development. The only dependency is `babel-cli` to convert es6 code to es5 to support older browsers. 

