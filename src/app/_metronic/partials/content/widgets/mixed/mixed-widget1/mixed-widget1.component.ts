import { Component, OnInit } from '@angular/core';
import { LayoutService } from '../../../../../core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-mixed-widget1',
  templateUrl: './mixed-widget1.component.html',
})
export class MixedWidget1Component implements OnInit {
  chartOptions: any = {};
  fontFamily = '';
  colorsGrayGray500 = '';
  colorsGrayGray200 = '';
  colorsGrayGray300 = '';
  colorsThemeBaseDanger = '';

  constructor(private layout: LayoutService, private router: Router) {
    this.fontFamily = this.layout.getProp('js.fontFamily');
    this.colorsGrayGray500 = this.layout.getProp('js.colors.gray.gray500');
    this.colorsGrayGray200 = this.layout.getProp('js.colors.gray.gray200');
    this.colorsGrayGray300 = this.layout.getProp('js.colors.gray.gray300');
    this.colorsThemeBaseDanger = this.layout.getProp(
      'js.colors.theme.base.danger'
    );
  }

  ngOnInit(): void {
    this.chartOptions = this.getChartOptions();
  }

  goToNewUsers(event: Event) {
    event.preventDefault();
    this.router.navigate(['/users/list']);
  }

  goToSales(event: Event) {
    event.preventDefault(); // evita que el <a> recargue la página
    this.router.navigate(['/sales/list'], { queryParams: { timeFilter: 'All' } }); // redirige a tu módulo de sales
  }

  goToReturns(event: Event) {
    event.preventDefault();
    this.router.navigate(['/returns/list']);
  }


  getChartOptions() {
    const strokeColor = '#D13647';
    return {
      series: [
        {
          name: 'Net Profit',
          data: [30, 45, 32, 70, 40, 40, 40],
        },
      ],
      chart: {
        type: 'area',
        height: 200,
        toolbar: {
          show: false,
        },
        zoom: {
          enabled: false,
        },
        sparkline: {
          enabled: true,
        },
        dropShadow: {
          enabled: true,
          enabledOnSeries: undefined,
          top: 5,
          left: 0,
          blur: 3,
          color: strokeColor,
          opacity: 0.5,
        },
      },
      plotOptions: {},
      legend: {
        show: false,
      },
      dataLabels: {
        enabled: false,
      },
      fill: {
        type: 'solid',
        opacity: 0,
      },
      stroke: {
        curve: 'smooth',
        show: true,
        width: 3,
        colors: [strokeColor],
      },
      xaxis: {
        categories: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
        labels: {
          show: false,
          style: {
            colors: this.colorsGrayGray500,
            fontSize: '12px',
            fontFamily: this.fontFamily,
          },
        },
        crosshairs: {
          show: false,
          position: 'front',
          stroke: {
            color: this.colorsGrayGray300,
            width: 1,
            dashArray: 3,
          },
        },
      },
      yaxis: {
        min: 0,
        max: 80,
        labels: {
          show: false,
          style: {
            colors: this.colorsGrayGray500,
            fontSize: '12px',
            fontFamily: this.fontFamily,
          },
        },
      },
      states: {
        normal: {
          filter: {
            type: 'none',
            value: 0,
          },
        },
        hover: {
          filter: {
            type: 'none',
            value: 0,
          },
        },
        active: {
          allowMultipleDataPointsSelection: false,
          filter: {
            type: 'none',
            value: 0,
          },
        },
      },
      tooltip: {
        style: {
          fontSize: '12px',
          fontFamily: this.fontFamily,
        },
        y: {
          // tslint:disable-next-line
          formatter: function (val) {
            return '$' + val + ' thousands';
          },
        },
        marker: {
          show: false,
        },
      },
      colors: ['transparent'],
      markers: {
        colors: this.colorsThemeBaseDanger,
        strokeColor: [strokeColor],
        strokeWidth: 3,
      },
    };
  }
}
