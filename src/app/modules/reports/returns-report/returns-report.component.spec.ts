import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReturnsReportComponent } from './returns-report.component';

describe('ReturnsReportComponent', () => {
  let component: ReturnsReportComponent;
  let fixture: ComponentFixture<ReturnsReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReturnsReportComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReturnsReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
