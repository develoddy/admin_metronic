import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';

// ApexCharts
import { NgApexchartsModule } from 'ng-apexcharts';

// Routing
import { AnalyticsRoutingModule } from './analytics-routing.module';

// Components
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { RevenueChartComponent } from './components/charts/revenue-chart/revenue-chart.component';
import { OrdersChartComponent } from './components/charts/orders-chart/orders-chart.component';
import { FulfillmentChartComponent } from './components/charts/fulfillment-chart/fulfillment-chart.component';

// Services (provided in root, no need to declare here)
// AnalyticsService is already @Injectable({ providedIn: 'root' })

@NgModule({
  declarations: [
    DashboardComponent,
    RevenueChartComponent,
    OrdersChartComponent,
    FulfillmentChartComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    
    // Angular Material Modules
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatTooltipModule,
    MatChipsModule,
    MatMenuModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    
    // ApexCharts
    NgApexchartsModule,
    
    // Routing
    AnalyticsRoutingModule
  ]
})
export class AnalyticsModule { }
