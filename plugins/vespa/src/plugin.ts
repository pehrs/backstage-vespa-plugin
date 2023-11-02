import { createPlugin, createRoutableExtension } from '@backstage/core-plugin-api';

import { rootRouteRef, rootDetailsRouteRef } from './routes';

export const vespaPlugin = createPlugin({
  id: 'vespa',
  routes: {
    root: rootRouteRef,
    details: rootDetailsRouteRef,
  },
});

export const VespaPage = vespaPlugin.provide(
  createRoutableExtension({
    name: 'VespaPage',
    component: () =>
      import('./components/VespaPage').then(m => m.VespaPage),
    mountPoint: rootRouteRef,
  }),
);

export const VespaDetailsPage = vespaPlugin.provide(
  createRoutableExtension({
    name: 'VespaDetailsPage',
    component: () =>
      import('./components/VespaPage').then(m => m.VespaDetailsPage),
    mountPoint: rootDetailsRouteRef,
  }),
);
