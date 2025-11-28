export const AsideMenuAdminGeneral = {
    items: [
      { section: 'Dashboard' },
      {
        title: 'eCommerce',
        root: true,
        name: "dashboard",
        icon: 'flaticon2-architecture-and-city',
        svg: './assets/media/svg/icons/Design/Layers.svg',
        page: '/dashboard',
        translate: 'MENU.DASHBOARD',
        bullet: 'dot',
      },

      /** --------- SECCION PROVEEDORES ---------*/
      { section : 'Proveedores'},
      {
        title: 'Printful',
        root: true,
        name: "printful",
        bullet: 'dot',
        icon: 'flaticon2-user-outline-symbol',
        svg: './assets/media/svg/icons/Layout/Layout-horizontal.svg',
        page: '/printful',
        submenu: [
          {
            title: 'Dashboard',
            page: '/printful/dashboard'
          },
          {
            title: 'Sincronizar',
            page: '/printful/list'
          },
          {
            title: 'Productos Printful',
            page: '/printful/products'
          },
          {
            title: 'Órdenes',
            page: '/printful/orders'
          },
          {
            title: 'Calculadora de Envío',
            page: '/printful/shipping-calculator'
          },
          {
            title: 'Webhooks',
            page: '/printful/webhook-logs'
          }
        ]
      },

      /** --------- SECCION USUARIOS ---------*/
      { section: 'User Management' },
      {
        title: 'Usuarios',
        root: true,
        name: "users",
        bullet: 'dot',
        icon: 'flaticon2-user-outline-symbol',
        svg: './assets/media/svg/icons/General/User.svg',
        page: '/users',
        submenu: [
          {
            title: 'Gestion Usuarios',
            page: '/users/list'
          }
        ]
      },
      {
        title: 'Invitados',
        root: true,
        name: "guests",
        bullet: 'dot',
        icon: 'flaticon2-user-outline-symbol',
        svg: './assets/media/svg/icons/General/User.svg',
        page: '/guests',
        submenu: [
          {
            title: 'Gestion Invitados',
            page: '/guests/list'
          }
        ]
      },


      /** --------- SECCION E-ECOMMERCE ---------*/
      { section: 'e-Commerce' },
      {
        title: 'Categorías',
        root: true,
        name: "categories",
        bullet: 'dot',
        icon: 'flaticon2-user-outline-symbol',
        svg: './assets/media/svg/icons/Home/Commode2.svg',
        page: '/categories',
        submenu: [
          {
            title: 'Listado de categorías',
            page: '/categories/list'
          }
        ]
      },
      {
        title: 'Productos',
        root: true,
        name: "products",
        bullet: 'dot',
        icon: 'flaticon2-user-outline-symbol',
        svg: './assets/media/svg/icons/Shopping/Box1.svg',
        page: '/products',
        submenu: [
          {
            title: 'Crear producto',
            page: '/products/register-product'
          },
          {
            title: 'Listado de productos',
            page: '/products/list-all-products'
          },
        ]
      },
      {
        title: 'Banners',
        root: true,
        name: "sliders",
        bullet: 'dot',
        icon: 'flaticon2-user-outline-symbol',
        svg: './assets/media/svg/icons/Design/Image.svg',
        page: '/sliders',
        submenu: [
          {
            title: 'Listado de banners',
            page: '/sliders/list-sliders'
          }
        ]
      },
      {
        title: 'Cupones',
        root: true,
        name: "cupones",
        bullet: 'dot',
        icon: 'flaticon2-user-outline-symbol',
        svg: './assets/media/svg/icons/Devices/Cardboard-vr.svg',
        page: '/cupones',
        submenu: [
          {
            title: 'Registrar cupon',
            page: '/cupones/register-cupon'
          },
          {
            title: 'Listado de cupones',
            page: '/cupones/list-cupones'
          }
        ]
      },
      {
        title: 'Descuento',
        root: true,
        name: "discount",
        bullet: 'dot',
        icon: 'flaticon2-user-outline-symbol',
        svg: './assets/media/svg/icons/Shopping/Price1.svg',
        page: '/discount',
        submenu: [
          {
            title: 'Registrar descuento',
            page: '/discounts/register-discount'
          },
          {
            title: 'Listado de descuentos',
            page: '/discounts/list-discounts'
          }
        ]
      },
      {
        title: 'Ventas',
        root: true,
        name: "sales",
        bullet: 'dot',
        icon: 'flaticon2-user-outline-symbol',
        svg: './assets/media/svg/icons/Shopping/Sale1.svg',
        page: '/sales',
        submenu: [
          {
            title: 'Listado de ventas',
            page: '/sales/list'
          }
        ]
      },
      {
        title: 'Devoluciones',
        root: true,
        name: "returns",
        bullet: 'dot',
        icon: 'flaticon2-user-outline-symbol',
        svg: './assets/media/svg/icons/General/Update.svg',
        page: '/returns',
        submenu: [
          {
            title: 'Listado de devoluciones',
            page: '/returns/list'
          }
        ]
      },
      {
        title: 'Shipping',
        root: true,
        name: "shipping",
        bullet: 'dot',
        icon: 'flaticon2-user-outline-symbol',
        svg: './assets/media/svg/icons/General/Update.svg',
        page: '/shipping',
        submenu: [
          {
            title: 'Listado de envíos',
            page: '/shipping/list'
          }
        ]
      },
      {
        title: 'Reportes',
        root: true,
        name: "reports",
        bullet: 'dot',
        icon: 'flaticon2-user-outline-symbol',
        svg: './assets/media/svg/icons/Files/Group-folders.svg',
        page: '/reports',
        submenu: [
          {
            title: 'Listado de ventas',
            page: '/reports/sales'
          },
          {
            title: 'Listado de devoluciones',
            page: '/reports/returns'
          },
          {
            title: 'Listado de envíos',
            page: '/reports/shipping'
          },
          {
            title: 'Listado de pedidos por cliente',
            page: '/reports/customer-orders'
          }
        ]
      },

      /** --------- SECCION MARKETING ---------*/
      { section: 'Marketing' },
      {
        title: 'Pre-lanzamiento',
        root: true,
        name: "prelaunch",
        bullet: 'dot',
        icon: 'flaticon2-rocket',
        svg: './assets/media/svg/icons/Communication/Send.svg',
        page: '/prelaunch',
        submenu: [
          {
            title: 'Dashboard',
            page: '/prelaunch/dashboard'
          },
          {
            title: 'Suscriptores',
            page: '/prelaunch/subscribers'
          },
          {
            title: 'Enviar Campaña',
            page: '/prelaunch/launch'
          },
          {
            title: 'Estadísticas',
            page: '/prelaunch/stats'
          }
        ]
      },
      {
        title: 'Newsletter',
        root: true,
        name: "newsletter",
        bullet: 'dot',
        icon: 'flaticon2-mail',
        svg: './assets/media/svg/icons/Communication/Mail-opened.svg',
        page: '/newsletter-campaigns',
        submenu: [
          {
            title: 'Dashboard',
            page: '/newsletter-campaigns/dashboard'
          },
          {
            title: 'Suscriptores',
            page: '/newsletter-campaigns/subscribers'
          },
          {
            title: 'Crear Campaña',
            page: '/newsletter-campaigns/campaign/create'
          }
        ]
      },

      /** --------- SECCION GESTOR DE DOCUMENTOS ---------*/
      { section: 'Gestor de Documentos' },
      {
        title: 'Recibo',
        root: true,
        name: "receipts",
        bullet: 'dot',
        icon: 'flaticon2-user-outline-symbol',
        svg: './assets/media/svg/icons/Files/File-done.svg',
        page: '/receipts',
        submenu: [
          {
            title: 'Lista Receipts',
            page: '/documents-manager/receipts/list'
          },
          {
            title: 'Crear Receipts',
            page: '/documents-manager/receipts/create'
          },
        ]
      },
      {
        title: 'Factura',
        root: true,
        name: "invoices",
        bullet: 'dot',
        icon: 'flaticon2-user-outline-symbol',
        svg: './assets/media/svg/icons/Files/File.svg',
        page: '/invoices',
        submenu: [
          {
            title: 'Lista Invoices',
            page: '/documents-manager/invoices/list'
          },
          {
            title: 'Crear Invoices',
            page: '/documents-manager/invoices/create'
          }
        ]
      },

      /** --------- SECCION SOPORTE CHAT ---------*/
      { section: 'Centro de soporte' },
      {
        title: 'Chat',
        root: true,
        name: "chat",
        bullet: 'dot',
        icon: 'flaticon2-user-outline-symbol',
        svg: './assets/media/svg/icons/Communication/Chat6.svg',
        page: '/chat',
        submenu: [
          {
            title: 'Lista chat',
            page: '/support'
          }
        ]
      },
      {
        title: 'Bandeja de entrada',
        root: true,
        name: "inbox",
        bullet: 'dot',
        icon: 'flaticon2-user-outline-symbol',
        svg: './assets/media/svg/icons/Communication/Mail.svg',
        page: '/inbox',
        submenu: [
          {
            title: 'Mensajes',
            page: '/inbox/messages'
          }
        ]
      },
    ]
}