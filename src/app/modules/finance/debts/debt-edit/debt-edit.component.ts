import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FinanceService } from '../../services/finance.service';
import { AlertService } from '../../services/alert.service';
import { BankAccount, DEBT_TYPES, DEBT_STATUS, DEBT_PRIORITIES } from '../../interfaces/finance.interface';

@Component({
  selector: 'app-debt-edit',
  templateUrl: './debt-edit.component.html',
  styleUrls: ['../../../../../assets/css/finance/debts/_debt-edit.scss']
})
export class DebtEditComponent implements OnInit {
  form: FormGroup;
  isEditMode = false;
  debtId: number;
  loading = false;
  debtTypes = DEBT_TYPES;
  debtStatus = DEBT_STATUS;
  debtPriorities = DEBT_PRIORITIES;
  bankAccounts: BankAccount[] = [];

  constructor(
    private fb: FormBuilder,
    private financeService: FinanceService,
    private route: ActivatedRoute,
    private router: Router,
    private alertService: AlertService
  ) {
    this.form = this.fb.group({
      debt_type: ['credit_card', Validators.required],
      creditor: ['', [Validators.required, Validators.maxLength(100)]],
      bank_account_id: [null], // Opcional
      original_amount: ['', [Validators.required, Validators.min(0.01)]],
      remaining_balance: ['', [Validators.required, Validators.min(0)]],
      interest_rate: ['', [Validators.required, Validators.min(0), Validators.max(100)]],
      monthly_payment: ['', [Validators.required, Validators.min(0.01)]],
      start_date: ['', Validators.required],
      due_date: [''],
      status: ['active', Validators.required],
      priority: ['medium', Validators.required],
      notes: ['']
    });
  }

  ngOnInit(): void {
    // Cargar cuentas bancarias
    this.loadBankAccounts();

    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEditMode = true;
      this.debtId = +id;
      this.loadDebt();
    } else {
      // Set default start date to today
      const today = new Date().toISOString().split('T')[0];
      this.form.patchValue({ start_date: today });
    }

    // Watch for original_amount changes to auto-fill remaining_balance in create mode
    if (!this.isEditMode) {
      this.form.get('original_amount')?.valueChanges.subscribe(value => {
        if (value && !this.form.get('remaining_balance')?.value) {
          this.form.patchValue({ remaining_balance: value });
        }
      });
    }
  }

  loadBankAccounts(): void {
    this.financeService.getBankAccounts().subscribe({
      next: (response) => {
        this.bankAccounts = response.data.filter((acc: BankAccount) => acc.is_active);
      },
      error: (error) => {
        console.error('Error loading bank accounts:', error);
      }
    });
  }

  loadDebt(): void {
    this.loading = true;
    this.financeService.getDebt(this.debtId).subscribe({
      next: (response) => {
        const debt = response.data;
        // Format dates for input[type="date"]
        const formattedStartDate = debt.start_date ? debt.start_date.split('T')[0] : '';
        const formattedDueDate = debt.due_date ? debt.due_date.split('T')[0] : '';
        this.form.patchValue({
          ...debt,
          start_date: formattedStartDate,
          due_date: formattedDueDate
        });
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading debt:', error);
        this.alertService.error('Error al cargar', 'No se pudo cargar la deuda');
        this.router.navigate(['/finance/debts']);
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
      ? this.financeService.updateDebt(this.debtId, formData)
      : this.financeService.createDebt(formData);

    request.subscribe({
      next: () => {
        this.alertService.saved('Deuda');
        this.router.navigate(['/finance/debts']);
      },
      error: (error) => {
        console.error('Error saving debt:', error);
        this.alertService.error('Error al guardar', 'No se pudo guardar la deuda. Verifica los datos.');
        this.loading = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/finance/debts']);
  }

  get f() {
    return this.form.controls;
  }

  getAccountIcon(accountType: string): string {
    const icons: { [key: string]: string } = {
      checking: 'bi-wallet2',
      savings: 'bi-piggy-bank-fill',
      credit: 'bi-credit-card-fill',
      investment: 'bi-graph-up-arrow',
      other: 'bi-bank'
    };
    return icons[accountType] || 'bi-bank';
  }

  formatCurrency(amount: number | string): string {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(numAmount);
  }
}
