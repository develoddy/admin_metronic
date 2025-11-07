import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReceiptsViewComponent } from './receipts-view.component';

describe('ReceiptsViewComponent', () => {
  let component: ReceiptsViewComponent;
  let fixture: ComponentFixture<ReceiptsViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReceiptsViewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReceiptsViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
