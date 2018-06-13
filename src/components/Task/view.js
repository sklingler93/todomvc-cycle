import {button, div, input, label, li} from '@cycle/dom';
import {todoLiStyle, todoInputStyle} from './styles';

function view(state$) {
  return state$.map((state) => {
    let {title, completed, editing} = state;
    let todoRootClasses = {
      completed,
      editing,
    };

    return li('.todoRoot', {css: todoLiStyle(editing), class: todoRootClasses}, [
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
    ]);
  });
}

export default view;
