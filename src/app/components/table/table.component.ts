import {AfterContentInit, AfterViewChecked, ChangeDetectorRef, Component, ContentChild, ContentChildren, ElementRef, EventEmitter, Input, NgZone, Output, QueryList} from '@angular/core';
import {MdTableEditable} from './table-editable';
import {MdTableFor} from './table-for';
import {MdTableHeader} from './table-header';
import {MdTableSelector} from './table-selector';
import {MdTableGlobalSelector} from './table-global-selector';
import {SelectionService} from './selection-service';

/**
 * A table widget. Uses the table[md-table] selector because it makes its use
 * very intuitive. This directive cooperates with the MdTableFor and
 * MdTableHeader directives. To use this table you should use
 * directives: [MdTable.DIRECTIVES], that will add all the directives at once.
 *
 *  Example Usage:
 *  <md-table>
 *    <thead>
 *      <tr>
 *        <th sort=name>Name</th>
 *        <th sort=id>ID</th>
 *      </tr>
 *    </thead>
 *    <tbody>
 *      <tr *for="#item of items">
 *        <td>{{item.name}}</td>
 *        <td>{{item.id}}</td>
 *      </tr>
 *    </tbody>
 *  </md-table>
 *
 *
 *  Example server-side data
 *  <table (sort)="refreshServerData()">...</table>
 */
@Component({
  moduleId: module.id,
  selector: 'md-table',
  providers: [SelectionService],
  directives: [],
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.css'],
})
export class MdTable implements AfterContentInit,
  AfterViewChecked {
  @ContentChildren(MdTableHeader) headers: QueryList<MdTableHeader>;
  @ContentChildren(MdTableEditable) editables: QueryList<MdTableEditable>;
  @ContentChild(MdTableFor) repeater: MdTableFor;
  @ContentChild(MdTableGlobalSelector) topSelector: MdTableGlobalSelector;
  @Output() sort = new EventEmitter<[string, boolean]>();
  @Input('server-side-sort') serverSideSort: boolean;
  @Input() scrollable: boolean;
  @Output() selection = new EventEmitter<Set<any>>();

  columnWidths: number[] = [];
  columnNumerics(index: number): boolean {
    return this.headers && this.headers.length >= index - 1 &&
      this.headers.toArray()[index].numeric;
  }
  private sortField: string;
  private ascending: boolean = false;
  private offsetPx: number = 0;

  constructor(
    private changeDetectorRef: ChangeDetectorRef, private element: ElementRef,
    private ngZone: NgZone, private selectionService: SelectionService) {}

  getSelected(): Set<any> { return this.selectionService.getSelected(); }

  ngAfterContentInit() {
    this.headers.forEach((header: MdTableHeader) => {
      if (header.hasWidth) {
        this.columnWidths.push(header.getWidth());
      }
      header.onSort.subscribe(
        (sortField: string) => this.changeSort(sortField));
      if (header.numeric) {
        let index = header.getIndex();
        if (index > 30) {
          throw new Error(
            `you need to add more classes to table.css for numeric on index ${index}`);
        }
        this.element.nativeElement.classList.add(`numeric${index}`);
      }
    });
    if (this.topSelector != null) {
      this.topSelector.selectAll.subscribe((checked: boolean) => {
        if (checked) {
          this.selectionService.selectAll();
        } else {
          this.selectionService.clearSelected();
        }
      });
    }
  }

  private madeScrollable: boolean;

  ngAfterViewChecked() {
    if (this.scrollable) {
      if (!this.madeScrollable && !this.loading()) {
        this.makeItScrollable();
      } else if (!this.loading()) {
        this.updateHeights();
      }
      this.changeDetectorRef.detectChanges();
    }
  }

  scrolling = 0;
  onScroll(event: UIEvent) {
    this.offsetPx = this.scroller.scrollTop;
    let table = this;

    let reboot = this.scrolling == 0;
    this.scrolling = 10;
    if (reboot) {
      requestAnimationFrame(() => table.doScroll(table));
    }
  }

  doScroll(table:MdTable) {
    this.updateHeights();
    this.scrolling--;
    if (this.scrolling > 0) {
      requestAnimationFrame(() => table.doScroll(table));
    }
  }

  private scroller:HTMLElement;

  private makeItScrollable() {
    let nativeElement: HTMLElement = this.element.nativeElement;
    let headerRow =
      nativeElement.getElementsByTagName('thead')[0].getElementsByTagName(
        'tr')[0];
    headerRow.style.height = '46px';
    let headerElements =
      this.toArray(nativeElement.getElementsByTagName('thead')
        .item(0)
        .getElementsByTagName('th'));

    let newWidths:number[] = [];
    for (let headerElement of headerElements) {
      newWidths.push(headerElement.offsetWidth);
    }
    this.columnWidths = newWidths;
    let totalWidth = this.columnWidths.reduce((a, b) => a + b, 0);
    this.element.nativeElement.getElementsByTagName('table')[0].style.width =
      `${totalWidth}px`;

    let headerIndex = 0;
    let xOffset = 0;
    for (let headerElement of headerElements) {
      let width = this.columnWidths[headerIndex];

      // TODO(fringd): All this style information can't be put into
      // table.css becase it is styling the projected content. On the
      // lookout for a more elegant solution.
      headerElement.style.display = 'block';
      headerElement.style.width = `${width}px`;
      headerElement.style.left = `${xOffset}px`;
      headerElement.style.top = '0';

      xOffset += width;
      headerIndex++;
    }
    this.element.nativeElement.getElementsByTagName('tbody')[0].style.willChange = "transform";
    this.scroller = this.element.nativeElement.getElementsByClassName('scroller')[0];
    this.updateHeights();
    let table = this;
    this.ngZone.runOutsideAngular( function() {
      table.scroller.addEventListener('scroll', (event:UIEvent) => {
        table.onScroll(event);
      });
    });
    this.madeScrollable = true;
  }

  private lastLength:number;
  private setTotalHeight():number {
    let spacer:HTMLElement = this.element.nativeElement.getElementsByClassName('spacer')[0];
    let length = this.repeater.collection.length;
    let totalHeight = length * this.rowHeight + this.rowHeight;
    if (!this.lastLength || length != this.lastLength) {
      spacer.style.height = `${totalHeight}px`;
    }
    this.lastLength = length;
    return totalHeight;
  }

  private toArray<T extends Node>(nodeListOf: NodeListOf<T>): Array<T> {
    return Array.prototype.slice.call(nodeListOf, 0);
  }

  private rowHeight = 48;
  private updateHeights() {
    // TODO(fringd): Add support for irregular height rows.
    let itemBlockSize = 1;
    let itemsInView = 8;
    // TODO(fringd): make the height of this widget an input and calculate
    // itemsToShow back from it.

    let firstVisible = Math.floor(this.offsetPx / this.rowHeight);
    let firstRendered = Math.floor(firstVisible / itemBlockSize) * itemBlockSize;

    let itemsToRender = itemBlockSize + itemsInView;
    firstRendered = Math.min(firstRendered, Math.max(0, this.repeater.collection.length - itemsToRender));
    let heightAbove = firstRendered * this.rowHeight;

    let totalHeight = this.setTotalHeight();
    let tbody:HTMLElement = this.element.nativeElement.getElementsByTagName('tbody')[0];
    this.repeater.setPagination(firstRendered, itemsToRender);
    let windowHeight = this.scroller.clientHeight - this.rowHeight;
    let fixedPoint = Math.floor(this.offsetPx + (this.offsetPx / (totalHeight - windowHeight - this.rowHeight)) * windowHeight);
    let fixedRow = Math.floor(fixedPoint / this.rowHeight);
    console.log('fixedRow', fixedRow);
    let offScreenPx = Math.floor(fixedPoint % this.rowHeight);
    let fixedRenderedIndex = fixedRow-firstRendered;
    console.log('fixedRenderedIndex', fixedRenderedIndex);
    let renderedRows = tbody.getElementsByTagName('tr');
    let topHeight = 0;
    for (let i = 0; i < fixedRenderedIndex; i++ ) {
      let tr = renderedRows[i];
      topHeight += tr.clientHeight;
    }
    let bumpUp = topHeight - fixedRenderedIndex * this.rowHeight;
    if (offScreenPx) {
      let fixedTr:HTMLElement = renderedRows[fixedRenderedIndex];
      let fixedHeight = fixedTr.clientHeight;
      bumpUp += (fixedHeight-this.rowHeight)* (offScreenPx)/this.rowHeight;
    }
    heightAbove -= Math.floor(bumpUp);
    heightAbove += 2; // seems to work
    tbody.style.transform = `translate(0,${heightAbove}px)`;
  }

  private changeSort(sortField: string) {
    if (this.sortField === sortField) {
      this.ascending = !this.ascending;
    } else {
      this.ascending = false;
      this.sortField = sortField;
    }
    if (this.serverSideSort) {
      this.sort.emit([this.sortField, this.ascending]);
    } else {
      this.repeater.sortBy(this.sortField, this.ascending);
    }
    this.updateHeaderStyles();
  }

  private updateHeaderStyles() {
    this.headers.forEach((header) => {
      if (header.sort === this.sortField) {
        if (this.ascending) {
          header.setAscending();
        } else {
          header.setDescending();
        }
      } else {
        header.clearSort();
      }
    });
  }

  public loading(): boolean { return isBlank(this.repeater.collection); }

  get hasWidths(): boolean { return this.columnWidths.length > 0; }
}

export const MD_TABLE_DIRECTIVES = [
  MdTable, MdTableEditable, MdTableFor, MdTableHeader,
  MdTableGlobalSelector, MdTableSelector
];

function isBlank(obj: any): boolean {
  return obj === undefined || obj === null;
}
