import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Subscription, Observable } from 'rxjs';
import { AuthService } from '../_services/auth.service';
import { Router } from '@angular/router';
import { ConfirmPasswordValidator } from './confirm-password.validator';
import { UserModel } from '../_models/user.model';
import { first } from 'rxjs/operators';
import { ReCaptchaV3Service } from 'ng-recaptcha';

@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.scss'],
})
export class RegistrationComponent implements OnInit, OnDestroy {
  registrationForm: FormGroup;
  hasError: boolean;
  isLoading$: Observable<boolean>;
  
  // Estados de registro
  isRegistrationComplete: boolean = false;
  isAutoLoggingIn: boolean = false;
  successMessage: string = '';
  countdownTimer: number = 5;

  // private fields
  private unsubscribe: Subscription[] = []; // Read more: => https://brianflove.com/2016/12/11/anguar-2-unsubscribe-observables/

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private recaptchaV3Service: ReCaptchaV3Service
  ) {
    this.isLoading$ = this.authService.isLoading$;
    // redirect to home if already logged in
    if (this.authService.currentUserValue) {
      this.router.navigate(['/']);
    }
  }

  ngOnInit(): void {
    this.initForm();
  }

  // convenience getter for easy access to form fields
  get f() {
    return this.registrationForm.controls;
  }

  initForm() {
    this.registrationForm = this.fb.group(
      {
        name: [
          '',
          Validators.compose([
            Validators.required,
            Validators.minLength(3),
            Validators.maxLength(100),
          ]),
        ],
        email: [
          'qwe@qwe.qwe',
          Validators.compose([
            Validators.required,
            Validators.email,
            Validators.minLength(3),
            Validators.maxLength(320), // https://stackoverflow.com/questions/386294/what-is-the-maximum-length-of-a-valid-email-address
          ]),
        ],
        password: [
          '',
          Validators.compose([
            Validators.required,
            Validators.minLength(3),
            Validators.maxLength(100),
          ]),
        ],
        cPassword: [
          '',
          Validators.compose([
            Validators.required,
            Validators.minLength(3),
            Validators.maxLength(100),
          ]),
        ],
        agree: [false, Validators.compose([Validators.required])],
      },
      {
        validator: ConfirmPasswordValidator.MatchPassword,
      }
    );
  }

  submit() {
    this.hasError = false;

    // Ejecutar reCAPTCHA v3 antes de enviar datos
    this.recaptchaV3Service.execute('registro_admin').subscribe((token: string) => {
      const result = {};
      Object.keys(this.f).forEach(key => {
        result[key] = this.f[key].value;
      });
      const newUser = new UserModel();
      newUser.setUser(result);

      // ✅ Añadimos el token reCAPTCHA
      newUser['recaptchaToken'] = token;
      
      const registrationSubscr = this.authService
        .registration(newUser)
        .pipe(first())
        .subscribe({
          next: (user: UserModel) => {
            console.log('Registration response:', user);
            if (user) {
              // Mostrar éxito inmediatamente
              this.showSuccessAndRedirect();
            } else {
              this.hasError = true;
            }
          },
          error: (error) => {
            console.error('Registration error:', error);
            this.hasError = true;
          }
        });
      this.unsubscribe.push(registrationSubscr);
    });
  }

  showSuccessAndRedirect() {
    this.isRegistrationComplete = true;
    this.isAutoLoggingIn = true;
    this.successMessage = '¡Cuenta creada exitosamente! Iniciando sesión automáticamente...';
    
    console.log('Mostrando mensaje de éxito del registro');
    
    // Countdown timer con UX mejorada
    const countdown = setInterval(() => {
      this.countdownTimer--;
      
      // Actualizar mensaje según el tiempo restante
      if (this.countdownTimer === 4) {
        this.successMessage = '✅ Cuenta verificada. Configurando acceso...';
      } else if (this.countdownTimer === 3) {
        this.successMessage = '🔐 Sesión iniciada correctamente';
      } else if (this.countdownTimer === 2) {
        this.successMessage = '🚀 Preparando panel de administración...';
      } else if (this.countdownTimer === 1) {
        this.successMessage = '📊 ¡Redirigiendo al dashboard!';
      }
      
      if (this.countdownTimer <= 0) {
        clearInterval(countdown);
        
        // Verificación con fallback más suave
        const isAuthenticated = this.authService.isLogued();
        console.log('¿Usuario autenticado?', isAuthenticated);
        
        if (isAuthenticated) {
          console.log('✅ Usuario autenticado, redirigiendo al dashboard');
          this.router.navigate(['/']);
        } else {
          console.warn('⚠️ Token no detectado, intentando redirigir igual...');
          // Intentar redirigir de todas formas por si el token se guarda asincrónamente
          this.router.navigate(['/']);
        }
      }
    }, 1000);
  }

  ngOnDestroy() {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }
}
