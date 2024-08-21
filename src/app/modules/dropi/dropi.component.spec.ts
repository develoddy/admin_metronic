import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DropiComponent } from './dropi.component';

describe('DropiComponent', () => {
  let component: DropiComponent;
  let fixture: ComponentFixture<DropiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DropiComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DropiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
