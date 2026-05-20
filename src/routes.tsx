import type { ComponentType } from 'react';
import type { SVGIcon } from '@progress/kendo-svg-icons';
import { homeIcon, windowIcon } from '@progress/kendo-svg-icons';

import Home from './pages/Home';
import StackedWindows from './pages/StackedWindows';

export type RouteDef = {
  path: string;
  label: string;
  icon: SVGIcon;
  description: string;
  component: ComponentType;
};

export const routes: RouteDef[] = [
  {
    path: '/',
    label: 'Home',
    icon: homeIcon,
    description: 'The card-based launcher for every prototype in the playground.',
    component: Home,
  },
  {
    path: '/stacked-windows',
    label: 'Stacked Windows',
    icon: windowIcon,
    description: 'Prototype for stacked Kendo Window patterns.',
    component: StackedWindows,
  },
];
