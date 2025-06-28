import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookSoilComponent } from './book-soil.component';

describe('BookSoilComponent', () => {
  let component: BookSoilComponent;
  let fixture: ComponentFixture<BookSoilComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookSoilComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BookSoilComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
