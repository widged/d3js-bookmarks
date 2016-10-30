/* jshint esnext: true */

import React from 'react';

import {DemoDeployer,StyleInjector} from '../../imports-deploy.js';

function usage(demo) {
	var App  = require('../AssetExplorer.es6.react.js').default;

	StyleInjector.link([
		"../../component/item-paging/style/item-paging.css",
		"../style/react-select.css",
		"../style/asset-explorer.css",
		"../style/select-tag-to-add.css",
		"../../lib/multi-select/style/tags-input.css",
		"../../lib/multi-select/style/removable-tag.css",
		"./etc/style/freepik.css",
	]);

	function pfx(str) { return function(d) { return   str + ":" + d; }; }

	let listTags = [];
	listTags = listTags.concat('cartesian,polar,iso,ternary,3d,geo,constrained,generative'.split(',').map(pfx('coord')));
	listTags = listTags.concat('category,correlation,density,hierarchy,relationship,spread,summary'.split(',').map(pfx('info')));
	listTags = listTags.concat('delete,thumb-missing,broken'.split(','));

	// plants
	let listTerms = [];
	listTags = listTags.concat('preview,thumbnail'.split(',').map(pfx('r')));
	listTerms = listTerms.concat('map,treemap,chord,gant,force-directed,cartogram,diagram,drawing,wire-diagram,arc-diagram,dendrogram'.split(',').map(pfx('lay')));
	listTerms = listTerms.concat('sunburst,word-cloud,parallel-coord,cartogram,bullet,violin,steamgraph,scatterplot,sankey,radar,hive,hemicycle'.split(',').map(pfx('lay')));
	listTerms = listTerms.concat('pie,donut,histogram,contour-line,matix,table,fishbone,tree,choropleth,quadtree,gauge,slider,map,slope,swim-lane'.split(',').map(pfx('lay')));
	listTerms = listTerms.concat('bar,area,dot,square,line,hex,triangle,visual-vibration,lollipop,flower,blob'.split(',').map(pfx('gshape')));
	listTerms = listTerms.concat('time,color,alpha,size,heatmap,symbol,heightmap,texture,chernoff'.split(',').map(pfx('gscale')));
	listTerms = listTerms.concat('legend,scale,axis,guide,tooltip,label'.split(',').map(pfx('geom')));
	listTerms = listTerms.concat('dashboard,lattice,panel,stacked,linked,bounded,multi-foci,small-multiples,calendar,partition,grid'.split(',').map(pfx('gp')));
	listTerms = listTerms.concat('kmeans,centrality,betweeness,cluster,intersect,enclose,hull-convex,hull-concave,binning,packing,gosper,voronoi,map-projection,interpolate'.split(',').map(pfx('algo')));
	listTerms = listTerms.concat('img-processing,nearest-neighbour,delaunay,kernel-density,superformula,bundle,tesselation,hilbert,ulam,wilson,prim,random-walk,monte-carlo'.split(',').map(pfx('algo')));
	listTerms = listTerms.concat('real-time,asynchronous'.split(',').map(pfx('flow')));
	listTerms = listTerms.concat('micro'.split(',').map(pfx('size')));
	listTerms = listTerms.concat('gh,gist,codepen,tributary'.split(',').map(pfx('src')));
	listTerms = listTerms.concat('R,d3,ember,webgl,svg,angular,react,gmap,backbone,webgl'.split(',').map(pfx('lg')));
	listTerms = listTerms.concat('carto,mapbox,leaflet,gmap,turf,openstreetmap'.split(',').map(pfx('sv')));
	listTerms = listTerms.concat('csv,json,geojson,gexf,sparse-matrix,topojson,xml,tsv'.split(',').map(pfx('std')));
	listTerms = listTerms.concat('editor,plugin,library,tuto'.split(',').map(pfx('fn')));
	listTerms = listTerms.concat('sport,social,food'.split(',').map(pfx('s')));
	listTerms = listTerms.concat('aus,nzl,usa'.split(',').map(pfx('country')));
	listTerms = listTerms.concat('sketchy'.split(',').map(pfx('style')));
	listTerms = listTerms.concat('brush,drag,pan,zoom,resizeable,collapsible,fisheye,highlight'.split(',').map(pfx('deco')));
	listTerms = listTerms.concat('animate,sedimentation,gooey'.split(',').map(pfx('fx')));


	return React.createElement(App, {
			db: 'etc/data/vs-assets.db',
			config: {
				appPath: "/Users/marielle/Documents/Code/js/garden/asset-explorer/layout-vis/",
				assetPath: "/Users/marielle/Documents/Daily/l-javascript/_ ui-layout-vis/",
				itemsPerPage: 200
			},
			listTerms, listTags,
			tagsToFilter:  [],
			termsToFilter: []});
}

DemoDeployer.interactive({ title: 'ImageTags'}, DemoDeployer.reactRender(usage));
