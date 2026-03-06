import { Injectable } from '@angular/core';
import {
  FinancialSummary,
  FinancialOverview,
  AccountExpenseBreakdown,
  CategoryExpenseBreakdown,
  DebtPriorityItem,
  FinancialRecommendation,
  Expense,
  Debt,
  BankAccountMetrics,
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_ICONS
} from '../interfaces/finance.interface';

@Injectable({
  providedIn: 'root'
})
export class FinanceAggregatorService {

  constructor() { }

  /**
   * Genera vista overview a partir del resumen financiero completo
   */
  generateOverview(summary: FinancialSummary): FinancialOverview {
    const status = this.calculateStatus(summary.summary.monthlyBalance);
    
    return {
      month: summary.summary.month,
      monthlyBalance: summary.summary.monthlyBalance,
      totalIncome: summary.summary.totalIncome,
      totalExpenses: summary.summary.totalExpenses,
      status: status.status,
      statusColor: status.color,
      accountBreakdown: this.generateAccountBreakdown(summary.accountMetrics),
      categoryBreakdown: this.generateCategoryBreakdown(summary.accountMetrics),
      debtPriority: this.generateDebtPriority(summary.debtInfo),
      recommendations: this.generateRecommendations(summary)
    };
  }

  /**
   * Calcula el estado financiero del mes
   */
  private calculateStatus(balance: number): { status: 'surplus' | 'deficit' | 'balanced', color: 'success' | 'danger' | 'warning' } {
    if (balance > 100) {
      return { status: 'surplus', color: 'success' };
    } else if (balance < -50) {
      return { status: 'deficit', color: 'danger' };
    } else {
      return { status: 'balanced', color: 'warning' };
    }
  }

  /**
   * Genera breakdown de gastos por cuenta bancaria
   */
  private generateAccountBreakdown(accountMetrics: BankAccountMetrics[]): AccountExpenseBreakdown[] {
    return accountMetrics.map(account => {
      const items: { concept: string; category: string; amount: number }[] = [];
      
      // Convertir expensesByCategory a items individuales
      Object.entries(account.expensesByCategory).forEach(([category, data]) => {
        if (category !== 'internal_transfer') { // Excluir transferencias internas
          const categoryLabel = EXPENSE_CATEGORIES.find(c => c.value === category)?.label || category;
          items.push({
            concept: categoryLabel,
            category: category,
            amount: data.total
          });
        }
      });

      return {
        accountId: account.accountId,
        accountName: account.accountName,
        bankName: account.bankName,
        accountType: account.accountType,
        totalExpenses: account.monthlyMetrics.totalExpenses,
        items: items.sort((a, b) => b.amount - a.amount) // Ordenar por monto descendente
      };
    }).filter(account => account.totalExpenses > 0); // Solo cuentas con gastos
  }

  /**
   * Genera breakdown de gastos por categoría (para gráfico circular)
   */
  private generateCategoryBreakdown(accountMetrics: BankAccountMetrics[]): CategoryExpenseBreakdown[] {
    const categoryTotals: { [category: string]: number } = {};
    let totalExpenses = 0;

    // Agregar gastos de todas las cuentas por categoría
    accountMetrics.forEach(account => {
      Object.entries(account.expensesByCategory).forEach(([category, data]) => {
        if (category !== 'internal_transfer') { // Excluir transferencias internas
          categoryTotals[category] = (categoryTotals[category] || 0) + data.total;
          totalExpenses += data.total;
        }
      });
    });

    // Convertir a array y calcular porcentajes
    const breakdown = Object.entries(categoryTotals).map(([category, amount]) => {
      const categoryData = EXPENSE_CATEGORIES.find(c => c.value === category);
      return {
        category: category,
        categoryLabel: categoryData?.label || category,
        amount: amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
        color: this.getCategoryColor(category),
        icon: EXPENSE_CATEGORY_ICONS[category] || 'bi-circle-fill'
      };
    });

    // Ordenar por monto descendente
    return breakdown.sort((a, b) => b.amount - a.amount);
  }

  /**
   * Genera lista de deudas ordenada por prioridad (Método Avalancha)
   * Ordena por tasa de interés DESCENDENTE (mayor primero)
   */
  private generateDebtPriority(debtInfo: any): DebtPriorityItem[] {
    console.log('🔍 generateDebtPriority called with:', debtInfo);
    
    // Si no hay información de deudas, retornar vacío
    if (!debtInfo || !debtInfo.totalMonthlyPayment || debtInfo.totalMonthlyPayment === 0) {
      console.log('  ⚠️ Sin deudas detectadas');
      return [];
    }

    console.log('  💰 Deudas detectadas - Monthly Payment:', debtInfo.totalMonthlyPayment);
    console.log('  💰 Total Debt:', debtInfo.totalDebt);

    // Generar items de deuda con tasas estimadas
    // TODO: Obtener deudas reales con intereses del backend
    const mockDebts: DebtPriorityItem[] = [];

    // Por ahora, si hay deudas, generamos ejemplos basados en las métricas
    if (debtInfo.totalMonthlyPayment > 0) {
      const debtAmount = debtInfo.totalMonthlyPayment;
      
      // Ejemplo: Si hay deudas, generamos items de ejemplo ordenados por interés
      mockDebts.push({
        debtId: 1,
        priority: 1,
        creditor: 'Tarjeta Crédito',
        debtType: 'Tarjeta Revolving',
        monthlyPayment: debtAmount * 0.2,
        remainingBalance: debtAmount * 12,
        interestRate: 18.5,
        reasoning: 'Mayor tasa de interés. Pagar primero minimiza intereses totales.'
      });

      if (debtAmount > 200) {
        mockDebts.push({
          debtId: 2,
          priority: 2,
          creditor: 'Préstamo Personal',
          debtType: 'Consumo',
          monthlyPayment: debtAmount * 0.3,
          remainingBalance: debtAmount * 18,
          interestRate: 12.5,
          reasoning: 'Segunda tasa más alta. Atacar después de liquidar tarjetas.'
        });
      }
    }

    return mockDebts.sort((a, b) => b.interestRate - a.interestRate);
  }

  /**
   * Genera recomendaciones basadas en salud financiera
   */
  private generateRecommendations(summary: FinancialSummary): FinancialRecommendation[] {
    const recommendations: FinancialRecommendation[] = [];
    const { monthlyBalance, savingsRate, debtToIncomeRatio } = summary.healthStatus.metrics;
    const totalExpenses = summary.summary.totalExpenses;
    const totalIncome = summary.summary.totalIncome;

    // Déficit mensual
    if (monthlyBalance < 0) {
      recommendations.push({
        type: 'alert',
        title: '⚠ Déficit Mensual',
        message: `Gastas ${this.formatCurrency(Math.abs(monthlyBalance))} más de lo que ingresas. Es urgente reducir gastos o aumentar ingresos.`,
        action: 'Revisar gastos no esenciales y buscar áreas de reducción inmediata'
      });
    }

    // Tasa de ahorro baja
    if (savingsRate < 10 && monthlyBalance >= 0) {
      recommendations.push({
        type: 'warning',
        title: '📊 Tasa de Ahorro Baja',
        message: `Tu tasa de ahorro es ${savingsRate.toFixed(1)}%. Idealmente debería ser al menos 20% para tener estabilidad financiera.`,
        action: 'Aplicar regla 50/30/20: 50% necesidades, 30% deseos, 20% ahorro'
      });
    }

    // Ratio deuda-ingreso alto
    if (debtToIncomeRatio > 35) {
      recommendations.push({
        type: 'alert',
        title: '💸 Carga de Deuda Alta',
        message: `Tus deudas representan ${debtToIncomeRatio.toFixed(1)}% de tus ingresos. Por encima de 35% es preocupante y limita tu capacidad de ahorro.`,
        action: 'Aplicar método Avalancha: paga mínimos en todo y vuelca extras en deuda de mayor interés'
      });
    }

    // Deuda total significativa
    if (summary.summary.totalDebt > summary.summary.totalIncome * 2) {
      recommendations.push({
        type: 'warning',
        title: '🔮 Deuda Acumulada Elevada',
        message: `Tu deuda total equivale a ${(summary.summary.totalDebt / summary.summary.totalIncome).toFixed(1)} meses de ingreso. Esto requiere atención prioritaria.`,
        action: 'Priorizar pago de deudas con mayor interés y negociar plazos si es posible'
      });
    }

    // Gastos casi iguales a ingresos (margen ajustado)
    if (monthlyBalance >= 0 && monthlyBalance < 100 && totalIncome > 0) {
      const margin = (monthlyBalance / totalIncome) * 100;
      recommendations.push({
        type: 'warning',
        title: '⚖ Margen Muy Ajustado',
        message: `Tu margen es solo ${margin.toFixed(1)}% (${this.formatCurrency(monthlyBalance)}). Cualquier imprevisto podría generar déficit.`,
        action: 'Crear fondo de emergencia equivalente a 3 meses de gastos esenciales'
      });
    }

    // Situación positiva
    if (monthlyBalance > 200 && savingsRate >= 20) {
      recommendations.push({
        type: 'success',
        title: '✅ Excelente Control Financiero',
        message: `Mantienes un balance positivo de ${this.formatCurrency(monthlyBalance)} con tasa de ahorro de ${savingsRate.toFixed(1)}%. ¡Sigue así!`,
        action: 'Considera diversificar: inversiones a largo plazo o instrumentos de ahorro programado'
      });
    }

    // Si no hay recomendaciones críticas, generar una de seguimiento
    if (recommendations.length === 0 && monthlyBalance >= 0) {
      recommendations.push({
        type: 'info',
        title: '📈 Situación Estable',
        message: 'Tu situación financiera actual es estable. Sigue monitoreando tus gastos y ajustando según tus objetivos.',
        action: 'Revisar periodicamente y ajustar presupuesto según cambios en ingresos/gastos'
      });
    }

    return recommendations;
  }

  /**
   * Obtiene color para una categoría
   */
  private getCategoryColor(category: string): string {
    const colorMap: { [key: string]: string } = {
      housing: '#6aafd4',
      utilities: '#e8c97a',
      groceries: '#6dbf8a',
      transport: '#9b9bef',
      health: '#e05c5c',
      insurance: '#c9a84c',
      entertainment: '#b47fc7',
      education: '#6aafd4',
      clothing: '#f0a0a0',
      savings: '#6dbf8a',
      investments: '#6aafd4',
      debt_payment: '#e05c5c',
      restaurants: '#e8c97a',
      travel: '#9b9bef',
      gifts: '#f0a0a0',
      personal_care: '#c9a84c',
      technology: '#6aafd4',
      other: '#7a7570'
    };
    return colorMap[category] || '#7a7570';
  }

  /**
   * Formatea moneda
   */
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }

  // ============================================
  // NET WORTH - Patrimonio Neto
  // ============================================

  /**
   * Calcula métricas del patrimonio neto
   */
  calculateNetWorthMetrics(netWorthData: any): {
    netWorth: number;
    totalAssets: number;
    totalLiabilities: number;
    assetLiabilityRatio: number;
    debtPercentage: number;
    healthStatus: 'excellent' | 'good' | 'fair' | 'poor';
    healthColor: 'success' | 'info' | 'warning' | 'danger';
  } {
    const netWorth = netWorthData.netWorth || 0;
    const totalAssets = netWorthData.totalAssets || 0;
    const totalLiabilities = netWorthData.totalLiabilities || 0;
    
    // Ratio Activos/Pasivos (cuanto mayor, mejor)
    const assetLiabilityRatio = totalLiabilities > 0 
      ? totalAssets / totalLiabilities 
      : totalAssets > 0 ? 999 : 0;
    
    // Porcentaje de deuda respecto al total de activos
    const debtPercentage = totalAssets > 0 
      ? (totalLiabilities / totalAssets) * 100 
      : 0;
    
    // Clasificación de salud financiera patrimonial
    let healthStatus: 'excellent' | 'good' | 'fair' | 'poor';
    let healthColor: 'success' | 'info' | 'warning' | 'danger';
    
    if (netWorth < 0) {
      healthStatus = 'poor';
      healthColor = 'danger';
    } else if (assetLiabilityRatio >= 3) {
      healthStatus = 'excellent';
      healthColor = 'success';
    } else if (assetLiabilityRatio >= 1.5) {
      healthStatus = 'good';
      healthColor = 'info';
    } else if (assetLiabilityRatio >= 1) {
      healthStatus = 'fair';
      healthColor = 'warning';
    } else {
      healthStatus = 'poor';
      healthColor = 'danger';
    }
    
    return {
      netWorth,
      totalAssets,
      totalLiabilities,
      assetLiabilityRatio: parseFloat(assetLiabilityRatio.toFixed(2)),
      debtPercentage: parseFloat(debtPercentage.toFixed(2)),
      healthStatus,
      healthColor
    };
  }

  /**
   * Genera recomendaciones basadas en patrimonio neto
   */
  generateNetWorthRecommendations(metrics: any): string[] {
    const recommendations: string[] = [];
    
    if (metrics.netWorth < 0) {
      recommendations.push('⚠️ Tu patrimonio neto es negativo. Prioriza reducir deudas.');
    }
    
    if (metrics.debtPercentage > 50) {
      recommendations.push('📉 Tus pasivos representan más del 50% de tus activos. Considera un plan de reducción de deuda.');
    } else if (metrics.debtPercentage > 30) {
      recommendations.push('⚡ Nivel de endeudamiento moderado. Mantén el foco en reducir deudas.');
    }
    
    if (metrics.assetLiabilityRatio < 1.5) {
      recommendations.push('💪 Trabaja en aumentar tus activos o reducir pasivos para mejorar tu ratio.');
    }
    
    if (metrics.totalAssets < 10000) {
      recommendations.push('💰 Considera crear un fondo de emergencia equivalente a 3-6 meses de gastos.');
    }
    
    if (metrics.healthStatus === 'excellent') {
      recommendations.push('🎉 ¡Excelente salud patrimonial! Considera diversificar tus inversiones.');
    }
    
    return recommendations;
  }
}
