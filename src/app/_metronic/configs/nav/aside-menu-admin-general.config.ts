export const AsideMenuAdminGeneral = {
    items: [
      {
        title: 'Dashboard',
        root: true,
        name: "dashboard",
        icon: 'flaticon2-architecture-and-city',
        svg: './assets/media/svg/icons/Design/Layers.svg',
        page: '/dashboard',
        translate: 'MENU.DASHBOARD',
        bullet: 'dot',
      },

      // Provedores
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
            title: 'Sincronizar',
            page: '/printful/list'
          }
        ]
      },
      {
        title: 'Printify',
        root: true,
        name: "printify",
        bullet: 'dot',
        icon: 'flaticon2-user-outline-symbol',
        svg: './assets/media/svg/icons/Layout/Layout-vertical.svg',
        page: '/printify',
        submenu: [
          {
            title: 'Sincronizar',
            page: '/printify/list'
          }
        ]
      },

      // End proveedor


      { section: 'Usuario' },
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

      { section: 'Productos' },
      {
        title: 'Categorias',
        root: true,
        name: "categories",
        bullet: 'dot',
        icon: 'flaticon2-user-outline-symbol',
        svg: './assets/media/svg/icons/Home/Commode2.svg',
        page: '/categories',
        submenu: [
          {
            title: 'Lista categorias',
            page: '/categories/list'
          }
        ]
      },

      {
        title: 'Products',
        root: true,
        name: "products",
        bullet: 'dot',
        icon: 'flaticon2-user-outline-symbol',
        svg: './assets/media/svg/icons/Devices/TV2.svg',
        page: '/products',
        submenu: [
          {
            title: 'Crear productos',
            page: '/products/register-product'
          },
          {
            title: 'Lista productos',
            page: '/products/list-all-products'
          },
        ]
      },
      {
        title: 'Sliders',
        root: true,
        name: "sliders",
        bullet: 'dot',
        icon: 'flaticon2-user-outline-symbol',
        svg: './assets/media/svg/icons/Design/Image.svg',
        page: '/sliders',
        submenu: [
          {
            title: 'Lista Sliders',
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
            title: 'Registrar Cupon',
            page: '/cupones/register-cupon'
          },
          {
            title: 'Lista Cupones',
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
        svg: './assets/media/svg/icons/General/Clipboard.svg',
        page: '/discount',
        submenu: [
          {
            title: 'Registrar Descuento',
            page: '/discounts/register-discount'
          },
          {
            title: 'Lista Discount',
            page: '/discounts/list-discounts'
          }
        ]
      },
      // CHAT
      {
        title: 'Chat',
        root: true,
        name: "chat",
        bullet: 'dot',
        icon: 'flaticon2-user-outline-symbol',
        svg: './assets/media/svg/icons/General/Clipboard.svg',
        page: '/chat',
        submenu: [
          {
            title: 'Lista Chat',
            page: '/support'
          }
        ]
      },
    ]
}