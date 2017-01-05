var path = require('path');
var fs = require('fs');
var async = require('async');
var tabChar = '    ';

function SvgInlineNgPlugin(options) {
    if (typeof options !== "object") {
        options = {};
    }
    this.options = options;
}

function headerHtml() {
    var html = `/*\n` +
        `This is a generated file, do NOT edit it (your changes will be overwritten).\n` +
        `To change the contents of the file, add a .svg file to the svgDir (e.g. public/images/svg) then restart webpack.\n\n` +
        `## Usage:\n` +
        `1. Optimize SVG with SVGO\n` +
        `${tabChar}1. Typically, make sure the viewbox is a square (height same as width, with icon centered).\n` +
        `${tabChar}2. https://jakearchibald.github.io/svgomg/\n` +
        `${tabChar}3. REMOVE any height & width attributes on the svg. Optionally add 'width="100%"' instead.\n` +
        `${tabChar}4. Use / add explicit close tags, e.g. '<path></path>' instead of '<path />'.\n` +
        `${tabChar}5. Remove any 'fill' or other styling you want to use css for.\n` +
        `2. Save your .svg files in a directory for this plugin to inline the svg code:\n` +
        `${tabChar}1. find and replace regex '\\n' with '' to remove new lines\n` +
        `3. the SVG will be responsive and resize based on the element dimensions; use CSS as normal to set width / height\n` +
        `*/\n\n` +
        `export class SvgInlineNgPluginService {\n` +
        `${tabChar}svgs: any = {\n`;
    return html;
}

function footerHtml() {
    var html = `${tabChar}};\n\n` +
        `}`;
    return html;
}

function sort2d(array1, key, order1) {
    var order = order1 || 'ascending';
    return array1.sort(function(a, b) {
        if (a[key] === b[key]) {
            return 0;
        }
        if ((a[key] > b[key] && order === 'ascending') ||
         (a[key] < b[key] && order === 'descending')) {
            return 1;
        }
        return -1;
    });
}

function readFiles(dirname, callback) {
    var svgHtmlPieces = [];
    fs.readdir(dirname, function(err, filenames) {
        if (err) {
          callback(err);
        }

        var svgName;
        var svgContent;
        var htmlPiece;
        var html = ``;
        var ii;
        async.each(filenames, function(filename, callback) {
            fs.readFile(dirname + '/' + filename, 'utf-8', function(err, content) {
                if (err) {
                    console.error('err: ', err);
                    callback(err);
                } else {
                    if (filename.indexOf('.svg') > -1) {
                        // TODO - check for valid characters in file name? E.g. no spaces.
                        svgName = filename.slice(0, filename.lastIndexOf('.'));
                        svgContent = content.replace(/\n/g, '');
                        // Just save for now as we want to sort to ensure the SAME order each time.
                        htmlPiece = `${tabChar}${tabChar}'${svgName}': {\n` +
                            `${tabChar}${tabChar}${tabChar}html: '${svgContent}'\n` +
                            `${tabChar}${tabChar}},\n`;
                        svgHtmlPieces.push({ filename: filename, html: htmlPiece });
                    }
                    callback(false);
                }
              });
        }, function(err, results) {
            // NOW sort then concat html. Otherwise it leads to lots of 
            // (false positive) file changes in git.
            svgHtmlPieces = sort2d(svgHtmlPieces, 'filename');
            for (ii = 0; ii < svgHtmlPieces.length; ii++) {
                html += svgHtmlPieces[ii].html;
            }
            callback(err, html);
        });
    });
}

// https://github.com/pingyuanChen/webpack-uglify-js-plugin/blob/master/utils/file.js#L10
// Like mkdir -p. Create a directory and any intermediary directories.
function mkdir (dirpath, mode) {
  // Set directory mode in a strict-mode-friendly way.
  if (mode == null) {
    mode = parseInt('0777', 8) & (~process.umask());
  }
  var pathSeparatorRe = /[\/\\]/g;
  dirpath.split(pathSeparatorRe).reduce(function(parts, part) {
    parts += part + '/';
    var subpath = path.resolve(parts);
    if (!fs.existsSync(subpath)) {
      try {
        fs.mkdirSync(subpath, mode);
      } catch(e) {
        throw console.error('Unable to create directory "' + subpath + '" (Error code: ' + e.code + ').', e);
      }
    }
    return parts;
  }, '');
}

function writeFile(path, contents) {
    // Create path, if necessary.
    var dirPath = path.slice(0, path.lastIndexOf('/'));
    mkdir(dirPath);
    fs.writeFileSync(path, contents);
}

SvgInlineNgPlugin.prototype.apply = function(compiler) {
    var options = this.options;
    if (options.svgDir && options.writeDir) {
        // compiler.plugin('emit', function(compilation, callback) {
        // compiler.plugin('compile', function(params) {
        compiler.plugin('compilation', function(compilation) {
            var html = headerHtml();

            readFiles(options.svgDir, function(err, svgHtml) {
                if (err) {
                    console.error('err: ', err);
                    callback();
                } else {
                    var html = `${headerHtml()}${svgHtml}${footerHtml()}`;
                    var filepath = `${options.writeDir}/svg-inline-ng-plugin.service.ts`;
                    writeFile(filepath, html);
                    // // Insert this list into the Webpack build as a new file asset:
                    compilation.assets['svg-inline-ng-plugin.service.ts'] = {
                      source: function() {
                        return html;
                      },
                      size: function() {
                        return html.length;
                      }
                    };
                    // callback();
                }
            });
        });
    } else {
        console.error(`svg-inline-ng-plugin: options.svgDir ${options.svgDir} and options.writeDir ${options.writeDir} are required.`);
    }
};

module.exports = SvgInlineNgPlugin;