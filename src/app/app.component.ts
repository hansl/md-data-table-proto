import { Component } from '@angular/core';
import {MD_TABLE_DIRECTIVES} from "./components/table";
import {DemoTableComponent} from "./demo-table/demo-table.component";

@Component({
  moduleId: module.id,
  selector: 'app-root',
  template: `Hello! <table-demo></table-demo>`,
  directives: [MD_TABLE_DIRECTIVES, DemoTableComponent],
  styles: []
})
export class AppComponent {
}
