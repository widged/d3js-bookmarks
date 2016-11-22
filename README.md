# d3js-bookmarks

To help browse/edit bookmarks in different area, I wrote an electron app, backed with a [nedb](https://github.com/louischatriot/nedb) format.

In this repo, I share any d3js related bookmark that points to some online resource (I have removed any bookmarks that points to my file system). Data have been converted to a `tsv` format, to reduce file size.

An explorer app is provided - https://widged.github.io/d3js-bookmarks/app.html

![app preview](preview.png "Bookmarks Explorer Preview")

I gave a shot to coding with es6 without dependencies, without the need to transpile or hot reload during development. The only dependency is `babel-cli` to convert es6 code to es5 to support older browsers. (The latest versions of Chrome and Safari can run the [es6 code](https://widged.github.io/d3js-bookmarks/app-dev.html), without any pre- or post-processing).
