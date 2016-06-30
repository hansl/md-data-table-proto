import {Component} from '@angular/core';
import {MdButton} from '@angular2-material/button';
import {MD_TABLE_DIRECTIVES} from '../components/table';

@Component({
  moduleId: module.id,
  selector: 'table-demo',
  templateUrl: './demo-table.component.html',
  directives: [
    MD_TABLE_DIRECTIVES,
    MdButton,
  ]
})
export class DemoTableComponent {
  items = [
    {name: 'Wolverine', id: 1, power: 'super healing'},
    {name: 'Mystique', id: 2, power: 'shapeshifting'},
    {name: 'Magneto', id: 3, power: 'knows how magnets work'},
    {name: 'Professor X', id: 4, power: 'telepathy'},
    {name: 'Beast', id: 5, power: 'blue'},
    {name: 'Cyclops', id: 6, power: 'laser eyes'},
    {name: 'Gambit', id: 7, power: 'throws cards'},
    {name: 'Jean Grey', id: 8, power: 'drains powers'},
    {name: 'Iceman', id: 9, power: 'ice'},
    {name: 'Nightcrawler', id: 10, power: 'teleportation'},
    {name: 'Jubilee', id: 11, power: 'breaks stuff'},
    {name: 'Kitty Pryde', id: 12, power: 'walks through walls'},
    {name: 'Storm', id: 13, power: 'controls weather'},
  ];
  serverItems = this.items.slice(0);
  selectableItems = this.items.slice(0);
  editableItems = JSON.parse(JSON.stringify(this.items));

  private server: Server = new Server(this.items);

  updateData(sort: [string, boolean]) {
    let sortField = sort[0];
    let ascending = sort[1];
    this.server.getSortedData(
      sortField, ascending, (sortedItems) => this.serverItems = sortedItems);
  }


  private nextId = 14;
  add1000() {
    for (let i = 0; i < 1000; i++) {
      this.items.push({
        name: `New guy #${this.nextId}`,
        id: this.nextId,
        power: 'does stuff'
      });
      this.nextId++;
    }
  }
}

class Server {
  items: any[];
  constructor(items: any[]) { this.items = items.slice(0); }

  getSortedData(
    sortField: string, ascending: boolean, callback: (items: any[]) => void) {
    setTimeout(
      () => callback(
        this.items.slice(0).sort(this.comparatorFor(sortField, ascending))),
      200);
  }

  comparatorFor(sortField: string, ascending: boolean) {
    return (item1: any, item2: any) =>
      /* !== functions as XOR here */
      item1[sortField] < item2[sortField] !== ascending ? 1 : -1;
  }
}
