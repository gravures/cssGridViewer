/* css-grid-viewer.js
 *
 * A Javascript (ECMAScript 2015) Class that makes overlays
 * showing the structure of css grids used in the document.
 *
 * @author: Gilles Coissac 
 * @license: Copyright (C) 2023 Gilles Coissac,
 *
 * licensed under the GNU GENERAL PUBLIC LICENSE version 3.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 */
 

class CssGridViewer{
   /** An utility Class reveling css grids.
    *
    */
   constructor({
      selector, 
      colors=["hsl(0, 50%, 40%)", "hsl(100, 50%, 40%)", "hsl(200, 50%, 40%)", "hsl(300, 50%, 40%)"], 
      opacity=1.0,
      pattern="lines",
   }){
      this.colors = colors;
      this.opacity = opacity;
      this.overlays = new Map();
      this.selected = 0;
      this.pattern = pattern;
      
      let doc_grids = [];
      if (!selector){
         doc_grids = this.queryGrids();
      } else {
         doc_grids = document.querySelectorAll(selector);
      }
      
      if (doc_grids.length){         
         for(let g of doc_grids){
            this.makeOverlay(g);
            this.highlightGrid(this.selected);
         }
         window.addEventListener("resize", this);
         window.addEventListener("keydown", this);
      }
      this.loadState();
   }
   
   queryGrids(){
      const grids = [];
      const elements = document.getElementsByTagName('*');

      for (let e of elements){
         if (window.getComputedStyle(e).display === 'grid') {
            grids.push(e);
         }
      }
      return grids;
   }
  
   handleEvent(event){
      if (event.type === "keydown"){
         if (event.key ==="g"){
            this.switchVisibility();
            this.saveState();
         } else if (event.key ==="n"){
            this.selectNextGrid();
            this.saveState();
         } else if (event.key ==="h"){
            this.switchTypeGrid();
            this.saveState();
         } else if (event.key ==="c"){
            this.cycleColor();
            this.saveState();
         }
      } else if (event.type === "resize"){
         this.updateOverlays();
      } 
   }
   
   selectNextGrid(){
      this.selected = (this.selected + 1) % this.overlays.size;
      this.highlightGrid(this.selected);
   }
   
   highlightGrid(index){
      let i = 0;
      for(let [name, overlay] of this.overlays){
         if (i == index){
            overlay.setOpacity(this.opacity);
         } else {
            overlay.setOpacity(0.15);
         }
         i++;
      }
   }
   
   switchVisibility(){
      for(let [name, overlay] of this.overlays){
         overlay.switchLayer();
      }
   }
   
   switchTypeGrid(){
      let i = 0;
      for(let [name, overlay] of this.overlays){
         if (i == this.selected){
            overlay.switchTypeGrid();
         }
         i++;
      }
   }
   
   cycleColor(){
      
   
   }
   
   updateOverlays(){
      for (let [name, overlay] of this.overlays){
         overlay.updateLayer();
      }
   }
   
   makeOverlay(css_grid){
      const name = `grid_${this.overlays.size}`;
      const overlay = new Overlay(
         name, 
         css_grid, 
         this.colors[(this.overlays.size + 1) % this.colors.length],
         this.opacity,
         this.pattern,
      );
      this.overlays.set(name, overlay);
      overlay.setupGrid();
   } 
     
   loadState(){
      let options = new Map();
      const cookie = this.readCookie("cssGridViewer");
      
      for (let opt of cookie.split("|")){
         const arr = opt.split(":");
         options.set(arr[0], arr[1]);
      }
      
      if (parseInt(options.get("selected")) < this.overlays.size){
         this.selected = parseInt(options.get("selected"));
         this.highlightGrid(this.selected);
      }
      if (options.get("visible") == "false"){
         this.switchVisibility();
      }
      for (const [name, overlay] of this.overlays){
         const bool = options.get(`${name}-TypeGrid`) == "true" ? true : false;
         if (overlay.isTypeGridVisible() !== bool){
            overlay.switchTypeGrid();
         }
      }
      
      // console.log(options);
   }  
     
   saveState(){
      let values;
      
      values = `selected:${this.selected}`;
      values += `|visible:${this.overlays.values().next().value.isVisible()}`;
      for (const [name, overlay] of this.overlays){
         values += `|${name}-TypeGrid:${overlay.isTypeGridVisible()}`;
      }
		this.writeCookie("cssGridViewer", values);
	}
   
   writeCookie(name, value, days){
		let expires = "";
		if (days){
			let date = new Date();
			date.setTime(date.getTime() + (days * 24 *60 * 60 * 1000));
			expires = date.toGMTString();
		}
		document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Strict;`;
	}
	
	readCookie(name){
		const cookies = document.cookie.split(';');
		for (let cookie of cookies){
		   if (cookie.trim().startsWith(name)){
		      return cookie.substring(name.length + 2);
		   }
		}
		return "";
	}
}


class Overlay{
   constructor(name, css_grid, color, opacity, pattern){
      this.grid = css_grid;
      this.color = color;
      this.name = name;
      this.patterns = new Map([
         ['board', btoa('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10">' +
                   '<rect x="0" y="0" width="5" height="5" fill="#CCCCCC" />' +
                   '<rect x="5" y="5" width="5" height="5" fill="#CCCCCC" />' +
                   '</svg>')],
         ['lines', btoa('<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">' +
                 '<pattern id="diagonal-lines" patternUnits="userSpaceOnUse" width="10" height="10">' +
                 '<line x1="0" y1="0" x2="10" y2="10" stroke="#CCCCCC" stroke-width="1" />' +
                 //'<line x1="5" y1="0" x2="0" y2="5" stroke="#CCCCCC" stroke-width="1" />' +
                 '</pattern>' +
                 '<rect x="0" y="0" width="100%" height="100%" fill="url(#diagonal-lines)" />' +
                 '</svg>')]
      ]);
      this.pattern = pattern;
      
      css_grid.style.position = 'relative';
      css_grid.style.overflow = 'visible';
      
      this.layer = css_grid.cloneNode(false);
      css_grid.appendChild(this.layer);
      
      this.layer.setAttribute("name", "GridViewerOverlay");
      this.layer.style.position = "absolute";
      this.layer.style.overflow = 'visible';
      this.layer.style.width = "100%";
      this.layer.style.height = "100%";
      this.layer.style.min_height = "20px";
      this.layer.style.opacity = opacity;
      this.layer.style.pointer_events = "none";
      this.layer.style.visibility = "visible";
   }
   
   isVisible(){
      return this.layer.style.visibility == "visible";
   }
   
   isTypeGridVisible(){
      return this.typeGrid.style.opacity == 1.0;
   }
   
   setOpacity(value){
      this.layer.style.opacity = value;
   }
   
   switchLayer(){
      this.layer.style.visibility = this.layer.style.visibility == "visible" ? "hidden" : "visible";
   }
   
   switchTypeGrid(){
      this.typeGrid.style.opacity = this.typeGrid.style.opacity == 1.0 ? 0 : 1.0;
   }
   
   updateLayer(){
      this.layer.replaceChildren();
      this.setupGrid();
   }
   
   drawTypeGrid(div){
      const h = div.getBoundingClientRect().height;
      const lh = parseInt(getComputedStyle(div).lineHeight);
      
      this.typeGrid = document.createElement("div");
      this.typeGrid.setAttribute("name", "type-grid");
      this.typeGrid.style.position = "absolute";
      this.typeGrid.style.top = 0;
      this.typeGrid.style.left = 0;
      this.typeGrid.style.width = this.typeGrid.style.height = "100%";
      this.typeGrid.style.opacity = 1.0;

      for(let y = 0; y < h; y += lh){
         let line = document.createElement("div");
         line.style.cssText = 
            `position: absolute; border-bottom: 1px dashed ${this.color};` + 
            `height: ${lh}; width: 100%; top: ${y}px; left: 0px;`;
         this.typeGrid.appendChild(line);
      }
      div.appendChild(this.typeGrid);
   }
   
   makeColumn(col, index){      
      col.setAttribute("name", `grid-column-${index}`);
      col.style.cssText = 
         `display: block; border: 1px solid ${this.color};`;
         
      // gutter
      if (index < this.nCol - 1){
         let gutter = document.createElement("div");
         gutter.setAttribute("name", "grid-v-gutter");
         gutter.style.cssText = `position: relative;` 
         gutter.style.pointer_events = "none";
         gutter.style.height = "100%";
         gutter.style.width = `${this.colGap}px`;
         gutter.style.right = "-100%";
         this.setSvgBackground(gutter);
         col.appendChild(gutter);
      }

      // columns numbering
      col.innerHTML += `<span>${index + 1}</span>`;
      const span = col.querySelector("span");
      span.setAttribute("name", "number");
      span.style.cssText = 
         `color: white; background: ${this.color}; border-radius: 33%;` +
         "width: 20px; height: 20px; position: absolute; top:0;" +
         "display:flex; justify-content: center; font-size: 12px;" +
         "font-family: sans; font-weight: 600; align-items: center"; 
      
      return col;
   }
   
   makeRows(col, rows){
      for (let i = 0; i < rows.length; i+=2){
         // row
         let div = document.createElement("div");
         div.setAttribute("name", "grid-row");
         div.style.cssText = 
            `position: absolute; border-top: 1px solid ${this.color};` + 
            `border-bottom: 1px solid ${this.color};`;
         div.style.pointer_events = "none";
         div.style.width = `100%`;
         div.style.top = `${rows[i]}px`;
         div.style.height = `${rows[i + 1]}px`;
         col.appendChild(div);
         
         // gutter
         if (i < rows.length - 2){
            let gutter = document.createElement("div");
            gutter.setAttribute("name", "grid-h-gutter");
            gutter.style.cssText = `position: absolute;`;
            gutter.style.pointer_events = "none";
            gutter.style.width = `100%`;
            gutter.style.top = `${rows[i + 1] + rows[i]}px`;
            gutter.style.height = `${this.rowGap}px`;
            this.setSvgBackground(gutter);
            col.appendChild(gutter);
         }
      }
   }
   
   computeRowsInsets(){
      const rows = [];
      const tmp = [];
      
      for (let i = 1; i <= this.nRow; i++){
         const row = document.createElement("div");
         row.style.gridRow = `${i} / span 1`; 
         row.style.gridColumn = `${this.nCol + 1} / span 1`;
         row.style.width = "20px";
         row.style.height = "100%";
         tmp.push(row);
         this.grid.appendChild(row);
      }
      for (let r of tmp){
         const rect = r.getBoundingClientRect();
         rows.push(r.offsetTop);
         rows.push(r.offsetHeight);
      }
      for (let r of tmp){
         r.remove();
      }
      return rows;
   }
   
   setSvgBackground(div){
      const svg = this.patterns.get(this.pattern);
      div.style.backgroundImage = 'url("data:image/svg+xml;base64,' + svg + '")';
      div.style.backgroundRepeat = 'repeat';
   }

   setupGrid(){       
      const style = getComputedStyle(this.grid);
      this.nCol = parseInt(style.gridTemplateColumns.split(' ').length);
      this.nRow = parseInt(style.gridTemplateRows.split(' ').length);
      this.colGap = style.columnGap ? parseInt(style.columnGap) : 0;
      this.rowGap = style.rowGap ? parseInt(style.rowGap) : 0;
                  
      // adding columns
      let col = undefined;
      for (let i = 0; i < this.nCol; i++) {
         const col = document.createElement("div");
         this.layer.appendChild(col);
         if (col.offsetTop !== 0){  // safe guard
            col.remove();
            break;
         }
         this.makeColumn(col, i);
         if (i === 0){
            this.makeRows(col, this.computeRowsInsets());
         }
      }
      this.drawTypeGrid(this.layer);
   }
}




