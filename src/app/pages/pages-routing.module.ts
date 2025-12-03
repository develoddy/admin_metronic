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
        path: 'guests',
        loadChildren: () =>
          import('../modules/guests/guests.module').then(
            (m) => m.GuestsModule
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
        path: 'sales',
        loadChildren: () =>
          import('../modules/admin-sales/admin-sales.module').then(
            (m) => m.AdminSalesModule
          ),
      },
      {
        path: 'returns',
        loadChildren: () =>
          import('../modules/returns/returns.module').then(
            (m) => m.ReturnsModule
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
        path: 'support',
        loadChildren: () =>
          import('../modules/admin-chat/admin-chat.module').then(
            (m) => m.AdminChatModule
          ),
      },
      {
        path: 'inbox',
        loadChildren: () =>
          import('../modules/inbox/inbox.module').then(
            (m) => m.InboxModule
          ),
      },
      {
        path: 'reports',
        loadChildren: () =>
          import('../modules/reports/reports.module').then(
            (m) => m.ReportsModule
          ),
      },
      {
        path: 'documents-manager',
        loadChildren: () =>
          import('../modules/documents-manager/documents-manager.module').then(
            (m) => m.DocumentsManagerModule
          ),
      },
      // ⚠️ DEPRECATED: Shipping module removido. Tracking info disponible en Admin-Sales
      // (datos desde Sales table actualizada por Printful webhooks)
      // {
      //   path: 'shipping',
      //   loadChildren: () =>
      //     import('../modules/shipping/shipping.module').then(
      //       (m) => m.ShippingModule
      //     ),
      // },
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
        path: 'prelaunch',
        loadChildren: () =>
          import('../modules/prelaunch-campaigns/prelaunch-campaigns.module').then(
            (m) => m.PrelaunchCampaignsModule
          ),
      },
      {
        path: 'newsletter-campaigns',
        loadChildren: () =>
          import('../modules/newsletter-campaigns/newsletter-campaigns.module').then(
            (m) => m.NewsletterCampaignsModule
          ),
      },
      {
        path: 'analytics',
        loadChildren: () =>
          import('../modules/analytics/analytics.module').then(
            (m) => m.AnalyticsModule
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
