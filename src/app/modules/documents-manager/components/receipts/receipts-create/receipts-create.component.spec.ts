import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReceiptsCreateComponent } from './receipts-create.component';

describe('ReceiptsCreateComponent', () => {
  let component: ReceiptsCreateComponent;
  let fixture: ComponentFixture<ReceiptsCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReceiptsCreateComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReceiptsCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
