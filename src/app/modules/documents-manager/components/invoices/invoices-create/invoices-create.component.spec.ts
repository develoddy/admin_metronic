import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvoicesCreateComponent } from './invoices-create.component';

describe('InvoicesCreateComponent', () => {
  let component: InvoicesCreateComponent;
  let fixture: ComponentFixture<InvoicesCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InvoicesCreateComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InvoicesCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
