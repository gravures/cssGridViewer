# cssGridViewer

## About

This is a JavaScript (ECMAScript 2015) Class that creates an overlay to show the structure of CSS grids used in a web page.  Nowadays most browsers have a grid inspector, but i found it useful to have an unobtrusive one (without the developer tool pan open) when working on layout. 

## Usage

### Simple way

```html
<script>
    import cssGridViewer from "cssgridviewer";
    cssGridViewer();
</script>
```

Optional arguments can be passed as [destructured parameters](https://simonsmith.io/destructuring-objects-as-function-parameters-in-es6https://simonsmith.io/destructuring-objects-as-function-parameters-in-es6) :

- `selector` (optional): A CSS selector string or an Array of selector string to find CSS grid elements in the document. If not provided all CSS grid elements in the document will be used.
- `colors` (default: `a four colors array is provided`): An array of CSS colors strings to use for the overlays. Overlay's color will cycle on this array.
- `opacity` (default: `1.0`): A number between 0 and 1 to set the opacity of the overlays.
- `pattern` (default: `"lines"`): A string to set the pattern of the gutters. It can be either `"lines"` or `"board"`.

```html
<script>
    import cssGridViewer from "cssgridviewer";

    cssGridViewer({
        selector: [".grid", ".subgrid"], 
        colors: ['black', 'rgb(120, 30, 90)'],
        pattern: 'board'
    });
</script>
```

Those keyboards events are handled:

- press [g] to switch on and off the overlay's visibility

- press [n] to select the next grid overlay, this will highlight it and mask other ones

- press [h] to switch visibility of a typographic grid on the selected grid

### Alternate way

Import the class `CssGridViewer` and use it in your own handler:

```html
<script>
    import { CssGridViewer } from "cssgridviewer";

    document.addEventListener("DOMContentLoaded", () => {
       new CssGridViewer({});
    });
</script>
```



Enjoy!

### License

**cssGridViewer** is free software; you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation; either version 3 of the License, or (at your option) any later version.