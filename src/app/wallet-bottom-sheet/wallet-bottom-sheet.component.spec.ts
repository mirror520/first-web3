import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WalletBottomSheetComponent } from './wallet-bottom-sheet.component';

describe('WalletBottomSheetComponent', () => {
  let component: WalletBottomSheetComponent;
  let fixture: ComponentFixture<WalletBottomSheetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WalletBottomSheetComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(WalletBottomSheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
