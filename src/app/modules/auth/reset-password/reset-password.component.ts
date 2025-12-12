import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { AuthService } from '../_services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { first } from 'rxjs/operators';

enum ErrorStates {
  NotSubmitted,
  HasError,
  NoError,
}

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
})
export class ResetPasswordComponent implements OnInit, OnDestroy {
  resetPasswordForm: FormGroup;
  errorState: ErrorStates = ErrorStates.NotSubmitted;
  errorStates = ErrorStates;
  isLoading$: Observable<boolean>;
  successMessage: string = '';
  errorMessage: string = '';
  token: string = '';
  passwordReset: boolean = false;
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;

  // private fields
  private unsubscribe: Subscription[] = [];
  
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.isLoading$ = this.authService.isLoading$;
  }

  ngOnInit(): void {
    this.initForm();
    // Obtener el token y email de los parámetros de ruta
    this.route.params.subscribe(params => {
      this.token = params['token'] || '';
      const email = params['email'] || '';
      
      if (!this.token) {
        // Si no hay token en params, intentar obtener de query params (compatibilidad)
        this.route.queryParams.subscribe(queryParams => {
          this.token = queryParams['token'] || '';
          if (!this.token) {
            this.errorState = ErrorStates.HasError;
            this.errorMessage = 'Token de recuperación inválido o expirado.';
          }
        });
      }
      
      // Si hay email en la URL, mostrar mensaje informativo
      if (email) {
        this.successMessage = `Restableciendo contraseña para: ${email}`;
      }
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }

  // convenience getter for easy access to form fields
  get f() {
    return this.resetPasswordForm.controls;
  }

  initForm() {
    this.resetPasswordForm = this.fb.group({
      password: [
        '',
        Validators.compose([
          Validators.required,
          Validators.minLength(6),
          Validators.maxLength(100),
        ]),
      ],
      confirmPassword: [
        '',
        Validators.compose([
          Validators.required,
        ]),
      ],
    }, { validator: this.passwordMatchValidator });
  }

  // Custom validator to check if passwords match
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ mismatch: true });
    } else {
      if (confirmPassword && confirmPassword.errors) {
        delete confirmPassword.errors['mismatch'];
        if (Object.keys(confirmPassword.errors).length === 0) {
          confirmPassword.setErrors(null);
        }
      }
    }
    return null;
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  submit() {
    this.errorState = ErrorStates.NotSubmitted;
    this.errorMessage = '';
    this.successMessage = '';
    
    if (this.resetPasswordForm.invalid) {
      this.errorState = ErrorStates.HasError;
      this.errorMessage = 'Por favor completa todos los campos correctamente';
      return;
    }

    if (!this.token) {
      this.errorState = ErrorStates.HasError;
      this.errorMessage = 'Token de recuperación no válido';
      return;
    }

    const resetPasswordSubscr = this.authService
      .resetPassword(this.token, this.f.password.value)
      .pipe(first())
      .subscribe({
        next: (response: any) => {
          if (response && !response.error) {
            this.errorState = ErrorStates.NoError;
            this.passwordReset = true;
            this.successMessage = 'Tu contraseña ha sido restablecida correctamente.';
          } else {
            this.errorState = ErrorStates.HasError;
            this.errorMessage = response.message || 'Error al restablecer la contraseña. Por favor inténtalo de nuevo.';
          }
        },
        error: (error) => {
          this.errorState = ErrorStates.HasError;
          if (error.status === 400) {
            this.errorMessage = 'El token de recuperación ha expirado o es inválido.';
          } else {
            this.errorMessage = 'Error al procesar la solicitud. Por favor inténtalo de nuevo.';
          }
          console.error('Reset password error:', error);
        }
      });
    this.unsubscribe.push(resetPasswordSubscr);
  }

  goToLogin() {
    this.router.navigate(['/auth/login']);
  }

  requestNewToken() {
    this.router.navigate(['/auth/forgot-password']);
  }
}