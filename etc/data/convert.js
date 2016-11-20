#!/usr/bin/env babel-node

/* jshint esnext: true */

'use strict';

var path = require('path');
var fs = require('fs');
var through = require('through');
var split = require('split');

function pfx(str) { return function(d) { return   str + ":" + d; }; }

var allTags = [];
allTags = allTags.concat('cartesian,polar,iso,ternary,3d,geo,constrained,generative'.split(',').map(pfx('coord')));
allTags = allTags.concat('category,correlation,density,hierarchy,relationship,spread,summary'.split(',').map(pfx('info')));
allTags = allTags.concat('delete,thumb-missing,broken'.split(','));
allTags = allTags.concat('preview,thumbnail'.split(',').map(pfx('r')));

// plants
var allTerms = [];
allTerms = allTerms.concat('map,treemap,chord,gant,force-directed,cartogram,diagram,drawing,wire-diagram,arc-diagram,dendrogram'.split(',').map(pfx('lay')));
allTerms = allTerms.concat('sunburst,word-cloud,parallel-coord,cartogram,bullet,violin,steamgraph,scatterplot,sankey,radar,hive,hemicycle'.split(',').map(pfx('lay')));
allTerms = allTerms.concat('pie,donut,histogram,contour-line,matix,table,fishbone,tree,choropleth,quadtree,gauge,slider,map,slope,swim-lane'.split(',').map(pfx('lay')));
allTerms = allTerms.concat('matrix'.split(',').map(pfx('lay')));
allTerms = allTerms.concat('bar,area,dot,square,line,hex,triangle,visual-vibration,lollipop,flower,blob'.split(',').map(pfx('gshape')));
allTerms = allTerms.concat('time,color,alpha,size,heatmap,symbol,heightmap,texture,chernoff'.split(',').map(pfx('gscale')));
allTerms = allTerms.concat('legend,scale,axis,guide,tooltip,label'.split(',').map(pfx('geom')));
allTerms = allTerms.concat('dashboard,lattice,panel,stacked,linked,bounded,multi-foci,small-multiples,calendar,partition,grid'.split(',').map(pfx('gp'))); // calendar -> lay
allTerms = allTerms.concat('kmeans,centrality,betweeness,cluster,intersect,enclose,hull-convex,hull-concave,binning,packing,gosper,voronoi,map-projection,interpolate,nest'.split(',').map(pfx('algo')));
allTerms = allTerms.concat('img-processing,nearest-neighbour,delaunay,kernel-density,superformula,bundle,tesselation,hilbert,ulam,wilson,prim,random-walk,monte-carlo'.split(',').map(pfx('algo')));
allTerms = allTerms.concat('similarity,hull'.split(',').map(pfx('algo')));
allTerms = allTerms.concat('real-time,asynchronous'.split(',').map(pfx('flow')));
allTerms = allTerms.concat('micro'.split(',').map(pfx('size')));
allTerms = allTerms.concat('gh,gist,codepen,tributary'.split(',').map(pfx('src')));
allTerms = allTerms.concat('R,d3,ember,webgl,svg,angular,ng,react,gmap,backbone,webgl,canvas'.split(',').map(pfx('lg')));
allTerms = allTerms.concat('carto,mapbox,leaflet,gmap,turf,openstreetmap'.split(',').map(pfx('sv')));
allTerms = allTerms.concat('csv,json,geojson,gexf,sparse-matrix,topojson,xml,tsv'.split(',').map(pfx('std')));
allTerms = allTerms.concat('editor,plugin,library,tuto'.split(',').map(pfx('fn')));
allTerms = allTerms.concat('sport,social,food'.split(',').map(pfx('s')));
allTerms = allTerms.concat('elections,migration,garden,illusion,driving,employment,chemistry'.split(',').map(pfx('s')));
allTerms = allTerms.concat('aus,nzl,usa'.split(',').map(pfx('country')));
allTerms = allTerms.concat('sketchy'.split(',').map(pfx('style')));
allTerms = allTerms.concat('brush,drag,pan,zoom,resizeable,collapsible,fisheye,highlight'.split(',').map(pfx('deco')));
allTerms = allTerms.concat('animate,sedimentation,gooey'.split(',').map(pfx('fx')));
allTerms = allTerms.concat('D3 js in Action,Scott Murray'.split(',').map(pfx('bk')));


var tsvStream = fs.createWriteStream('vs-assets.tsv')
fs.createReadStream('vs-assets.nedb', {objectMode: true})
    .pipe(split())
    .pipe(through(function(line) {
      var strm = this;
      if(!line || !line.length) { return; }
      var {p,tags,terms,src} = JSON.parse(line);
      var others = [];
      tags = tags.reduce((acc, d, i) => {
        if(allTags.includes(d)) {
          acc.push(d);
        } else {
          others.push(d);
        }
        return acc;
      }, []);
      terms = terms.reduce((acc, d, i) => {
        if(allTerms.includes(d)) {
          if(!['src:gist'].includes(d)) { 
            acc.push(d);
          }  
        } else {
          if((d || '').indexOf(':') !== -1) { 
            console.log(d);
            d = d.replace(/^s:/, '');
          }
            others.push(d);
        }
        return acc;
      }, []);
      var short = src.replace('http://bl.ocks.org/', '');
      var fmt = '';
      if(p.includes('snapshot')) { fmt = 's'; }
      if(p.includes('thumbnail.png')) { 
        fmt = 'gtb:' + p.replace('https://gist.githubusercontent.com/', '').replace(short, '').replace('/raw/','').replace('/thumbnail.png',''); 
        console.log(fmt)
       }
      strm.queue([short, fmt,tags.join(';'),terms.join(';'),others.join(';')].join('\t') + '\n')
    }))
    .pipe(tsvStream);


