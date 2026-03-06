import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FinanceService } from '../../services/finance.service';
import { AlertService } from '../../services/alert.service';
import { BankAccount, EXPENSE_CATEGORIES, PAYMENT_METHODS } from '../../interfaces/finance.interface';

@Component({
  selector: 'app-expense-edit',
  templateUrl: './expense-edit.component.html',
  styleUrls: ['../../../../../assets/css/finance/expenses/_expense-edit.scss']
})
export class ExpenseEditComponent implements OnInit {
  form: FormGroup;
  isEditMode = false;
  expenseId: number;
  loading = false;
  bankAccounts: BankAccount[] = [];
  categories = EXPENSE_CATEGORIES;
  paymentMethods = PAYMENT_METHODS;

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
      category: ['food', Validators.required],
      date: ['', Validators.required],
      is_essential: [false],
      payment_method: ['debit_card'],
      receipt_url: [''],
      tags: [''],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loadBankAccounts();
    
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEditMode = true;
      this.expenseId = +id;
      this.loadExpense();
    } else {
      // Set default date to today
      const today = new Date().toISOString().split('T')[0];
      this.form.patchValue({ date: today });
    }
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

  loadExpense(): void {
    this.loading = true;
    this.financeService.getExpense(this.expenseId).subscribe({
      next: (response) => {
        const expense = response.data;
        // Format date for input[type="date"]
        const formattedDate = expense.date ? expense.date.split('T')[0] : '';
        this.form.patchValue({
          ...expense,
          date: formattedDate
        });
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading expense:', error);
        this.alertService.error('Error al cargar', 'No se pudo cargar el gasto');
        this.router.navigate(['/finance/expenses']);
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
      ? this.financeService.updateExpense(this.expenseId, formData)
      : this.financeService.createExpense(formData);

    request.subscribe({
      next: () => {
        this.alertService.saved('Gasto');
        this.router.navigate(['/finance/expenses']);
      },
      error: (error) => {
        console.error('Error saving expense:', error);
        this.alertService.error('Error al guardar', 'No se pudo guardar el gasto. Verifica los datos.');
        this.loading = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/finance/expenses']);
  }

  get f() {
    return this.form.controls;
  }
}
