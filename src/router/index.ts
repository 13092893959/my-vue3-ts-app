import { createRouter, createWebHistory } from 'vue-router'
import LoginPage from '../pages/LoginPage.vue'
import HomePage from '../pages/HomePage.vue'
import HomeMainPage from '../pages/HomeMainPage.vue'
import DashboardPage from '../pages/DashboardPage.vue'
import MemberPage from '../pages/MemberPage.vue'
import OrderPage from '../pages/OrderPage.vue'
import RechargePage from '../pages/RechargePage.vue'
import ConsumptionPage from '../pages/ConsumptionPage.vue'
import SnackBarPage from '../pages/SnackBarPage.vue'
import SettingsPage from '../pages/SettingsPage.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: LoginPage,
  },
  {
    path: '/home',
    name: 'Home',
    component: HomePage,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'HomeMain',
        component: HomeMainPage,
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: DashboardPage,
      },
      {
        path: 'member',
        name: 'Member',
        component: MemberPage,
      },
      {
        path: 'order',
        name: 'Order',
        component: OrderPage,
      },
      {
        path: 'recharge',
        name: 'Recharge',
        component: RechargePage,
      },
      {
        path: 'consumption',
        name: 'Consumption',
        component: ConsumptionPage,
      },
      {
        path: 'snack',
        name: 'Snack',
        component: SnackBarPage,
      },
      {
        path: 'settings',
        name: 'Settings',
        component: SettingsPage,
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/home',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  const loggedIn = window.localStorage.getItem('card-manager-logged-in') === 'true'
  if (to.meta.requiresAuth && !loggedIn) {
    next('/login')
  } else if (to.path === '/login' && loggedIn) {
    next('/home')
  } else {
    next()
  }
})

export default router
