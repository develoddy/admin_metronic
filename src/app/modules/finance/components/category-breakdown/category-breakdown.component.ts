import { Component, Input, OnChanges, SimpleChanges, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CategoryExpenseBreakdown } from '../../interfaces/finance.interface';

@Component({
  selector: 'app-category-breakdown',
  templateUrl: './category-breakdown.component.html',
  styleUrls: ['./category-breakdown.component.scss']
})
export class CategoryBreakdownComponent implements OnChanges, AfterViewInit {
  @Input() categories: CategoryExpenseBreakdown[] = [];
  @Input() totalExpenses: number = 0;
  
  @ViewChild('chartCanvas', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  private chart: any;

  ngAfterViewInit(): void {
    this.renderChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['categories'] && !changes['categories'].firstChange) {
      this.renderChart();
    }
  }

  /**
   * Renderiza el gráfico circular usando Canvas nativo
   */
  private renderChart(): void {
    if (!this.chartCanvas) return;
    
    const canvas = this.chartCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;

    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dibujar círculo de fondo
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fillStyle = '#f8f9fa';
    ctx.fill();

    // Dibujar segmentos
    let startAngle = -Math.PI / 2; // Empezar arriba

    this.categories.forEach(cat => {
      const sliceAngle = (cat.percentage / 100) * 2 * Math.PI;
      
      // Dibujar segmento
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = cat.color;
      ctx.fill();
      
      // Borde blanco entre segmentos
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      startAngle += sliceAngle;
    });

    // Círculo central blanco (donut effect)
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.6, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Texto central
    ctx.fillStyle = '#212529';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.formatCurrency(this.totalExpenses), centerX, centerY - 5);
    
    ctx.fillStyle = '#6c757d';
    ctx.font = '12px sans-serif';
    ctx.fillText('GASTOS', centerX, centerY + 15);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }
}
