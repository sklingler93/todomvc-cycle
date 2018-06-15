import xs from 'xstream';
import {
  a, button, div, footer, h1, header, input, li, section, span, strong, ul, label
} from '@cycle/dom';
import * as globalStyles from '../../styles';
import * as styles from './styles';

function renderHeader(state) {
  return header([
    h1({ css: styles.title() }, 'todos'),
    input('.new-todo', {
      props: {
        type: 'text',
        placeholder: 'What needs to be done?',
        autofocus: true,
        name: 'newTodo',
        value: state.inputValue
      },
      css: styles.input(),
    })
  ]);
}

function renderMainSection(state, listVDom) {
  const allCompleted = state.list.reduce((x, y) => x && y.completed, true);

  return section('.main', { css: styles.main(state.list.length) }, [
    input('#toggle-all.toggle-all', {
      props: { type: 'checkbox', checked: allCompleted },
      css: styles.toggleAll(),
    }),
    label('.label', {
      attrs: { for: 'toggle-all' },
      css: styles.toggleAllLabel(allCompleted),
    }, 'Mark all as complete'),
    listVDom
  ]);
}

function renderFilterButton(state, filterTag, path, label) {
  const selected = state.filter === filterTag;
  return li({ css: styles.filtersLi() }, [
    a({
      attrs: { href: path },
      css: styles.filtersA(selected)
    }, label)
  ]);
}

function renderFooter(state) {
  const amountCompleted = state.list
    .filter(task => task.completed)
    .length;
  const amountActive = state.list.length - amountCompleted;

  return footer('.footer', { css: styles.footer(state.list.length) }, [
    span('.todo-count', { css: styles.todoCount() }, [
      strong({ css: globalStyles.strong() }, String(amountActive)),
      ' item' + (amountActive !== 1 ? 's' : '') + ' left'
    ]),
    ul('.filters', { css: styles.filters() }, [
      renderFilterButton(state, '', '/', 'All'),
      renderFilterButton(state, 'active', '/active', 'Active'),
      renderFilterButton(state, 'completed', '/completed', 'Completed'),
    ]),
    (amountCompleted > 0 ?
      button('.clear-completed', { css: styles.clearCompleted() }, 'Clear completed (' + amountCompleted + ')')
      : null
    )
  ]);
}

export default function view(state$, listVDom$) {
  return xs.combine(state$, listVDom$).map(([state, listVDom]) =>
    div([
      renderHeader(state),
      renderMainSection(state, listVDom),
      renderFooter(state)
    ])
  );
};
