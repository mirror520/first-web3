import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransactionSnackbarComponent } from './transaction-snackbar.component';

describe('TransactionSnackbarComponent', () => {
  let component: TransactionSnackbarComponent;
  let fixture: ComponentFixture<TransactionSnackbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransactionSnackbarComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TransactionSnackbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
