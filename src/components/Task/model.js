import xs from 'xstream';

export default function model(actions) {
  const startEditReducer$ = actions.startEdit$
    .mapTo(function startEditReducer(data) {
      return {...data, editing: true};
    });

  const doneEditReducer$ = actions.doneEdit$
    .map(content => function doneEditReducer(data) {
      return {...data, title: content, editing: false};
    });

  const cancelEditReducer$ = actions.cancelEdit$
    .mapTo(function cancelEditReducer(data) {
      return {...data, editing: false};
    });

  const toggleReducer$ = actions.toggle$
    .map(isToggled => function toggleReducer(data) {
      return {...data, completed: isToggled};
    });

  const destroyReducer$ = actions.destroy$
    .mapTo(function destroyReducer(data) {
      return void 0;
    });

  const hoverReducer$ = actions.hover$
    .mapTo(function hoverReducer(data) {
      return {...data, hover: true};
    });

  const unhoverReducer$ = actions.unhover$
    .mapTo(function unhoverReducer(data) {
      return {...data, hover: false};
    });

  return xs.merge(
    startEditReducer$,
    doneEditReducer$,
    cancelEditReducer$,
    toggleReducer$,
    destroyReducer$,
    hoverReducer$,
    unhoverReducer$,
  );
}
