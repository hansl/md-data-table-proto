/* tslint:disable:no-unused-variable */

import { By }           from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import {
  beforeEach, beforeEachProviders,
  describe, xdescribe,
  expect, it, xit,
  async, inject
} from '@angular/core/testing';

import { DemoTableComponent } from './demo-table.component';

describe('Component: DemoTable', () => {
  it('should create an instance', () => {
    let component = new DemoTableComponent();
    expect(component).toBeTruthy();
  });
});
