import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FinanceComponent } from './finance.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { BankAccountsListComponent } from './bank-accounts/bank-accounts-list/bank-accounts-list.component';
import { BankAccountEditComponent } from './bank-accounts/bank-account-edit/bank-account-edit.component';
import { IncomesListComponent } from './incomes/incomes-list/incomes-list.component';
import { IncomeEditComponent } from './incomes/income-edit/income-edit.component';
import { ExpensesListComponent } from './expenses/expenses-list/expenses-list.component';
import { ExpenseEditComponent } from './expenses/expense-edit/expense-edit.component';
import { DebtsListComponent } from './debts/debts-list/debts-list.component';
import { DebtEditComponent } from './debts/debt-edit/debt-edit.component';
import { TransferComponent } from './transfer/transfer.component';
import { AssetsListComponent } from './assets/assets-list/assets-list.component';
import { AssetEditComponent } from './assets/asset-edit/asset-edit.component';
import { LiabilitiesListComponent } from './liabilities/liabilities-list/liabilities-list.component';
import { LiabilityEditComponent } from './liabilities/liability-edit/liability-edit.component';

const routes: Routes = [
  {
    path: '',
    component: FinanceComponent,
    children: [
      {
        path: 'dashboard',
        component: DashboardComponent
      },
      {
        path: 'bank-accounts',
        component: BankAccountsListComponent
      },
      {
        path: 'bank-accounts/new',
        component: BankAccountEditComponent
      },
      {
        path: 'bank-accounts/edit/:id',
        component: BankAccountEditComponent
      },
      {
        path: 'incomes',
        component: IncomesListComponent
      },
      {
        path: 'incomes/new',
        component: IncomeEditComponent
      },
      {
        path: 'incomes/edit/:id',
        component: IncomeEditComponent
      },
      {
        path: 'expenses',
        component: ExpensesListComponent
      },
      {
        path: 'expenses/new',
        component: ExpenseEditComponent
      },
      {
        path: 'expenses/edit/:id',
        component: ExpenseEditComponent
      },
      {
        path: 'debts',
        component: DebtsListComponent
      },
      {
        path: 'debts/new',
        component: DebtEditComponent
      },
      {
        path: 'debts/edit/:id',
        component: DebtEditComponent
      },
      {
        path: 'transfer',
        component: TransferComponent
      },
      {
        path: 'assets',
        component: AssetsListComponent
      },
      {
        path: 'assets/new',
        component: AssetEditComponent
      },
      {
        path: 'assets/edit/:id',
        component: AssetEditComponent
      },
      {
        path: 'liabilities',
        component: LiabilitiesListComponent
      },
      {
        path: 'liabilities/new',
        component: LiabilityEditComponent
      },
      {
        path: 'liabilities/edit/:id',
        component: LiabilityEditComponent
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FinanceRoutingModule { }
