import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShippingTrackingComponent } from './shipping-tracking.component';

describe('ShippingTrackingComponent', () => {
  let component: ShippingTrackingComponent;
  let fixture: ComponentFixture<ShippingTrackingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ShippingTrackingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ShippingTrackingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
