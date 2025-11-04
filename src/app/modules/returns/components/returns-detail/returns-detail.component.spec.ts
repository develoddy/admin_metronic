import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReturnsDetailComponent } from './returns-detail.component';

describe('ReturnsDetailComponent', () => {
  let component: ReturnsDetailComponent;
  let fixture: ComponentFixture<ReturnsDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReturnsDetailComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReturnsDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
