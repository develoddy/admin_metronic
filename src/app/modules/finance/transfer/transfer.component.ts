import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FinanceService } from '../services/finance.service';
import { AlertService } from '../services/alert.service';
import { BankAccount, RECURRENCE_TYPES, InternalTransferRequest } from '../interfaces/finance.interface';

@Component({
  selector: 'app-transfer',
  templateUrl: './transfer.component.html',
  styleUrls: ['./transfer.component.scss']
})
export class TransferComponent implements OnInit {
  form: FormGroup;
  loading = false;
  bankAccounts: BankAccount[] = [];
  filteredTargetAccounts: BankAccount[] = [];
  selectedSourceAccount: BankAccount | null = null;
  selectedTargetAccount: BankAccount | null = null;
  recurrenceTypes = RECURRENCE_TYPES;

  constructor(
    private fb: FormBuilder,
    private financeService: FinanceService,
    private router: Router,
    private alertService: AlertService,
    private cd: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      is_external: [false],
      external_recipient: [''],
      source_account_id: ['', Validators.required],
      target_account_id: [''],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      description: [''],
      date: ['', Validators.required],
      is_recurring: [false],
      recurrence_type: ['none'],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loadBankAccounts();
    
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    this.form.patchValue({ date: today });

    // Watch is_external to update validations
    this.form.get('is_external')?.valueChanges.subscribe((isExternal) => {
      this.onTransferTypeChange(isExternal);
    });

    // Watch source and target account changes
    this.form.get('source_account_id')?.valueChanges.subscribe(() => {
      this.updateSelectedAccounts();
    });

    this.form.get('target_account_id')?.valueChanges.subscribe(() => {
      this.updateSelectedAccounts();
    });
  }

  onTransferTypeChange(isExternal: boolean): void {
    const targetAccountControl = this.form.get('target_account_id');
    const externalRecipientControl = this.form.get('external_recipient');

    if (isExternal) {
      // Transferencia externa: target_account_id opcional, external_recipient recomendado
      targetAccountControl?.clearValidators();
      targetAccountControl?.setValue('');
      externalRecipientControl?.setValidators([Validators.required]);
    } else {
      // Transferencia interna: target_account_id requerido
      targetAccountControl?.setValidators([Validators.required]);
      externalRecipientControl?.clearValidators();
      externalRecipientControl?.setValue('');
    }

    targetAccountControl?.updateValueAndValidity();
    externalRecipientControl?.updateValueAndValidity();
    this.cd.detectChanges();
  }

  loadBankAccounts(): void {
    this.financeService.getBankAccounts().subscribe({
      next: (response) => {
        this.bankAccounts = response.data.filter((acc: BankAccount) => acc.is_active);
        this.filteredTargetAccounts = this.bankAccounts;
        console.log('✅ Cuentas cargadas:', this.bankAccounts.length);
        this.cd.detectChanges();
      },
      error: (error) => {
        console.error('Error loading bank accounts:', error);
        this.alertService.error('Error', 'No se pudieron cargar las cuentas bancarias');
      }
    });
  }

  onSourceAccountChange(): void {
    const sourceId = this.form.get('source_account_id')?.value;
    
    console.log('🔄 Cuenta origen seleccionada:', sourceId);
    
    // Filter out the source account from target accounts
    this.filteredTargetAccounts = this.bankAccounts.filter(
      acc => acc.id?.toString() !== sourceId
    );
    
    console.log('  Cuentas destino disponibles:', this.filteredTargetAccounts.length);
    
    // Reset target account if it's the same as source
    if (this.form.get('target_account_id')?.value === sourceId) {
      this.form.patchValue({ target_account_id: '' });
    }
    
    this.updateSelectedAccounts();
    this.cd.detectChanges();
  }

  updateSelectedAccounts(): void {
    const sourceId = this.form.get('source_account_id')?.value;
    const targetId = this.form.get('target_account_id')?.value;
    
    this.selectedSourceAccount = this.bankAccounts.find(acc => acc.id?.toString() === sourceId) || null;
    this.selectedTargetAccount = this.bankAccounts.find(acc => acc.id?.toString() === targetId) || null;
    
    console.log('📊 Cuenta origen:', this.selectedSourceAccount?.name);
    console.log('📊 Cuenta destino:', this.selectedTargetAccount?.name);
    
    this.cd.detectChanges();
  }

  onAmountChange(): void {
    this.cd.detectChanges();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // Validate sufficient balance
    const amount = parseFloat(this.form.get('amount')?.value || 0);
    if (this.selectedSourceAccount && amount > parseFloat(this.selectedSourceAccount.balance.toString())) {
      this.alertService.error(
        'Saldo Insuficiente',
        `No tienes saldo suficiente en ${this.selectedSourceAccount.name}. Saldo disponible: ${this.formatCurrency(this.selectedSourceAccount.balance)}`
      );
      return;
    }

    const isExternal = this.form.get('is_external')?.value;
    const externalRecipient = this.form.get('external_recipient')?.value;

    // Confirm transfer
    let confirmMessage = '';
    if (isExternal) {
      confirmMessage = `¿Deseas transferir ${this.formatCurrency(amount)} de ${this.selectedSourceAccount?.name} a ${externalRecipient || 'destinatario externo'}? Esta transferencia contará como gasto.`;
    } else {
      confirmMessage = `¿Deseas transferir ${this.formatCurrency(amount)} de ${this.selectedSourceAccount?.name} a ${this.selectedTargetAccount?.name}? Esta es una transferencia entre tus cuentas.`;
    }

    this.alertService.confirm(
      '¿Confirmar Transferencia?',
      confirmMessage,
      'Sí, transferir',
      'Cancelar',
      '#1e3a8a'
    ).then((result) => {
      if (result.isConfirmed) {
        this.executeTransfer();
      }
    });
  }

  executeTransfer(): void {
    this.loading = true;
    
    const isExternal = this.form.get('is_external')?.value;
    const targetAccountId = this.form.get('target_account_id')?.value;

    const transferData: InternalTransferRequest = {
      source_account_id: parseInt(this.form.get('source_account_id')?.value),
      amount: parseFloat(this.form.get('amount')?.value),
      description: this.form.get('description')?.value || undefined,
      date: this.form.get('date')?.value,
      is_recurring: this.form.get('is_recurring')?.value || false,
      recurrence_type: this.form.get('recurrence_type')?.value || 'none',
      notes: this.form.get('notes')?.value || undefined,
      is_external: isExternal,
      external_recipient: isExternal ? this.form.get('external_recipient')?.value : undefined,
      target_account_id: !isExternal && targetAccountId ? parseInt(targetAccountId) : undefined
    };

    this.financeService.createInternalTransfer(transferData).subscribe({
      next: (response) => {
        const transferType = isExternal ? 'externa' : 'interna';
        this.alertService.success(
          '¡Transferencia Exitosa!',
          `Se realizó la transferencia ${transferType} de ${this.formatCurrency(transferData.amount)} exitosamente`
        );
        this.router.navigate(['/finance/dashboard']);
      },
      error: (error) => {
        console.error('Error creating transfer:', error);
        this.alertService.error(
          'Error',
          error.error?.message || 'No se pudo realizar la transferencia. Intenta nuevamente.'
        );
        this.loading = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/finance/dashboard']);
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
