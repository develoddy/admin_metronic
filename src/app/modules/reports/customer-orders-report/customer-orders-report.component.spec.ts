import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerOrdersReportComponent } from './customer-orders-report.component';

describe('CustomerOrdersReportComponent', () => {
  let component: CustomerOrdersReportComponent;
  let fixture: ComponentFixture<CustomerOrdersReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CustomerOrdersReportComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomerOrdersReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
