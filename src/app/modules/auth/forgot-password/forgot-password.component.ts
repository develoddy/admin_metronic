import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { AuthService } from '../_services/auth.service';
import { Router } from '@angular/router';
import { first } from 'rxjs/operators';

enum ErrorStates {
  NotSubmitted,
  HasError,
  NoError,
}

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
})
export class ForgotPasswordComponent implements OnInit, OnDestroy {
  forgotPasswordForm: FormGroup;
  errorState: ErrorStates = ErrorStates.NotSubmitted;
  errorStates = ErrorStates;
  isLoading$: Observable<boolean>;
  successMessage: string = '';
  errorMessage: string = '';
  emailSent: boolean = false;

  // private fields
  private unsubscribe: Subscription[] = [];
  
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.isLoading$ = this.authService.isLoading$;
  }

  ngOnInit(): void {
    this.initForm();
  }

  ngOnDestroy(): void {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }

  // convenience getter for easy access to form fields
  get f() {
    return this.forgotPasswordForm.controls;
  }

  initForm() {
    this.forgotPasswordForm = this.fb.group({
      email: [
        '',
        Validators.compose([
          Validators.required,
          Validators.email,
          Validators.minLength(3),
          Validators.maxLength(320),
        ]),
      ],
    });
  }

  submit() {
    this.errorState = ErrorStates.NotSubmitted;
    this.errorMessage = '';
    this.successMessage = '';
    
    if (this.forgotPasswordForm.invalid) {
      this.errorState = ErrorStates.HasError;
      this.errorMessage = 'Por favor ingresa un email válido';
      return;
    }

    const forgotPasswordSubscr = this.authService
      .requestPasswordReset(this.f.email.value)
      .pipe(first())
      .subscribe({
        next: (response: any) => {
          if (response && !response.error) {
            this.errorState = ErrorStates.NoError;
            this.emailSent = true;
            this.successMessage = 'Se ha enviado un email con las instrucciones para restablecer tu contraseña.';
          } else {
            this.errorState = ErrorStates.HasError;
            this.errorMessage = response.message || 'Error al enviar el email. Por favor inténtalo de nuevo.';
          }
        },
        error: (error) => {
          this.errorState = ErrorStates.HasError;
          this.errorMessage = 'Error al procesar la solicitud. Por favor inténtalo de nuevo.';
          console.error('Forgot password error:', error);
        }
      });
    this.unsubscribe.push(forgotPasswordSubscr);
  }

  goBackToLogin() {
    this.router.navigate(['/auth/login']);
  }

  resendEmail() {
    this.emailSent = false;
    this.submit();
  }
}
