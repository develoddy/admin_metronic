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
        svg: './assets/media/svg/icons/Home/Commode2.svg',
        page: '/sliders',
        submenu: [
          {
            title: 'Lista Sliders',
            page: '/sliders/list-sliders'
          }
        ]
      },
    ]
}