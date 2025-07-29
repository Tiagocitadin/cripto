import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CryptoTracker } from './crypto-tracker';

describe('CryptoTracker', () => {
  let component: CryptoTracker;
  let fixture: ComponentFixture<CryptoTracker>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CryptoTracker]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CryptoTracker);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
