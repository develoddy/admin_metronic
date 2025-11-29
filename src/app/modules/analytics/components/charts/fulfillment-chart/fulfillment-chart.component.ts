import { Component, OnInit, Input, ViewChild } from '@angular/core';
import {
  ChartComponent,
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexYAxis,
  ApexDataLabels,
  ApexTooltip,
  ApexStroke,
  ApexLegend,
  ApexGrid,
  ApexFill,
  ApexMarkers
} from 'ng-apexcharts';

export type FulfillmentChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  dataLabels: ApexDataLabels;
  tooltip: ApexTooltip;
  stroke: ApexStroke;
  legend: ApexLegend;
  grid: ApexGrid;
  fill: ApexFill;
  markers: ApexMarkers;
  colors: string[];
};

@Component({
  selector: 'app-fulfillment-chart',
  template: `
    <div class="fulfillment-chart-container">
      <div class="chart-header">
        <h3 class="chart-title">
          <mat-icon>schedule</mat-icon>
          Tiempo de Fulfillment
        </h3>
        <p class="chart-subtitle">Tiempo promedio de procesamiento (horas)</p>
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
          [stroke]="chartOptions.stroke"
          [legend]="chartOptions.legend"
          [grid]="chartOptions.grid"
          [fill]="chartOptions.fill"
          [markers]="chartOptions.markers"
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
    .fulfillment-chart-container {
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
        color: #00BCD4;
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
export class FulfillmentChartComponent implements OnInit {
  @ViewChild('chart') chart: ChartComponent;
  @Input() data: any[] = [];
  @Input() loading: boolean = false;

  public chartOptions: FulfillmentChartOptions;
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
          name: 'Tiempo Fulfillment',
          data: []
        }
      ],
      chart: {
        height: 350,
        type: 'area',
        toolbar: {
          show: true,
          tools: {
            download: true,
            selection: false,
            zoom: true,
            zoomin: true,
            zoomout: true,
            pan: false,
            reset: true
          }
        },
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 800
        }
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: 'smooth',
        width: 3
      },
      markers: {
        size: 4,
        colors: ['#00BCD4'],
        strokeColors: '#fff',
        strokeWidth: 2,
        hover: {
          size: 6
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
            if (value < 24) {
              return value.toFixed(1) + ' hrs';
            } else {
              const days = Math.floor(value / 24);
              const hours = Math.round(value % 24);
              return `${days}d ${hours}h`;
            }
          }
        }
      },
      tooltip: {
        x: {
          format: 'dd MMM yyyy'
        },
        y: {
          formatter: (value) => {
            if (value < 24) {
              return value.toFixed(1) + ' horas';
            } else {
              const days = Math.floor(value / 24);
              const hours = Math.round(value % 24);
              return `${days} días ${hours} horas`;
            }
          }
        }
      },
      legend: {
        show: false
      },
      grid: {
        borderColor: '#e0e0e0',
        strokeDashArray: 4
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.7,
          opacityTo: 0.3,
          stops: [0, 90, 100]
        }
      },
      colors: ['#00BCD4']
    };

    this.updateChart();
  }

  private updateChart(): void {
    if (!this.data || this.data.length === 0) {
      this.hasData = false;
      return;
    }

    this.hasData = true;

    const fulfillmentData = this.data.map(item => ({
      x: new Date(item.date).getTime(),
      y: parseFloat(item.avgFulfillmentTime) || 0
    }));

    this.chartOptions.series = [
      { name: 'Tiempo Fulfillment', data: fulfillmentData }
    ];
  }
}
