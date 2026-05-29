import type { ComponentType } from 'react';
import type { SVGIcon } from '@progress/kendo-svg-icons';
import { homeIcon, windowIcon, toolbarFloatIcon, volumeUpIcon, gridLayoutIcon } from '@progress/kendo-svg-icons';

import Home from './pages/Home';
import StackedWindows from './pages/StackedWindows';
import MapToolbars from './pages/MapToolbars';
import IconToggleButton from './pages/IconToggleButton';
import AlignmentManageViews from './pages/AlignmentManageViews';

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
    label: 'Alignment-Map Windows',
    icon: windowIcon,
    description: 'Prototype for stacked Kendo Window patterns.',
    component: StackedWindows,
  },
  {
    path: '/map-toolbars',
    label: 'Alignment-Map Toolbar',
    icon: toolbarFloatIcon,
    description: 'Floating Kendo Toolbar over a map with a popup tool palette.',
    component: MapToolbars,
  },
  {
    path: '/icon-togglebutton',
    label: 'Alignment-Quick Align Toggle',
    icon: volumeUpIcon,
    description: 'Icon-only Kendo Button that swaps its icon between on/off states.',
    component: IconToggleButton,
  },
  {
    path: '/alignment-manage-views',
    label: 'Alignment-Manage Views',
    icon: gridLayoutIcon,
    description: 'Manage saved territory alignment views.',
    component: AlignmentManageViews,
  },
];
