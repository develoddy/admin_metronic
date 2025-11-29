import { Component, OnInit, Input, ViewChild } from '@angular/core';
import {
  ChartComponent,
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexYAxis,
  ApexDataLabels,
  ApexTooltip,
  ApexPlotOptions,
  ApexLegend,
  ApexGrid
} from 'ng-apexcharts';

export type OrdersChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  dataLabels: ApexDataLabels;
  tooltip: ApexTooltip;
  plotOptions: ApexPlotOptions;
  legend: ApexLegend;
  grid: ApexGrid;
  colors: string[];
};

@Component({
  selector: 'app-orders-chart',
  template: `
    <div class="orders-chart-container">
      <div class="chart-header">
        <h3 class="chart-title">
          <mat-icon>shopping_cart</mat-icon>
          Estado de Órdenes
        </h3>
        <p class="chart-subtitle">Distribución de órdenes por estado</p>
      </div>
      
      <div *ngIf="loading" class="chart-loading">
        <mat-spinner diameter="40"></mat-spinner>
        <p>Cargando datos...</p>
      </div>

      <div *ngIf="!loading && hasData" class="chart-wrapper">
        <apx-chart
          [series]="chartOptions.series"
          [chart]="chartOptions.chart"
          [xaxis]="chartOptions.xaxis"
          [yaxis]="chartOptions.yaxis"
          [dataLabels]="chartOptions.dataLabels"
          [tooltip]="chartOptions.tooltip"
          [plotOptions]="chartOptions.plotOptions"
          [legend]="chartOptions.legend"
          [grid]="chartOptions.grid"
          [colors]="chartOptions.colors"
        ></apx-chart>
      </div>

      <div *ngIf="!loading && !hasData" class="chart-empty">
        <mat-icon>insert_chart_outlined</mat-icon>
        <p>No hay datos disponibles para el período seleccionado</p>
      </div>
    </div>
  `,
  styles: [`
    .orders-chart-container {
      width: 100%;
      height: 100%;
    }

    .chart-header {
      margin-bottom: 20px;
    }

    .chart-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
      font-weight: 600;
      color: #1a1a1a;
      margin: 0 0 4px 0;

      mat-icon {
        color: #FF6D00;
        font-size: 24px;
        width: 24px;
        height: 24px;
      }
    }

    .chart-subtitle {
      font-size: 13px;
      color: #666;
      margin: 0;
    }

    .chart-loading,
    .chart-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      gap: 16px;

      p {
        color: #666;
        font-size: 14px;
      }

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: #ccc;
      }
    }

    .chart-wrapper {
      width: 100%;
      min-height: 350px;
    }
  `]
})
export class OrdersChartComponent implements OnInit {
  @ViewChild('chart') chart: ChartComponent;
  @Input() data: any[] = [];
  @Input() loading: boolean = false;

  public chartOptions: OrdersChartOptions;
  public hasData: boolean = false;

  ngOnInit(): void {
    this.initChart();
  }

  ngOnChanges(): void {
    if (this.data && this.data.length > 0) {
      this.updateChart();
    }
  }

  private initChart(): void {
    this.chartOptions = {
      series: [
        {
          name: 'Sincronizadas',
          data: []
        },
        {
          name: 'Pendientes',
          data: []
        },
        {
          name: 'Enviadas',
          data: []
        },
        {
          name: 'Entregadas',
          data: []
        },
        {
          name: 'Fallidas',
          data: []
        }
      ],
      chart: {
        type: 'bar',
        height: 350,
        stacked: true,
        toolbar: {
          show: true,
          tools: {
            download: true,
            selection: false,
            zoom: false,
            zoomin: false,
            zoomout: false,
            pan: false,
            reset: false
          }
        },
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 800
        }
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '60%'
        }
      },
      xaxis: {
        type: 'datetime',
        labels: {
          style: {
            colors: '#666',
            fontSize: '12px'
          }
        }
      },
      yaxis: {
        labels: {
          style: {
            colors: '#666',
            fontSize: '12px'
          },
          formatter: (value) => {
            return Math.round(value).toString();
          }
        }
      },
      dataLabels: {
        enabled: false
      },
      tooltip: {
        x: {
          format: 'dd MMM yyyy'
        },
        y: {
          formatter: (value) => {
            return Math.round(value) + ' órdenes';
          }
        }
      },
      legend: {
        position: 'top',
        horizontalAlign: 'right',
        floating: false,
        fontSize: '13px',
        fontWeight: 500
      },
      grid: {
        borderColor: '#e0e0e0',
        strokeDashArray: 4
      },
      colors: ['#00C853', '#FFC107', '#2196F3', '#7C4DFF', '#f44336']
    };

    this.updateChart();
  }

  private updateChart(): void {
    if (!this.data || this.data.length === 0) {
      this.hasData = false;
      return;
    }

    this.hasData = true;

    const syncedData = this.data.map(item => ({
      x: new Date(item.date).getTime(),
      y: item.syncedCount || 0
    }));

    const pendingData = this.data.map(item => ({
      x: new Date(item.date).getTime(),
      y: item.pendingCount || 0
    }));

    const shippedData = this.data.map(item => ({
      x: new Date(item.date).getTime(),
      y: item.shippedCount || 0
    }));

    const deliveredData = this.data.map(item => ({
      x: new Date(item.date).getTime(),
      y: item.deliveredCount || 0
    }));

    const failedData = this.data.map(item => ({
      x: new Date(item.date).getTime(),
      y: item.failedCount || 0
    }));

    this.chartOptions.series = [
      { name: 'Sincronizadas', data: syncedData },
      { name: 'Pendientes', data: pendingData },
      { name: 'Enviadas', data: shippedData },
      { name: 'Entregadas', data: deliveredData },
      { name: 'Fallidas', data: failedData }
    ];
  }
}
