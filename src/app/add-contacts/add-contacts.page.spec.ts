import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddContactsPage } from './add-contacts.page';

describe('AddContactsPage', () => {
  let component: AddContactsPage;
  let fixture: ComponentFixture<AddContactsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AddContactsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
