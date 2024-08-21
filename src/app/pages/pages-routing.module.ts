import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LayoutComponent } from './_layout/layout.component';

const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./dashboard/dashboard.module').then((m) => m.DashboardModule),
      },
      {
        path: 'builder',
        loadChildren: () =>
          import('./builder/builder.module').then((m) => m.BuilderModule),
      },
      {
        path: 'ecommerce',
        loadChildren: () =>
          import('../modules/e-commerce/e-commerce.module').then(
            (m) => m.ECommerceModule
          ),
      },
      {
        path: 'user-management',
        loadChildren: () =>
          import('../modules/user-management/user-management.module').then(
            (m) => m.UserManagementModule
          ),
      },
      {
        path: 'user-profile',
        loadChildren: () =>
          import('../modules/user-profile/user-profile.module').then(
            (m) => m.UserProfileModule
          ),
      },
      {
        path: 'ngbootstrap',
        loadChildren: () =>
          import('../modules/ngbootstrap/ngbootstrap.module').then(
            (m) => m.NgbootstrapModule
          ),
      },
      {
        path: 'wizards',
        loadChildren: () =>
          import('../modules/wizards/wizards.module').then(
            (m) => m.WizardsModule
          ),
      },
      {
        path: 'material',
        loadChildren: () =>
          import('../modules/material/material.module').then(
            (m) => m.MaterialModule
          ),
      },
      //Mis Modulos
      {
        path: 'users',
        loadChildren: () =>
          import('../modules/users/users.module').then(
            (m) => m.UsersModule
          ),
      },
      {
        path: 'categories',
        loadChildren: () =>
          import('../modules/categories/categories.module').then(
            (m) => m.CategoriesModule
          ),
      },
      {
        path: 'products',
        loadChildren: () =>
          import('../modules/product/product.module').then(
            (m) => m.ProductModule
          ),
      },
      {
        path: 'sliders',
        loadChildren: () =>
          import('../modules/slider/slider.module').then(
            (m) => m.SliderModule
          ),
      },
      {
        path: 'cupones',
        loadChildren: () =>
          import('../modules/cupone/cupone.module').then(
            (m) => m.CuponeModule
          ),
      },
      {
        path: 'discounts',
        loadChildren: () =>
          import('../modules/discount/discount.module').then(
            (m) => m.DiscountModule
          ),
      },
      {
        path: 'printful',
        loadChildren: () =>
          import('../modules/printful/printful.module').then(
            (m) => m.PrintfulModule
          ),
      },
      {
        path: 'dropi',
        loadChildren: () =>
          import('../modules/dropi/dropi.module').then(
            (m) => m.DropiModule
          ),
      },
      {
        path: '',
        redirectTo: '/dashboard',
        pathMatch: 'full',
      },
      {
        path: '**',
        redirectTo: 'error/404',
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PagesRoutingModule { }
