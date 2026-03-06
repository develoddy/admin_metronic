import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { InlineSVGModule } from 'ng-inline-svg';

import { FinanceRoutingModule } from './finance-routing.module';
import { FinanceComponent } from './finance.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { FinanceService } from './services/finance.service';

// Bank Accounts
import { BankAccountsListComponent } from './bank-accounts/bank-accounts-list/bank-accounts-list.component';
import { BankAccountEditComponent} from './bank-accounts/bank-account-edit/bank-account-edit.component';

// Incomes
import { IncomesListComponent } from './incomes/incomes-list/incomes-list.component';
import { IncomeEditComponent } from './incomes/income-edit/income-edit.component';

// Expenses
import { ExpensesListComponent } from './expenses/expenses-list/expenses-list.component';
import { ExpenseEditComponent } from './expenses/expense-edit/expense-edit.component';

// Debts
import { DebtsListComponent } from './debts/debts-list/debts-list.component';
import { DebtEditComponent } from './debts/debt-edit/debt-edit.component';

// Transfers
import { TransferComponent } from './transfer/transfer.component';

// Assets (Patrimonio)
import { AssetsListComponent } from './assets/assets-list/assets-list.component';
import { AssetEditComponent } from './assets/asset-edit/asset-edit.component';

// Liabilities (Patrimonio)
import { LiabilitiesListComponent } from './liabilities/liabilities-list/liabilities-list.component';
import { LiabilityEditComponent } from './liabilities/liability-edit/liability-edit.component';

// Overview Components
import { FinancialOverviewComponent } from './components/financial-overview/financial-overview.component';
import { CategoryBreakdownComponent } from './components/category-breakdown/category-breakdown.component';
import { DebtPriorityComponent } from './components/debt-priority/debt-priority.component';
import { AccountExpenseCardComponent } from './components/account-expense-card/account-expense-card.component';
import { NetWorthSummaryComponent } from './components/net-worth-summary/net-worth-summary.component';

// Services
import { FinanceAggregatorService } from './services/finance-aggregator.service';

@NgModule({
  declarations: [
    FinanceComponent,
    DashboardComponent,
    // Bank Accounts
    BankAccountsListComponent,
    BankAccountEditComponent,
    // Incomes
    IncomesListComponent,
    IncomeEditComponent,
    // Expenses
    ExpensesListComponent,
    ExpenseEditComponent,
    // Debts
    DebtsListComponent,
    DebtEditComponent,
    // Transfers
    TransferComponent,
    // Assets (Patrimonio)
    AssetsListComponent,
    AssetEditComponent,
    // Liabilities (Patrimonio)
    LiabilitiesListComponent,
    LiabilityEditComponent,
    // Overview Components
    FinancialOverviewComponent,
    CategoryBreakdownComponent,
    DebtPriorityComponent,
    AccountExpenseCardComponent,
    NetWorthSummaryComponent
  ],
  imports: [
    CommonModule,
    FinanceRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModule,
    NgbModalModule,
    InlineSVGModule
  ],
  providers: [
    FinanceService,
    FinanceAggregatorService
  ]
})
export class FinanceModule { }
