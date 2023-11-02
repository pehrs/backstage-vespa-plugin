import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { vespaPlugin, VespaPage } from '../src/plugin';

createDevApp()
  .registerPlugin(vespaPlugin)
  .addPage({
    element: <VespaPage />,
    title: 'Root Page',
    path: '/vespa'
  })
  .render();
