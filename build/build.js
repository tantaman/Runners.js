/*
>This file pulled from three.js<
https://github.com/mrdoob/three.js/blob/master/utils/build.js

The MIT License

Copyright (c) 2010-2012 three.js authors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

var fs = require("fs");
var path = require("path");
var argparse =  require( "argparse" );
var uglify = require("uglify-js2");
var spawn = require('child_process').spawn;

function main(){
    "use strict";
    var parser = new argparse.ArgumentParser();
    parser.addArgument(['--include'], {"action":'append', 'defaultValue':[]});
    parser.addArgument(['--externs'], {"action":'append', "defaultValue":['./externs/common.js']});
    parser.addArgument(['--minify'], {"action":'storeTrue', "defaultValue":false});
    parser.addArgument(['--output'], {"defaultValue":'../dist/Runners.js'});  
    parser.addArgument(['--sourcemaps'], {"action":'storeTrue', "defaultValue":false});
    
    
	var args = parser.parseArgs();
    
    var output = args.output;
    console.log(' * Building ' + output);
    
    var sourcemap,sourcemapping,sourcemapargs;
    if (args.sourcemaps){
		sourcemap = output + '.map';
    	sourcemapping = '\n//@ sourceMappingURL=' + sourcemap;
	}else{
		sourcemap = sourcemapping = sourcemapargs = '';
	}
    
    var buffer = [];
    var sources = [];
    for (var i = 0;i < args.include.length;i++){
        
        var files = JSON.parse(fs.readFileSync('./includes/' + args.include[i] + '.json', 'utf8'));
        for (var file = 0;file < files.length;file++){
    		sources.push(files[file]);
            buffer.push(fs.readFileSync(files[file], 'utf8'));
        }
    }
    console.log(buffer.length);

    var temp = buffer.join("\n");
    
    var header = ";(function(window) {'use strict';var Runners = {};var Workers = {};";
    var footer = "}(this));";

    if (!args.minify){
        fs.writeFileSync(output, header + temp + footer,'utf8');
    } else {
        var result = uglify.minify(sources, {
            outSourceMap: sourcemap
        });
        
        
        fs.writeFileSync(output, header + result.code + footer + sourcemapping,'utf8');
        

        if (args.sourcemaps){
            fs.writeFileSync(sourcemap,result.map,'utf8');
        }
    
    }
}
main();