import { view } from '@foal/common';
import { Module } from '@foal/core';

import { IndexViewService } from './index-view.service';

export const PublicModule: Module = {
  controllers: [
    view
      .attachService('/', IndexViewService)
      .withPreHook(ctx => { ctx.state.locals = { name: 'FoalTS' }; })
  ]
};