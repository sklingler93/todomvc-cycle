import {button, div, input, label, li} from '@cycle/dom';
import * as styles from './styles';

export default function view(state$) {
  return state$.map(({ title, completed, editing, hover, last }) =>
    li('.todo-root', { css: styles.todoLi(editing, last), class: {completed, editing} }, [
      div('.view', { css: styles.view(editing) }, [
        input('.toggle', {
          props: { type: 'checkbox', checked: completed },
          css: styles.toggle()
        }),
        label({ css: styles.label(completed) }, title),
        button('.destroy', { css: styles.destroy(hover) })
      ]),
      input('.edit', {
        css: styles.todoInput(editing),
        props: { type: 'text' },
        hook: {
          update: (oldVNode, {elm}) => {
            elm.value = title;
            if (editing) {
              elm.focus();
              elm.selectionStart = elm.value.length;
            }
          }
        }
      })
    ])
  );
}
