import {ElementRef, Component, HostListener, Input, Output, EventEmitter} from '@angular/core';

/**
 * A helper component for md-table. It handles sorting basically. You shouldn't
 * be
 * using this directly. Use "directives: [MdTable.DIRECTIVES]" instead.
 *
 * TODO(fringd): support sorting by something besides POJO fields. i.e.
 * sort="getName()" instead of just sort="name".
 */
@Component({
  moduleId: module.id,
  selector: 'th[sort], th[width], th[numeric]',
  template: '<ng-content></ng-content>',
  styleUrls:
    ['./table-header.component.css'],
  host: {
    '[class.ascending]': 'ascending',
    '[class.descending]': 'descending',
    '[class.numeric]': '!numeric',
  }
})
export class MdTableHeader {
  @Output() onSort: EventEmitter<string> = new EventEmitter<string>();
  @Input() sort: string;
  @Input() width: string|number;

  constructor(private el: ElementRef) {
    this.numeric = this.el.nativeElement.hasAttribute('numeric');
  }

  getIndex(): number {
    let i = 0;
    let elem = this.el.nativeElement;
    while ((elem = elem.previousElementSibling) != null) i++;
    return i;
  }

  ascending: boolean = false;
  descending: boolean = false;
  numeric: boolean;

  setAscending() {
    this.ascending = true;
    this.descending = false;
  }
  setDescending() {
    this.ascending = false;
    this.descending = true;
  }
  clearSort() {
    this.ascending = false;
    this.descending = false;
  }

  @HostListener('click', ['$event.target'])
  onClick(event: any) {
    if (!!this.sort) {
      this.onSort.emit(this.sort);
    }
  }

  get hasWidth(): boolean { return this.width != null; }

  getWidth(): number { return +this.width; }
}
