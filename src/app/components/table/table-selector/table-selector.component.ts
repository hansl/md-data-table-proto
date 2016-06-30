import {AfterViewChecked, Component, ElementRef, Input} from '@angular/core';
import {MdCheckbox, MdCheckboxChange} from '@angular2-material/checkbox/checkbox';
import {SelectionService} from '../selection-service';

@Component({
  selector: 'td[selector][item], th[selector][item]',
  directives: [MdCheckbox],
  template:
    '<md-checkbox [checked]="selected" (change)="selected = $event.checked"></md-checkbox>',
  styles: [`
    md-checkbox {
      display: inline-block;
    }

    :host {
      padding-top: 0 !important;
      padding-bottom: 0 !important;
      overflow: hidden;
      line-height: 0px;
    }
  `],
})
export class MdTableSelector implements AfterViewChecked {
  @Input() item: any;

  constructor(
    private selectionService: SelectionService, private element: ElementRef) {
  }

  get selected() { return this.selectionService.isSelected(this.item); }

  ngAfterViewChecked() {
    let nativeElement: HTMLElement = this.element.nativeElement;
    nativeElement.parentElement.classList.toggle('is-selected', this.selected);
  }

  set selected (checked: boolean) {
    this.selectionService.setSelected(this.item, checked);
  }
}
