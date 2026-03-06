import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FinanceService } from '../../services/finance.service';
import { ACCOUNT_TYPES, CURRENCIES } from '../../interfaces/finance.interface';

@Component({
  selector: 'app-bank-account-edit',
  templateUrl: './bank-account-edit.component.html',
  styleUrls: ['./bank-account-edit.component.scss']
})
export class BankAccountEditComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  form: FormGroup;
  accountId: number | null = null;
  isEditMode = false;
  isSubmitting = false;
  error: string | null = null;

  accountTypes = ACCOUNT_TYPES;
  currencies = CURRENCIES;

  constructor(
    private fb: FormBuilder,
    private financeService: FinanceService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      bank_name: ['', [Validators.maxLength(100)]],
      account_type: ['checking', Validators.required],
      balance: [0, [Validators.required, Validators.min(0)]],
      currency: ['EUR', Validators.required],
      is_active: [true],
      notes: ['']
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.accountId = parseInt(id, 10);
      this.isEditMode = true;
      this.loadAccount();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAccount(): void {
    if (!this.accountId) return;

    this.financeService.getBankAccount(this.accountId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.form.patchValue(response.data);
          }
        },
        error: (err) => {
          console.error('Error loading account:', err);
          this.error = 'Error al cargar la cuenta';
        }
      });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.error = null;

    const data = this.form.value;
    const operation = this.isEditMode && this.accountId
      ? this.financeService.updateBankAccount(this.accountId, data)
      : this.financeService.createBankAccount(data);

    operation
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.router.navigate(['/finance/bank-accounts']);
        },
        error: (err) => {
          console.error('Error saving account:', err);
          this.error = 'Error al guardar la cuenta';
          this.isSubmitting = false;
        }
      });
  }

  cancel(): void {
    this.router.navigate(['/finance/bank-accounts']);
  }

  getAccountTypeLabel(type: string): string {
    const item = this.accountTypes.find(t => t.value === type);
    return item ? item.label : type;
  }
}
