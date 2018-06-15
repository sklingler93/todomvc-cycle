import * as styles from '../../styles';

export const view = (editing) => ({
  'display': editing ? 'none' : 'block',
});

export const todoLi = (editing, last) => ({
  'position'  : 'relative',
  'font-size' : '24px',
  ...(editing ? {
    'border-bottom': 'none',
    'padding'      : '0',
  } : {
    'border-bottom': '1px solid #ededed',
  }),
  ...(last ? {                            // Instead of using a :last-child selector,
    'border-bottom': 'none',              // the element selects the style
  } : {}),
});

export const toggle = () => ({
  'text-align': 'center',
  'width'     : '40px',
  'height'    : 'auto',
  'position'  : 'absolute',
  'top'       : '0',
  'bottom'    : '0',
  'margin'    : 'auto 0',
  'border'    : 'none',
  'appearance': 'none',
  '-webkit-appearance': 'none',
});

export const todoInput = (editing) => ({
  ...styles.input(),
  ...(editing ? {
    'display': 'block',
    'width'  : '506px',
    'padding': '13px 17px 12px 17px',
    'margin' : '0 0 0 43px',
  } : {
    'display': 'none',
  })
});

export const label = (completed) => ({
  'word-break'  : 'break-all',
  'padding'     : '15px 15px 15px 60px',
  'display'     : 'block',
  'line-height' : '1.2',
  'transition'  : 'color 0.4s',
  'background-repeat'  : 'no-repeat',
  'background-position': 'center left',
  ...(completed ? {
    'color'           : '#d9d9d9',
    'text-decoration' : 'line-through',
    'background-image': `url('data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%22-10%20-18%20100%20135%22%3E%3Ccircle%20cx%3D%2250%22%20cy%3D%2250%22%20r%3D%2250%22%20fill%3D%22none%22%20stroke%3D%22%23bddad5%22%20stroke-width%3D%223%22/%3E%3Cpath%20fill%3D%22%235dc2af%22%20d%3D%22M72%2025L42%2071%2027%2056l-4%204%2020%2020%2034-52z%22/%3E%3C/svg%3E')`,
  } : {
    'background-image': `url('data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%22-10%20-18%20100%20135%22%3E%3Ccircle%20cx%3D%2250%22%20cy%3D%2250%22%20r%3D%2250%22%20fill%3D%22none%22%20stroke%3D%22%23ededed%22%20stroke-width%3D%223%22/%3E%3C/svg%3E')`,
  })
});

export const destroy = (todoHover) => ({
  ...styles.button(),
  'display' : todoHover ? 'block' : 'none',   // Hover can be done in javascript
  'position': 'absolute',
  'top'     : '0',
  'right'   : '10px',
  'bottom'  : '0',
  'width'   : '40px',
  'height'  : '40px',
  'margin'  : 'auto 0',
  'color'   : '#cc9a9a',
  'font-size' : '30px',
  'transition': 'color 0.2s ease-out',
  'margin-bottom': '11px',
  '$nest': {
    '&:hover': {                              // Hover can also be done in plain css
      'color'  : '#af5b5e',
    },
    '&:after': {
      'content': `'×'`,
    },
  }
});
