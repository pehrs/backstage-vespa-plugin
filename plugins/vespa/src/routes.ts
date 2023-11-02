import { createRouteRef } from '@backstage/core-plugin-api';

export const rootRouteRef = createRouteRef({
  id: 'vespa',
});

export const rootDetailsRouteRef = createRouteRef({
  id: 'vespa:details',
  params: ['clusterName'],
});
