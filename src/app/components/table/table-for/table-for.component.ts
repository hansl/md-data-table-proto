import {ChangeDetectorRef, Directive, DoCheck, IterableDiffer, IterableDiffers, CollectionChangeRecord, TemplateRef, ViewContainerRef, EmbeddedViewRef, ViewRef} from '@angular/core';
import {SelectionService} from '../selection-service';

/**
 * This directive is basically a re-do of ngFor with all of the extra
 * requirements for MdTable. It handles sorting the data, and it only
 * renders a slice of the data (the current page, or the visible data
 * in the infinite scroller.
 *
 * This is helpful because it lets us separate that functionality from
 * MdTable and it lets the user simply write *for="#item of items"
 * which is easy to understand.
 *
 * The MdTable widget will control the sorting with sortBy(...).
 * TODO(fringd): support controlling the pagination/infinite scroll
 * window.
 */
@Directive({
  selector: '[for]',
  inputs: ['forOf'],
})
export class MdTableFor implements DoCheck {
  public collection: any;  // visible for selectAll
  private sortedCollection: any[];
  private sortedDiffer: IterableDiffer;
  private differ: IterableDiffer;
  private sortField: string;
  private ascending: boolean;
  offset: number = 0;
  private perPage: number = null /* all */;

  constructor(
    private changeDetector: ChangeDetectorRef,
    private differs: IterableDiffers, private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private selectionService: SelectionService) {}

  set forOf(collection: any) {
    this.collection = collection;
    this.selectionService.setCollection(collection);
    if (collection && !this.differ) {
      this.differ = this.differs.find(collection).create(this.changeDetector);
      this.sortedCollection = [];
      this.sortedDiffer = this.differs.find(this.visibleRows()).create(null);
    }
  }

  setPagination(offset: number, perPage: number) {
    if (offset == this.offset && perPage == this.perPage) {
      return;
    }
    this.offset = offset;
    this.perPage = perPage;
    this.doSortedCheck();
  }

  sortBy(sortField: string, ascending: boolean = false) {
    let justReverse =
      sortField === this.sortField && ascending === !this.ascending;
    this.sortField = sortField;
    this.ascending = ascending;
    if (justReverse) {
      this.sortedCollection = this.sortedCollection.reverse();
    } else {
      this.sortedCollection = this.resort();
    }
    this.doSortedCheck();
  }

  ngDoCheck() {
    if (isPresent(this.differ)) {
      let changes = this.differ.diff(this.collection);
      if (isPresent(changes)) {
        this.selectionService.setCollection(this.collection);
        this.updateSorted(changes);
        this.doSortedCheck();
      }
    }
    for (let i = 0; i < this.viewContainer.length; i++) {
      let view:ViewRef = this.viewContainer.get(i);
      <ChangeDetectorRef>((<any>view)._view.changeDetectorRef).detectChanges();
    }
  }

  private updateSorted(changes: any /* DefaultIterableDiffer */) {
    if (isBlank(this.sortField)) {
      // maintain original order
      this.sortedCollection =
        this.collection.slice(0);  // slice(0) is a quick way to copy
      return;
    }
    let removedIndexes: number[] = [];
    changes.forEachRemovedItem(
      (removedRecord: CollectionChangeRecord) =>
        removedIndexes.push(removedRecord.previousIndex));
    for (let index of removedIndexes.sort().reverse()) {
      this.sortedCollection.splice(index, 1);
    }
    changes.forEachAddedItem(
      (addedRecord: CollectionChangeRecord) =>
        this.insertSorted(addedRecord.item));
  }

  private insertSorted(item: any) {
    this.sortedCollection.splice(
      this.binaryIndexOf(item, this.sortedCollection), 0, item);
  }

  private binaryIndexOf(item: any, collection: any[]): number {
    let minIndex: number = 0;
    let maxIndex: number = collection.length - 1;
    let currentIndex: number;
    let currentElement: number;

    while (minIndex <= maxIndex) {
      currentIndex = (minIndex + maxIndex) / 2 | 0;
      currentElement = collection[currentIndex];

      if (this.comparator()(currentElement, item) < 0) {
        minIndex = currentIndex + 1;
      } else {
        maxIndex = currentIndex - 1;
      }
    }
    // should place item between maxIndex and minIndex, minIndex == maxIndex+1
    // now.
    // so splice in at minIndex
    return minIndex;
  }

  private doSortedCheck() {
    let sortedChanges = this.sortedDiffer.diff(this.visibleRows());
    if (isPresent(sortedChanges)) this._applyChanges(sortedChanges);
  }

  private templateCache: EmbeddedViewRef<any>[] = [];

  private _applyChanges(changes: any /* DefaultIterableDiffer */) {
//  let rows = this.visibleRows();
//  if (this.viewContainer.length == rows.length) {
//    for (let i = 0; i < rows.length; i++) {
//      let viewRef = <EmbeddedViewRef>this.viewContainer.get(i);
//      viewRef.setLocal('\$implicit', rows[i]);
//      viewRef.changeDetectorRef.detectChanges();
//    }
//    return;
//  }
    // TODO(rado): check if change detection can produce a change record that is
    // easier to consume than current.
    let recordViewTuples: RecordViewTuple[] = [];
    changes.forEachRemovedItem(
      (removedRecord: CollectionChangeRecord) =>
        recordViewTuples.push(new RecordViewTuple(removedRecord, null)));

    changes.forEachMovedItem(
      (movedRecord: CollectionChangeRecord) =>
        recordViewTuples.push(new RecordViewTuple(movedRecord, null)));

    let insertTuples = this._bulkRemove(recordViewTuples);

    changes.forEachAddedItem(
      (addedRecord: CollectionChangeRecord) =>
        insertTuples.push(new RecordViewTuple(addedRecord, null)));

    this._bulkInsert(insertTuples);

    for (let i = 0; i < insertTuples.length; i++) {
      this._perViewChange(insertTuples[i].view, insertTuples[i].record);
    }

    changes.forEachIdentityChange((record: any) => {
      let viewRef =
        <EmbeddedViewRef<any>>this.viewContainer.get(record.currentIndex);
      viewRef.context.$implicit = record.item;
    });
  }

  private _perViewChange(
    view: EmbeddedViewRef<any>, record: CollectionChangeRecord) {
    view.context.$implicit = record.item;
    <ChangeDetectorRef>((<any>view)._view.changeDetectorRef).detectChanges();
  }

  private _bulkRemove(tuples: RecordViewTuple[]): RecordViewTuple[] {
    tuples.sort(
      (a: RecordViewTuple, b: RecordViewTuple) =>
      a.record.previousIndex - b.record.previousIndex);
    let movedTuples: RecordViewTuple[] = [];
    let mostCommonShift:number = null;
    let shifting = tuples.length == this.viewContainer.length;
    for (let i = tuples.length - 1; i >= 0; i--) {
      let tuple = tuples[i];
      let shift = this.getShift(tuple);
      if (shifting && mostCommonShift == null && shift != null) {
        mostCommonShift = shift;
      }

      if (!shifting || shift == null || shift != mostCommonShift) {
        // separate moved views from removed views.
        if (isPresent(tuple.record.currentIndex)) {
          tuple.view = <EmbeddedViewRef<any>>this.viewContainer.detach(tuple.record.previousIndex);
          movedTuples.push(tuple);
        } else {
          this.templateCache.push(<EmbeddedViewRef<any>>this.viewContainer.detach(tuple.record.previousIndex));
        }
      }
    }
    return movedTuples;
  }

  private getShift(tuple:RecordViewTuple):number {
    let record:CollectionChangeRecord  = tuple.record;
    if (record.currentIndex != null && record.previousIndex != null) {
      return record.currentIndex - record.previousIndex;
    } else {
      return null;
    }
  }

  private _bulkInsert(tuples: RecordViewTuple[]): RecordViewTuple[] {
    tuples.sort((a, b) => a.record.currentIndex - b.record.currentIndex);
    for (let i = 0; i < tuples.length; i++) {
      let tuple = tuples[i];
      if (isPresent(tuple.view)) {
        this.viewContainer.insert(tuple.view, tuple.record.currentIndex);
      } else {
        if (this.templateCache.length > 0) {
          tuple.view = this.templateCache.pop();
          this.viewContainer.insert(tuple.view, tuple.record.currentIndex);
        } else {
          tuple.view = this.viewContainer.createEmbeddedView(
            this.templateRef, {$implicit: tuple.record.item}, tuple.record.currentIndex);
        }
      }
    }
    return tuples;
  }

  private visibleRows(): any[] {
    if (this.perPage != null) {
      return this.sortedCollection.slice(
        this.offset, this.offset + this.perPage);
    } else {
      return this.sortedCollection;
    }
  }

  comparator() {
    let sortField = this.sortField;
    let ascending = this.ascending;

    if (ascending) {
      return (item1: any, item2: any) => item1[sortField] == null ?
        -1 :
        item2[sortField] == null ?
          1 :
          item1[sortField] === item2[sortField] ? 0 : item1[sortField] < item2[sortField] ? -1 : 1;
    } else {
      return (item1: any, item2: any) => item1[sortField] == null ?
        1 :
        item2[sortField] == null ?
          -1 :
          item1[sortField] === item2[sortField] ? 0 : item1[sortField] < item2[sortField] ? 1 : -1;
    }
  }

  resort(): any[] {
    if (this.sortField === null) {
      return this.collection.slice(
        0);  // slice(0) is a quick way to copy a list
    } else {
      return this.sortedCollection.sort(this.comparator());
    }
  }
}

class RecordViewTuple {
  view: EmbeddedViewRef<any>;
  record: any;
  constructor(record: any, view: EmbeddedViewRef<any>) {
    this.record = record;
    this.view = view;
  }
}

function isPresent(obj: any): boolean {
  return obj !== undefined && obj !== null;
}

function isBlank(obj: any): boolean {
  return obj === undefined || obj === null;
}
