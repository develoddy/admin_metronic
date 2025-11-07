import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InboxContentComponent } from './inbox-content.component';

describe('InboxContentComponent', () => {
  let component: InboxContentComponent;
  let fixture: ComponentFixture<InboxContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InboxContentComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InboxContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
