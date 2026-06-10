import type { ComponentType } from 'react';
import type { SVGIcon } from '@progress/kendo-svg-icons';
import { homeIcon, windowIcon, toolbarFloatIcon, volumeUpIcon, gridLayoutIcon, calendarIcon, chartBarStackedIcon } from '@progress/kendo-svg-icons';

import Home from './pages/Home';
import StackedWindows from './pages/StackedWindows';
import MapToolbars from './pages/MapToolbars';
import IconToggleButton from './pages/IconToggleButton';
import AlignmentManageViews from './pages/AlignmentManageViews';
import Calendar from './pages/Calendar';
import LaunchPlanning from './pages/LaunchPlanning';

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
  {
    path: '/calendar',
    label: 'Calendar',
    icon: calendarIcon,
    description: 'Shared commercialization calendar for sales teams, built on the Kendo Scheduler.',
    component: Calendar,
  },
  {
    path: '/launch-planning',
    label: 'Launch Planning',
    icon: chartBarStackedIcon,
    description: 'Systems roadmap across launch workstreams, built on the Kendo Gantt.',
    component: LaunchPlanning,
  },
];
