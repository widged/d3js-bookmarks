# d3js-bookmarks

To help browse/edit bookmarks in different area, I wrote an electron app, backed with a [nedb](https://github.com/louischatriot/nedb) format.

In this repo, I share any d3js related bookmark that points to some online resource. Data have been converted to a tsv format, to reduce file size.

An explorer app is provided - https://widged.github.io/d3js-bookmarks/app.html

I am using it to experiment with coding with es6 without dependencies, without the need to transpile or hot reload during development. The only dependency is `babel-cli` to convert es6 code to es5 to support older browsers.
