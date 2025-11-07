import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InboxListingComponent } from './inbox-listing.component';

describe('InboxListingComponent', () => {
  let component: InboxListingComponent;
  let fixture: ComponentFixture<InboxListingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InboxListingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InboxListingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
