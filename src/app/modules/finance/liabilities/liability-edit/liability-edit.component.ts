import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FinanceService } from '../../services/finance.service';
import { Liability } from '../../interfaces/finance.interface';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-liability-edit',
  templateUrl: './liability-edit.component.html',
  styleUrls: ['../../../../../assets/css/finance/liabilities/_liability-edit.scss']
})
export class LiabilityEditComponent implements OnInit {
  isEditMode = false;
  liabilityId: number | null = null;
  isLoading = false;
  isSaving = false;

  // Form model
  liability: Partial<Liability> = {
    name: '',
    type: 'debt',
    total_amount: 0,
    remaining_amount: 0,
    monthly_payment: 0,
    interest_rate: 0,
    start_date: null,
    due_date: null,
    notes: '',
    is_active: true
  };

  // Type options
  liabilityTypes = [
    { value: 'credit_card', label: 'Tarjeta de Crédito' },
    { value: 'loan', label: 'Préstamo Personal' },
    { value: 'mortgage', label: 'Hipoteca' },
    { value: 'debt', label: 'Deuda' },
    { value: 'other', label: 'Otro' }
  ];

  constructor(
    private financeService: FinanceService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id'] && params['id'] !== 'new') {
        this.isEditMode = true;
        this.liabilityId = +params['id'];
        this.loadLiability();
      }
    });
  }

  loadLiability(): void {
    if (!this.liabilityId) return;
    
    this.isLoading = true;
    this.financeService.getLiability(this.liabilityId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.liability = response.data;
          
          // Convertir fechas al formato yyyy-MM-dd para el input date
          if (this.liability.start_date) {
            const date = new Date(this.liability.start_date);
            this.liability.start_date = date.toISOString().split('T')[0] as any;
          }
          if (this.liability.due_date) {
            const date = new Date(this.liability.due_date);
            this.liability.due_date = date.toISOString().split('T')[0] as any;
          }
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading liability:', err);
        Swal.fire({
          title: 'Error',
          text: 'No se pudo cargar el pasivo',
          icon: 'error'
        }).then(() => {
          this.goBack();
        });
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {
    // Validaciones
    if (!this.liability.name?.trim()) {
      Swal.fire({
        title: 'Campo requerido',
        text: 'El nombre del pasivo es obligatorio',
        icon: 'warning'
      });
      return;
    }

    if (!this.liability.total_amount || this.liability.total_amount <= 0) {
      Swal.fire({
        title: 'Valor inválido',
        text: 'El monto total debe ser mayor a 0',
        icon: 'warning'
      });
      return;
    }

    if (!this.liability.remaining_amount || this.liability.remaining_amount < 0) {
      Swal.fire({
        title: 'Valor inválido',
        text: 'El monto restante no puede ser negativo',
        icon: 'warning'
      });
      return;
    }

    if (this.liability.remaining_amount! > this.liability.total_amount!) {
      Swal.fire({
        title: 'Valor inválido',
        text: 'El monto restante no puede ser mayor al total',
        icon: 'warning'
      });
      return;
    }

    if (!this.liability.monthly_payment || this.liability.monthly_payment <= 0) {
      Swal.fire({
        title: 'Valor inválido',
        text: 'La cuota mensual debe ser mayor a 0',
        icon: 'warning'
      });
      return;
    }

    this.isSaving = true;

    // Asegurar que los valores numéricos sean números y no strings
    const dataToSend = {
      ...this.liability,
      total_amount: parseFloat(String(this.liability.total_amount || 0)),
      remaining_amount: parseFloat(String(this.liability.remaining_amount || 0)),
      monthly_payment: parseFloat(String(this.liability.monthly_payment || 0)),
      interest_rate: parseFloat(String(this.liability.interest_rate || 0))
    };

    const request = this.isEditMode
      ? this.financeService.updateLiability(this.liabilityId!, dataToSend)
      : this.financeService.createLiability(dataToSend);

    request.subscribe({
      next: (response) => {
        if (response.success) {
          Swal.fire({
            title: '¡Éxito!',
            text: this.isEditMode 
              ? 'Pasivo actualizado correctamente' 
              : 'Pasivo creado correctamente',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          }).then(() => {
            this.goBack();
          });
        }
        this.isSaving = false;
      },
      error: (err) => {
        console.error('Error saving liability:', err);
        Swal.fire({
          title: 'Error',
          text: 'No se pudo guardar el pasivo',
          icon: 'error'
        });
        this.isSaving = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/finance/liabilities']);
  }

  onTotalAmountChange(): void {
    // Si remaining_amount es mayor que total_amount, ajustar
    if (this.liability.remaining_amount! > this.liability.total_amount!) {
      this.liability.remaining_amount = this.liability.total_amount;
    }
  }

  getPaymentProgress(): number {
    if (!this.liability.total_amount || this.liability.total_amount === 0) return 0;
    const paid = this.liability.total_amount - (this.liability.remaining_amount || 0);
    return Math.round((paid / this.liability.total_amount) * 100);
  }
}
