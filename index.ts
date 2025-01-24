/* css-grid-viewer.ts
 *
 * A Javascript utility Class that creates overlays
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

const defaultColors = [
   "hsl(0, 50%, 40%)",
   "hsl(100, 50%, 40%)",
   "hsl(200, 50%, 40%)",
   "hsl(300, 50%, 40%)",
]


/** An utility Class reveling css grids.
 *
 */
class CssGridViewer implements EventListenerObject {
   private colors: string[]
   private opacity: number
   private overlays: Map<string, Overlay>
   private selected: number
   private pattern: string

   constructor(
      selector?: string,
      colors: string[] = defaultColors,
      opacity: number = 1.0,
      pattern: string = "lines"
   ) {
      this.colors = colors
      this.opacity = opacity
      this.overlays = new Map()
      this.selected = 0
      this.pattern = pattern

      const doc_grids: HTMLElement[] | NodeListOf<Node> = (!selector)
         ? this.queryGrids()
         : document.querySelectorAll(selector)

      if (doc_grids.length) {
         for (const g of doc_grids) {
            this.makeOverlay(g as HTMLElement)
            this.highlightGrid(this.selected)
         }
         window.addEventListener("resize", this)
         window.addEventListener("keydown", this)
      }
   }

   private queryGrids(): HTMLElement[] {
      const grids = []
      const elements = document.getElementsByTagName('*')

      for (const e of elements)
         if (window.getComputedStyle(e).display === 'grid')
            grids.push(e as HTMLElement)

      return grids
   }

   public handleEvent(event: Event): void {
      switch (event.type) {
         case "keydown":
            switch ((event as KeyboardEvent).key) {
               case "g":
                  this.switchVisibility()
                  break
               case "n":
                  this.selectNextGrid()
                  break
               case "h":
                  this.switchTypeGrid()
                  break
               case "c":
                  this.cycleColor()
                  break
               default:
                  break
            }
            break
         case "resize":
            this.updateOverlays()
            break
         default:
            break
      }
   }

   private selectNextGrid(): void {
      this.selected = (this.selected + 1) % this.overlays.size
      this.highlightGrid(this.selected)
   }

   private highlightGrid(index: number): void {
      let i = 0
      for (const [name, overlay] of this.overlays) {
         if (i == index)
            overlay.setOpacity(this.opacity)
         else
            overlay.setOpacity(0.15)
         i++
      }
   }

   private switchVisibility(): void {
      for (let [name, overlay] of this.overlays)
         overlay.switchLayer()
   }

   private switchTypeGrid(): void {
      let i = 0
      for (const [name, overlay] of this.overlays) {
         if (i == this.selected)
            overlay.switchTypeGrid()
         i++
      }
   }

   private cycleColor(): void {
      // TODO: implements cycle color
   }

   private updateOverlays(): void {
      for (let [name, overlay] of this.overlays)
         overlay.updateLayer()
   }

   private makeOverlay(cssGrid: HTMLElement): void {
      const name = `grid_${this.overlays.size}`
      const overlay = new Overlay(
         name,
         cssGrid,
         this.colors[(this.overlays.size + 1) % this.colors.length],
         this.opacity,
         this.pattern,
      )
      this.overlays.set(name, overlay)
      overlay.setupGrid()
   }
}


/**
 * 
 */
class Overlay {
   private static readonly patterns: Map<string, string> = new Map([
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
   ])

   private readonly name: string
   private readonly grid: HTMLElement
   private readonly layer: HTMLElement
   private readonly color: string
   private readonly pattern: string
   private colGap: number
   private rowGap: number
   private nCol: number
   private nRow: number
   private typeGrid?: HTMLDivElement

   constructor(name: string, cssGrid: HTMLElement, color: string, opacity: number, pattern: string) {
      this.name = name
      this.grid = cssGrid
      this.color = color
      this.pattern = pattern

      this.grid.style.position = 'relative'
      this.grid.style.overflow = 'visible'
      this.layer = this.grid.cloneNode(false) as HTMLElement
      this.grid.appendChild(this.layer)

      this.layer.setAttribute("name", "GridViewerOverlay")
      this.layer.style.position = "absolute"
      this.layer.style.overflow = 'visible'
      this.layer.style.width = "100%"
      this.layer.style.height = "100%"
      this.layer.style.minHeight = "20px"
      this.layer.style.opacity = opacity.toString()
      this.layer.style.pointerEvents = "none"

      this.colGap = this.rowGap = this.nCol = this.nRow = 0
   }

   public setOpacity(value: number): void {
      this.layer.style.opacity = value.toString()
   }

   public switchLayer(): void {
      this.layer.style.visibility = this.layer.style.visibility == "visible" ? "hidden" : "visible"
   }

   public switchTypeGrid(): void {
      if (this.typeGrid)
         this.typeGrid.style.opacity = (this.typeGrid.style.opacity === "1.0") ? "0" : "1.0"
   }

   public updateLayer(): void {
      this.layer.replaceChildren()
      this.setupGrid()
   }

   private drawTypeGrid(div: HTMLDivElement): void {
      const h = div.getBoundingClientRect().height
      const lh = parseInt(getComputedStyle(div).lineHeight)

      this.typeGrid = document.createElement("div")
      this.typeGrid.setAttribute("name", "type-grid")

      for (let y = 0; y < h; y += lh) {
         const line = document.createElement("div")
         line.style.cssText =
            `position: absolute; border-bottom: 1px dashed ${this.color};` +
            `height: ${lh}; width: 100%; top: ${y}px; left: 0px;`
         this.typeGrid.appendChild(line)
      }
      div.appendChild(this.typeGrid)
   }

   private makeColumn(col: HTMLDivElement, index: number): HTMLDivElement {
      col.setAttribute("name", `grid-column-${index}`)
      col.style.cssText = `display: block; border: 1px solid ${this.color};`

      // gutter
      if (index < this.nCol - 1) {
         const gutter = document.createElement("div")
         gutter.setAttribute("name", "grid-v-gutter")
         gutter.style.cssText = `position: relative;`
         gutter.style.pointerEvents = "none"
         gutter.style.height = "100%"
         gutter.style.width = `${this.colGap}px`
         gutter.style.right = "-100%"
         this.setSvgBackground(gutter)
         col.appendChild(gutter)
      }

      // columns numbering
      col.innerHTML += `<span>${index + 1}</span>`
      const span = col.querySelector("span")
      if (span) {
         span.setAttribute("name", "number")
         span.style.cssText =
            `color: white; background: ${this.color}; border-radius: 33%;` +
            "width: 20px; height: 20px; position: absolute; top:0;" +
            "display:flex; justify-content: center; font-size: 12px;" +
            "font-family: sans; font-weight: 600; align-items: center"
      }
      return col
   }

   private makeRows(col: HTMLDivElement, rows: number[]): void {
      for (let i = 0; i < rows.length; i += 2) {
         // row
         let div = document.createElement("div")
         div.setAttribute("name", "grid-row")
         div.style.cssText =
            `position: absolute; border-top: 1px solid ${this.color};` +
            `border-bottom: 1px solid ${this.color};`
         div.style.pointerEvents = "none"
         div.style.width = `100%`
         div.style.top = `${rows[i]}px`
         div.style.height = `${rows[i + 1]}px`
         col.appendChild(div)

         // gutter
         if (i < rows.length - 2) {
            let gutter = document.createElement("div")
            gutter.setAttribute("name", "grid-h-gutter")
            gutter.style.cssText = `position: absolute;`
            gutter.style.pointerEvents = "none"
            gutter.style.width = `100%`
            gutter.style.top = `${rows[i + 1] + rows[i]}px`
            gutter.style.height = `${this.rowGap}px`
            this.setSvgBackground(gutter)
            col.appendChild(gutter)
         }
      }
   }

   private computeRowsInsets(): number[] {
      const rows = []
      const tmp = []

      for (let i = 1; i <= this.nRow; i++) {
         const row = document.createElement("div")
         row.style.gridRow = `${i} / span 1`
         row.style.gridColumn = `${this.nCol + 1} / span 1`
         row.style.width = "20px"
         row.style.height = "100%"
         tmp.push(row)
         this.grid.appendChild(row)
      }
      for (let r of tmp) {
         // const rect = r.getBoundingClientRect()
         rows.push(r.offsetTop)
         rows.push(r.offsetHeight)
      }
      for (let r of tmp) {
         r.remove()
      }
      return rows
   }

   private setSvgBackground(div: HTMLDivElement): void {
      const svg = Overlay.patterns.get(this.pattern)
      div.style.backgroundImage = 'url("data:image/svg+xml;base64,' + svg + '")'
      div.style.backgroundRepeat = 'repeat'
   }

   public setupGrid(): void {
      const style = getComputedStyle(this.grid)

      this.nCol = style.gridTemplateColumns.split(' ').length
      this.nRow = style.gridTemplateRows.split(' ').length
      this.colGap = style.columnGap ? parseInt(style.columnGap) : 0
      this.rowGap = style.rowGap ? parseInt(style.rowGap) : 0

      // adding columns
      for (let i = 0; i < this.nCol; i++) {
         const col = document.createElement("div")
         this.layer.appendChild(col)
         if (col.offsetTop !== 0) {  // safe guard
            col.remove()
            break
         }
         this.makeColumn(col, i)
         if (i === 0) {
            this.makeRows(col, this.computeRowsInsets())
         }
      }
      //this.drawTypeGrid(this.layer);
   }
}


export default function (
   selector?: string,
   colors: string[] = defaultColors,
   opacity: number = 1.0,
   pattern: string = "lines"
): void {
   document.addEventListener("DOMContentLoaded", () => {
      new CssGridViewer(selector, colors, opacity, pattern)
   })
}

export { CssGridViewer }
