import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PrecenseModalPage } from './precense-modal.page';

describe('PrecenseModalPage', () => {
  let component: PrecenseModalPage;
  let fixture: ComponentFixture<PrecenseModalPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PrecenseModalPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
