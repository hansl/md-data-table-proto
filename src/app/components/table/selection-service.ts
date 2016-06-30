import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';

/**
 * A service that stores coordinates the set of selected items in a selectable
 * table across the containing table and all the selection widgets.
 */
export class SelectionService {
  private collection = new Set<any>();
  private selected = new Set<any>();

  setCollection(collection: any[]) { this.collection = new Set(collection); }

  isSelected(item: any): boolean { return this.selected.has(item); }

  allSelected(): boolean { return this.selected.size == this.collection.size; }

  clearSelected() {
    this.selected = new Set();
    this.fireObserver();
  }

  private allSelectedSubject = new Subject<boolean>();

  allSelectedObserver(): Observable<boolean>  {
    return this.allSelectedSubject;
  }

  private fireObserver() {
    this.allSelectedSubject.next(this.allSelected());
  }

  selectAll() {
    this.selected = new Set(this.collection);
    this.fireObserver();
  }

  getSelected(): Set<any> { return new Set(this.selected); }

  setSelected(item: any, isSelected: boolean) {
    if (isSelected) {
      this.selected.add(item);
    } else {
      this.selected.delete(item);
    }
    this.fireObserver();
  }
}
