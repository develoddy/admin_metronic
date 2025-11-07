import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShippingReportComponent } from './shipping-report.component';

describe('ShippingReportComponent', () => {
  let component: ShippingReportComponent;
  let fixture: ComponentFixture<ShippingReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ShippingReportComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ShippingReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
