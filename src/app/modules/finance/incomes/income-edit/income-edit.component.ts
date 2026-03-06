import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FinanceService } from '../../services/finance.service';
import { AlertService } from '../../services/alert.service';
import { BankAccount, INCOME_CATEGORIES, RECURRENCE_TYPES } from '../../interfaces/finance.interface';

@Component({
  selector: 'app-income-edit',
  templateUrl: './income-edit.component.html',
  styleUrls: ['./income-edit.component.scss']
})
export class IncomeEditComponent implements OnInit {
  form: FormGroup;
  isEditMode = false;
  incomeId: number;
  loading = false;
  bankAccounts: BankAccount[] = [];
  categories = INCOME_CATEGORIES;
  recurrenceTypes = RECURRENCE_TYPES;

  constructor(
    private fb: FormBuilder,
    private financeService: FinanceService,
    private route: ActivatedRoute,
    private router: Router,
    private alertService: AlertService
  ) {
    this.form = this.fb.group({
      bank_account_id: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      description: ['', [Validators.required, Validators.maxLength(255)]],
      category: ['salary', Validators.required],
      date: ['', Validators.required],
      is_recurring: [false],
      recurrence_type: ['none'],
      tags: [''],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loadBankAccounts();
    
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEditMode = true;
      this.incomeId = +id;
      this.loadIncome();
    } else {
      // Set default date to today
      const today = new Date().toISOString().split('T')[0];
      this.form.patchValue({ date: today });
    }

    // Watch for is_recurring changes
    this.form.get('is_recurring')?.valueChanges.subscribe(isRecurring => {
      if (!isRecurring) {
        this.form.patchValue({ recurrence_type: 'none' });
      } else if (this.form.get('recurrence_type')?.value === 'none') {
        this.form.patchValue({ recurrence_type: 'monthly' });
      }
    });
  }

  loadBankAccounts(): void {
    this.financeService.getBankAccounts().subscribe({
      next: (response) => {
        this.bankAccounts = response.data || [];
        // Select first active account by default if creating new
        if (!this.isEditMode && this.bankAccounts.length > 0) {
          const activeAccount = this.bankAccounts.find(acc => acc.is_active) || this.bankAccounts[0];
          this.form.patchValue({ bank_account_id: activeAccount.id });
        }
      },
      error: (error) => {
        console.error('Error loading bank accounts:', error);
      }
    });
  }

  loadIncome(): void {
    this.loading = true;
    this.financeService.getIncome(this.incomeId).subscribe({
      next: (response) => {
        const income = response.data;
        // Format date for input[type="date"]
        const formattedDate = income.date ? income.date.split('T')[0] : '';
        this.form.patchValue({
          ...income,
          date: formattedDate
        });
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading income:', error);
        this.alertService.error('Error al cargar', 'No se pudo cargar el ingreso');
        this.router.navigate(['/finance/incomes']);
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    const formData = this.form.value;

    const request = this.isEditMode
      ? this.financeService.updateIncome(this.incomeId, formData)
      : this.financeService.createIncome(formData);

    request.subscribe({
      next: () => {
        this.alertService.saved('Ingreso');
        this.router.navigate(['/finance/incomes']);
      },
      error: (error) => {
        console.error('Error saving income:', error);
        this.alertService.error('Error al guardar', 'No se pudo guardar el ingreso. Verifica los datos.');
        this.loading = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/finance/incomes']);
  }

  get f() {
    return this.form.controls;
  }
}
