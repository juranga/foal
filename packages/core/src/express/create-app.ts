import * as path from 'path';

import * as csurf from 'csurf';
import * as express from 'express';
import * as session from 'express-session';
import * as helmet from 'helmet';
import * as logger from 'morgan';

import { initDB } from '../common';
import { App, Config, IModule } from '../core';
import { getAppRouter } from './get-app-router';
import { handleErrors } from './handle-errors';
import { notFound } from './not-found';

export function createApp(rootModuleClass: IModule) {
  const app = new App(rootModuleClass);
  const preHook = initDB(app.models);
  app.controllers.forEach(controller => {
    controller.addPreHooksAtTheTop([ preHook ]);
  });

  const expressApp = express();

  expressApp.use(logger('[:date] ":method :url HTTP/:http-version" :status - :response-time ms'));
  expressApp.use(express.static(path.join(process.cwd(), Config.get('settings', 'staticUrl', '/public') as string)));
  expressApp.use(helmet());
  expressApp.use(express.json());
  expressApp.use(session({
    cookie: {
      domain: Config.get('settings', 'sessionCookieDomain'),
      httpOnly: Config.get('settings', 'sessionCookieHttpOnly'),
      maxAge: Config.get('settings', 'sessionCookieMaxAge'),
      path: Config.get('settings', 'sessionCookiePath'),
      secure: Config.get('settings', 'sessionCookieSecure'),
    },
    name: Config.get('settings', 'sessionName'),
    resave: Config.get('settings', 'sessionResave', false),
    saveUninitialized: Config.get('settings', 'sessionSaveUninitialized', true),
    secret: Config.get('settings', 'sessionSecret', ''),
  }));

  if (Config.get('settings', 'csrf', false) as boolean) {
    expressApp.use(csurf());
    expressApp.use((req, res, next) => {
      req.csrfToken = req.csrfToken();
      next();
    });
  }
  expressApp.use((req, res, next) => {
    if (req.body) {
      delete req.body._csrf;
    }
    next();
  });
  expressApp.use((err, req, res, next) => {
    if (err.code === 'EBADCSRFTOKEN') {
      res.status(403).send('Bad csrf token.');
    } else {
      next(err);
    }
  });

  expressApp.use(getAppRouter(app, [
    {
      req: 'csrfToken',
      state: 'csrfToken'
    }
  ]));
  expressApp.use(notFound());
  expressApp.use(handleErrors(Config.get('settings', 'debug', false) as boolean, console.error));

  return expressApp;
}
