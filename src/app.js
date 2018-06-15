import {run} from '@cycle/run';
import {makeDOMDriver} from '@cycle/dom';
import storageDriver from '@cycle/storage';
import {captureClicks, makeHistoryDriver} from '@cycle/history'
import onionify from 'cycle-onionify';
import storageify from 'cycle-storageify';
import TaskList from './components/TaskList';

import PropsModule from 'snabbdom/modules/props';
import AttrsModule from 'snabbdom/modules/attributes';
import StyleModule from 'snabbdom/modules/style';
import ClassModule from 'snabbdom/modules/class';
import CssModule from 'snabbdom-typestyle';

const modules = [
  PropsModule,
  AttrsModule,
  StyleModule,
  CssModule,
  ClassModule
];

const main = onionify(storageify(TaskList, {key: 'todos-cycle'}));

run(main, {
  DOM: makeDOMDriver('.todoapp', {modules, transposition: true}),
  history: captureClicks(makeHistoryDriver()),
  storage: storageDriver,
});
