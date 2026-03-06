import { Injectable } from '@angular/core';
import {
  FinancialSummary,
  FinancialOverview,
  AccountExpenseBreakdown,
  CategoryExpenseBreakdown,
  DebtPriorityItem,
  FinancialRecommendation,
  DetailedInsights,
  ExpenseInsight,
  UserProfile,
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
    const categoryBreakdown = this.generateCategoryBreakdown(summary.accountMetrics);
    
    return {
      month: summary.summary.month,
      monthlyBalance: summary.summary.monthlyBalance,
      totalIncome: summary.summary.totalIncome,
      totalExpenses: summary.summary.totalExpenses,
      status: status.status,
      statusColor: status.color,
      accountBreakdown: this.generateAccountBreakdown(summary.accountMetrics),
      categoryBreakdown: categoryBreakdown,
      debtPriority: this.generateDebtPriority(summary.debtInfo),
      recommendations: this.generateRecommendations(summary),
      detailedInsights: this.generateDetailedInsights(summary, categoryBreakdown)
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
        action: 'Revisar gastos no esenciales y buscar áreas de reducción inmediata',
        context: `Tus ingresos son ${this.formatCurrency(totalIncome)} y tus gastos suman ${this.formatCurrency(totalExpenses)}, dejando ${this.formatCurrency(monthlyBalance)} negativos.`
      });
    }

    // Tasa de ahorro baja
    if (savingsRate < 10 && monthlyBalance >= 0) {
      const idealSavings = totalIncome * 0.20;
      const currentSavings = totalIncome * (savingsRate / 100);
      const savingsPotential = idealSavings - currentSavings;
      
      recommendations.push({
        type: 'warning',
        title: '📊 Tasa de Ahorro Baja',
        message: `Tu tasa de ahorro es ${savingsRate.toFixed(1)}%. Idealmente debería ser al menos 20% para tener estabilidad financiera.`,
        action: 'Aplicar regla 50/30/20: 50% necesidades, 30% deseos, 20% ahorro',
        savingsPotential: parseFloat(savingsPotential.toFixed(2)),
        context: `Objetivo 20%: ${this.formatCurrency(idealSavings)}/mes → ${this.formatCurrency(idealSavings * 12)}/año`
      });
    }

    // Ratio deuda-ingreso alto
    if (debtToIncomeRatio > 35) {
      const debtAmount = summary.debtInfo?.totalMonthlyPayment || 0;
      recommendations.push({
        type: 'alert',
        title: '💸 Carga de Deuda Alta',
        message: `Tus deudas representan ${debtToIncomeRatio.toFixed(1)}% de tus ingresos. Por encima de 35% es preocupante y limita tu capacidad de ahorro.`,
        action: 'Aplicar método Avalancha: paga mínimos en todo y vuelca extras en deuda de mayor interés',
        context: `Pago mensual deudas: ${this.formatCurrency(debtAmount)} (${debtToIncomeRatio.toFixed(1)}% de ${this.formatCurrency(totalIncome)})`
      });
    }

    // Deuda total significativa
    if (summary.summary.totalDebt > summary.summary.totalIncome * 2) {
      const debtMonths = summary.summary.totalDebt / summary.summary.totalIncome;
      recommendations.push({
        type: 'warning',
        title: '🔮 Deuda Acumulada Elevada',
        message: `Tu deuda total equivale a ${debtMonths.toFixed(1)} meses de ingreso. Esto requiere atención prioritaria.`,
        action: 'Priorizar pago de deudas con mayor interés y negociar plazos si es posible',
        context: `Deuda total: ${this.formatCurrency(summary.summary.totalDebt)} vs ingresos mensuales: ${this.formatCurrency(totalIncome)}`
      });
    }

    // Gastos casi iguales a ingresos (margen ajustado)
    if (monthlyBalance >= 0 && monthlyBalance < 100 && totalIncome > 0) {
      const margin = (monthlyBalance / totalIncome) * 100;
      const emergencyFund = totalExpenses * 3; // 3 meses de gastos
      recommendations.push({
        type: 'warning',
        title: '⚖ Margen Muy Ajustado',
        message: `Tu margen es solo ${margin.toFixed(1)}% (${this.formatCurrency(monthlyBalance)}). Cualquier imprevisto podría generar déficit.`,
        action: 'Crear fondo de emergencia equivalente a 3 meses de gastos esenciales',
        context: `Fondo de emergencia recomendado: ${this.formatCurrency(emergencyFund)} (3 meses × ${this.formatCurrency(totalExpenses)})`
      });
    }

    // Situación positiva
    if (monthlyBalance > 200 && savingsRate >= 20) {
      const yearlyBalance = monthlyBalance * 12;
      recommendations.push({
        type: 'success',
        title: '✅ Excelente Control Financiero',
        message: `Mantienes un balance positivo de ${this.formatCurrency(monthlyBalance)} con tasa de ahorro de ${savingsRate.toFixed(1)}%. ¡Sigue así!`,
        action: 'Considera diversificar: inversiones a largo plazo o instrumentos de ahorro programado',
        context: `Proyección anual: ${this.formatCurrency(yearlyBalance)} en ahorro/inversión disponible`
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

  // ============================================
  // DETAILED INSIGHTS - Análisis Inteligente
  // ============================================

  /**
   * Genera análisis detallado e inteligente de gastos
   */
  private generateDetailedInsights(
    summary: FinancialSummary,
    categoryBreakdown: CategoryExpenseBreakdown[]
  ): DetailedInsights {
    const expenseInsights = this.analyzeExpenseDetails(categoryBreakdown, summary.summary.totalIncome);
    const userProfile = this.detectUserProfile(categoryBreakdown);
    const savingsPotentialTotal = expenseInsights.reduce((sum, insight) => sum + (insight.savingsPotential || 0), 0);
    
    // Contexto de deudas
    let debtContext: DetailedInsights['debtContext'];
    if (summary.debtInfo && summary.debtInfo.totalMonthlyPayment > 0) {
      const percentageOfIncome = summary.summary.totalIncome > 0 
        ? (summary.debtInfo.totalMonthlyPayment / summary.summary.totalIncome) * 100 
        : 0;
      
      const debtCount = this.estimateDebtCount(summary.debtInfo.totalMonthlyPayment);
      
      debtContext = {
        totalDebts: debtCount,
        totalMonthlyPayment: summary.debtInfo.totalMonthlyPayment,
        percentageOfIncome: parseFloat(percentageOfIncome.toFixed(1)),
        message: `${debtCount} deudas simultáneas que suman ${this.formatCurrency(summary.debtInfo.totalMonthlyPayment)}/mes (${percentageOfIncome.toFixed(1)}% de tus ingresos). Cuando las elimines, tu situación cambia radicalmente.`
      };
    }

    return {
      expenseInsights,
      userProfile,
      savingsPotentialTotal: parseFloat(savingsPotentialTotal.toFixed(2)),
      debtContext
    };
  }

  /**
   * Analiza gastos individuales y encuentra oportunidades de ahorro
   */
  private analyzeExpenseDetails(
    categoryBreakdown: CategoryExpenseBreakdown[],
    totalIncome: number
  ): ExpenseInsight[] {
    const insights: ExpenseInsight[] = [];

    // Benchmarks del mercado español (2026)
    const benchmarks: { [key: string]: { benchmark: number; category: string; label: string } } = {
      utilities: { benchmark: 40, category: 'utilities', label: 'Servicios (Internet, móvil)' },
      groceries: { benchmark: 250, category: 'groceries', label: 'Alimentación' },
      entertainment: { benchmark: 50, category: 'entertainment', label: 'Entretenimiento' },
      insurance: { benchmark: 100, category: 'insurance', label: 'Seguros' },
      technology: { benchmark: 30, category: 'technology', label: 'Tecnología' }
    };

    // Analizar cada categoría contra benchmark
    categoryBreakdown.forEach(cat => {
      const benchmark = benchmarks[cat.category];
      
      if (benchmark && cat.amount > benchmark.benchmark * 1.5) {
        // Gasto 50% superior al benchmark
        const savingsPotential = cat.amount - benchmark.benchmark;
        insights.push({
          category: cat.category,
          categoryLabel: cat.categoryLabel,
          currentAmount: cat.amount,
          marketBenchmark: benchmark.benchmark,
          savingsPotential: parseFloat(savingsPotential.toFixed(2)),
          suggestion: this.generateSavingSuggestion(cat.category, cat.amount, benchmark.benchmark),
          priority: savingsPotential > 50 ? 'high' : savingsPotential > 20 ? 'medium' : 'low'
        });
      }
    });

    // Analizar alimentación si está controlada
    const groceries = categoryBreakdown.find(cat => cat.category === 'groceries');
    if (groceries && groceries.amount <= 250) {
      insights.push({
        category: 'groceries',
        categoryLabel: 'Alimentación',
        currentAmount: groceries.amount,
        marketBenchmark: 250,
        savingsPotential: 0,
        suggestion: `Tus gastos de alimentación (${this.formatCurrency(groceries.amount)}) están bien controlados. ¡Sigue así!`,
        priority: 'low'
      });
    }

    return insights.sort((a, b) => (b.savingsPotential || 0) - (a.savingsPotential || 0));
  }

  /**
   * Genera sugerencia específica de ahorro
   */
  private generateSavingSuggestion(category: string, current: number, benchmark: number): string {
    const savings = current - benchmark;
    
    const suggestions: { [key: string]: string } = {
      utilities: `Estás pagando ${this.formatCurrency(current)}. Operadores como Digi, MásMóvil o O2 ofrecen fibra + móvil desde €25-40. Podrías ahorrar ${this.formatCurrency(savings)}/mes.`,
      groceries: `Con ${this.formatCurrency(current)}/mes en supermercado, podrías optimizar planificando menús semanales y usando mercados locales.`,
      entertainment: `${this.formatCurrency(current)} en entretenimiento. Revisa suscripciones no esenciales (streaming, apps premium). Ahorro potencial: ${this.formatCurrency(savings)}/mes.`,
      insurance: `Pagar ${this.formatCurrency(current)} en seguros es elevado. Compara ofertas en comparadores o negocia con tu aseguradora actual.`,
      technology: `${this.formatCurrency(current)} en tecnología. Evalúa si todas las suscripciones premium son necesarias.`
    };

    return suggestions[category] || `Gasto elevado en ${category}: ${this.formatCurrency(current)}. Revisa y optimiza.`;
  }

  /**
   * Detecta el perfil del usuario según patrones de gasto
   */
  private detectUserProfile(categoryBreakdown: CategoryExpenseBreakdown[]): UserProfile {
    const indicators: string[] = [];
    let profileType: UserProfile['profileType'] = 'standard';
    let confidence = 50;
    let shouldAnalyzeTools = false;

    // Buscar gastos en tecnología
    const tech = categoryBreakdown.find(cat => cat.category === 'technology');
    const entertainment = categoryBreakdown.find(cat => cat.category === 'entertainment');
    
    // Indie Hacker / Freelancer indicators
    if (tech && tech.amount > 15) {
      indicators.push(`Gastos en tecnología: ${this.formatCurrency(tech.amount)}`);
      profileType = 'indie_hacker';
      confidence = 70;
      shouldAnalyzeTools = true;
    }

    // Family indicators
    const education = categoryBreakdown.find(cat => cat.category === 'education');
    const groceries = categoryBreakdown.find(cat => cat.category === 'groceries');
    if (education && education.amount > 100) {
      indicators.push('Gastos en educación detectados');
      profileType = 'family';
      confidence = 75;
      shouldAnalyzeTools = false;
    }
    if (groceries && groceries.amount > 300) {
      indicators.push('Gasto elevado en alimentación (familia numerosa)');
      if (profileType === 'standard') {
        profileType = 'family';
        confidence = 65;
      }
    }

    // Professional tools analysis (solo para indie_hacker/freelancer)
    const professionalTools = shouldAnalyzeTools
      ? this.analyzeProfessionalTools(categoryBreakdown)
      : undefined;

    return {
      profileType,
      confidence,
      indicators: indicators.length > 0 ? indicators : ['Perfil estándar - sin patrones específicos detectados'],
      professionalTools
    };
  }

  /**
   * Analiza herramientas profesionales (VPS, IDE, suscripciones dev)
   */
  private analyzeProfessionalTools(categoryBreakdown: CategoryExpenseBreakdown[]): UserProfile['professionalTools'] {
    const tools: UserProfile['professionalTools'] = [];

    // Simulación de herramientas comunes (en producción vendrían de los expenses individuales)
    const tech = categoryBreakdown.find(cat => cat.category === 'technology');
    if (tech && tech.amount > 0) {
      // Ejemplos de herramientas profesionales típicas
      const commonTools = [
        { name: 'VPS/Cloud (DigitalOcean, AWS)', portion: 0.25, verdict: 'essential' as const, reason: 'Si generan ingresos, imprescindible' },
        { name: 'GitHub Copilot', portion: 0.30, verdict: 'review' as const, reason: 'Útil si acelera desarrollo. Evalúa ROI' },
        { name: 'Servicios Premium (Twitter/X)', portion: 0.25, verdict: 'review' as const, reason: '¿Necesitas Premium para tu marca? Si no, usa versión gratuita' },
        { name: 'Almacenamiento Cloud', portion: 0.20, verdict: 'essential' as const, reason: 'Backups indispensables para indie hacker' }
      ];

      commonTools.forEach(tool => {
        const amount = tech.amount * tool.portion;
        if (amount >= 3) { // Solo si el gasto es significativo
          tools.push({
            tool: tool.name,
            category: 'technology',
            amount: parseFloat(amount.toFixed(2)),
            verdict: tool.verdict,
            reasoning: tool.reason
          });
        }
      });
    }

    return tools;
  }

  /**
   * Estima número de deudas basado en pago mensual total
   */
  private estimateDebtCount(monthlyPayment: number): number {
    // Estimación aproximada: deuda promedio paga ~€100/mes
    return Math.max(Math.round(monthlyPayment / 100), 1);
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
