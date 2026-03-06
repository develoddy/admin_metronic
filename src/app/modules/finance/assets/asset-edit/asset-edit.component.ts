import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FinanceService } from '../../services/finance.service';
import { Asset, BankAccount } from '../../interfaces/finance.interface';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-asset-edit',
  templateUrl: './asset-edit.component.html',
  styleUrls: ['./asset-edit.component.scss']
})
export class AssetEditComponent implements OnInit {
  isEditMode = false;
  assetId: number | null = null;
  isLoading = false;
  isSaving = false;
  
  // Bank accounts for dropdown
  bankAccounts: BankAccount[] = [];

  // Form model
  asset: Partial<Asset> = {
    name: '',
    type: 'other',
    current_value: 0,
    bank_account_id: null,
    purchase_date: null,
    notes: '',
    is_active: true
  };

  // Type options
  assetTypes = [
    { value: 'cash', label: 'Efectivo' },
    { value: 'property', label: 'Propiedad' },
    { value: 'investment', label: 'Inversión' },
    { value: 'vehicle', label: 'Vehículo' },
    { value: 'other', label: 'Otro' }
  ];

  constructor(
    private financeService: FinanceService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadBankAccounts();
    
    this.route.params.subscribe(params => {
      if (params['id'] && params['id'] !== 'new') {
        this.isEditMode = true;
        this.assetId = +params['id'];
        this.loadAsset();
      }
    });
  }

  loadBankAccounts(): void {
    this.financeService.listBankAccounts().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.bankAccounts = response.data;
        }
      },
      error: (err) => {
        console.error('Error loading bank accounts:', err);
      }
    });
  }

  loadAsset(): void {
    if (!this.assetId) return;
    
    this.isLoading = true;
    this.financeService.getAsset(this.assetId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.asset = response.data;
          
          // Convertir fecha al formato yyyy-MM-dd para el input date
          if (this.asset.purchase_date) {
            const date = new Date(this.asset.purchase_date);
            this.asset.purchase_date = date.toISOString().split('T')[0] as any;
          }
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading asset:', err);
        Swal.fire({
          title: 'Error',
          text: 'No se pudo cargar el activo',
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
    if (!this.asset.name?.trim()) {
      Swal.fire({
        title: 'Campo requerido',
        text: 'El nombre del activo es obligatorio',
        icon: 'warning'
      });
      return;
    }

    if (!this.asset.current_value || this.asset.current_value <= 0) {
      Swal.fire({
        title: 'Valor inválido',
        text: 'El valor actual debe ser mayor a 0',
        icon: 'warning'
      });
      return;
    }

    this.isSaving = true;

    // Preparar datos (remover bank_account_id si no es tipo cash)
    const dataToSend = { 
      ...this.asset,
      current_value: parseFloat(String(this.asset.current_value || 0))
    };
    if (dataToSend.type !== 'cash') {
      dataToSend.bank_account_id = null;
    }

    const request = this.isEditMode
      ? this.financeService.updateAsset(this.assetId!, dataToSend)
      : this.financeService.createAsset(dataToSend);

    request.subscribe({
      next: (response) => {
        if (response.success) {
          Swal.fire({
            title: '¡Éxito!',
            text: this.isEditMode 
              ? 'Activo actualizado correctamente' 
              : 'Activo creado correctamente',
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
        console.error('Error saving asset:', err);
        Swal.fire({
          title: 'Error',
          text: 'No se pudo guardar el activo',
          icon: 'error'
        });
        this.isSaving = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/finance/assets']);
  }

  onTypeChange(): void {
    // Si el tipo no es cash, limpiar bank_account_id
    if (this.asset.type !== 'cash') {
      this.asset.bank_account_id = null;
    }
  }
}
