# SVG Inline Angular Plugin

Takes a directory of .svg files and generates an angular 2 service file with the svg code for inline use.


## Why?

`<object>` svg's can not be styled with CSS easily.
To get dynamic sizing and CSS (color fill) styling, inline `<svg>` is the best option.
But for ease of use we want just use files.
So this takes the files and creates an Angular service with the inlined svg code for use.

https://svgontheweb.com/#implementation

https://css-tricks.com/using-svg/


## Usage


### Install

Add to `package.json` & `npm install`
`"svg-inline-ng-plugin": "git+ssh://git@github.com/presencelearning/svg-inline-ng-plugin"`

### Add to webpack config:

```
var SvgInlineNgPlugin = require('svg-inline-ng-plugin');
...
new SvgInlineNgPlugin({
    svgDir: helpers.root('public', 'images', 'svg'),
    writeDir: helpers.root('src', 'build')
})
```


### Import our generated file and use the svg code.

```
import { SvgInlineNgPluginService } from '../../../../build/svg-inline-ng-plugin.service';
...
providers: [SvgInlineNgPluginService]
...
constructor(private sanitizer: DomSanitizer,
 private svgInlineNgPluginService: SvgInlineNgPluginService ) {}
...
this.svgCode = this.sanitizer.bypassSecurityTrustHtml(this.svgInlineNgPluginService.svgs[this.svg].html);
```

And then in the html:
```
<div [innerHtml]="svgCode" class="pl-icon-svg"></div>
```


### Ignore the generated file to prevent webpack build loops.

```
var WatchIgnorePlugin = webpack.WatchIgnorePlugin;
...
new WatchIgnorePlugin([
    helpers.root('src', 'build')
]),
```

