import {ChangeDetectorRef, ChangeDetectionStrategy, Component, EventEmitter, Output} from '@angular/core';
import {MdCheckbox, MdCheckboxChange} from '@angular2-material/checkbox/checkbox';
import {SelectionService} from '../selection-service';

@Component({
  selector: 'th[selector]:not([item])',
  directives: [MdCheckbox],
  template:
    '<md-checkbox [checked]="selected" (change)="selected = $event.checked"></md-checkbox>',
  styles: [`
    md-checkbox {
      display: inline-block;
    }

    :host {
      line-height: 0px;
      padding-top: 0 !important;
      padding-bottom: 0 !important;
      overflow: hidden;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MdTableGlobalSelector {
  @Output() selectAll = new EventEmitter<boolean>();

  constructor(private cdr: ChangeDetectorRef, private selectionService: SelectionService) {
    this.selectionService.allSelectedObserver().subscribe(
      () => this.cdr.markForCheck());
  }

  get selected() {
    return this.selectionService.allSelected();
  }

  set selected (checked: boolean) {
    this.selectAll.emit(checked);
  }
}
