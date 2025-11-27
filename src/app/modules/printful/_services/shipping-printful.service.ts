import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/modules/auth';

interface ShippingRecipient {
  country_code: string;
  state_code?: string;
  city: string;
  zip: string;
}

interface ShippingItem {
  variant_id: number;
  quantity: number;
}

interface ShippingRate {
  id: string;
  name: string;
  rate: string;
  currency: string;
  minDeliveryDays: number;
  maxDeliveryDays: number;
  speed_label?: string;
  recommended?: boolean;
  estimated_days_avg?: number;
  description_es?: string;
}

interface ShippingRatesResponse {
  success: boolean;
  rates: ShippingRate[];
  summary: {
    cheapest: ShippingRate;
    fastest: ShippingRate;
    recommended: ShippingRate;
  };
}

interface Country {
  code: string;
  name: string;
  states?: any[];
}

interface CountriesResponse {
  success: boolean;
  countries: Country[];
}

interface CountryStatesResponse {
  success: boolean;
  country: Country;
  states: any[];
}

@Injectable({
  providedIn: 'root'
})
export class ShippingPrintfulService {
  private apiUrl = `${environment.URL_SERVICIOS}/printful/shipping`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'token': this.authService.token
    });
  }

  /**
   * Calcula tarifas de envío para una orden
   */
  calculateRates(recipient: ShippingRecipient, items: ShippingItem[]): Observable<ShippingRatesResponse> {
    return this.http.post<ShippingRatesResponse>(`${this.apiUrl}/rates`, {
      recipient,
      items
    }, {
      headers: this.getHeaders()
    });
  }

  /**
   * Obtiene lista de países disponibles
   */
  getCountries(): Observable<CountriesResponse> {
    return this.http.get<CountriesResponse>(`${this.apiUrl}/countries`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Obtiene estados/provincias de un país
   */
  getCountryStates(countryCode: string): Observable<CountryStatesResponse> {
    return this.http.get<CountryStatesResponse>(`${this.apiUrl}/countries/${countryCode}/states`, {
      headers: this.getHeaders()
    });
  }
}
