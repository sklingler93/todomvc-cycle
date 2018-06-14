import {button, div, input, label, li} from '@cycle/dom';
import {todoLiStyle, todoInputStyle} from './styles';

export default function view(state$) {
  return state$.map(({title, completed, editing}) =>
    return li('.todoRoot', {css: todoLiStyle(editing), class: {completed, editing}}, [
      div('.view', [
        input('.toggle', {
          props: {type: 'checkbox', checked: completed},
          style: {color: 'red'}
        }),
        label(title),
        button('.destroy')
      ]),
      input('.edit', {
        css: todoInputStyle(editing),
        props: {type: 'text'},
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
