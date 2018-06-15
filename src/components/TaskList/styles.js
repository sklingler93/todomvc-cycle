import * as styles from '../../styles';

export const main = (listLength) => ({
  'display'   : listLength ? 'block' : 'none',
  'position'  : 'relative',
  'z-index'   : '2',
  'border-top': '1px solid #e6e6e6',
});

export const input = () => ({
  ...styles.input(),
  'padding'   : '16px 16px 16px 60px',
  'border'    : 'none',
  'background': 'rgba(0, 0, 0, 0.003)',
  'box-shadow': 'inset 0 -2px 1px rgba(0,0,0,0.03)',
});

export const title = () => ({
  'position'   : 'absolute',
  'top'        : '-155px',
  'width'      : '100%',
  'font-size'  : '100px',
  'font-weight': '100',
  'text-align' : 'center',
  'color'      : 'rgba(175, 47, 47, 0.15)',
  ...styles.optimizedText(),
});

export const todoList = () => ({
  'margin'    : '0',
  'padding'   : '0',
  'list-style': 'none',
});

export const todoCount = () => ({
  'float'     : 'left',
  'text-align': 'left',
});

export const footer = (listLength) => ({
  'display'   : listLength ? '' : 'none',
  'color'     : '#777',
  'padding'   : '10px 15px',
  'height'    : '20px',
  'text-align': 'center',
  'border-top': '1px solid #e6e6e6',
  '$nest': {
    '&:before': {
      'content'   : '""',
      'position'  : 'absolute',
      'right'     : '0',
      'bottom'    : '0',
      'left'      : '0',
      'height'    : '50px',
      'overflow'  : 'hidden',
      'box-shadow': `0 1px 1px rgba(0, 0, 0, 0.2),
                     0 8px 0 -3px #f6f6f6,
                     0 9px 1px -3px rgba(0, 0, 0, 0.2),
                     0 16px 0 -6px #f6f6f6,
                     0 17px 2px -6px rgba(0, 0, 0, 0.2)`,
    }
  }
});

export const filters = () => ({
  'margin'    : '0',
  'padding'   : '0',
  'list-style': 'none',
  'position'  : 'absolute',
  'right'     : '0',
  'left'      : '0',
});

export const filtersLi = () => ({
  'display': 'inline',
});

export const filtersA = (selected) => ({
  'color'  : 'inherit',
  'margin' : '3px',
  'padding': '3px 7px',
  'border' : '1px solid transparent',
  'border-radius': '3px',
  ...(selected ? {
    'border-color': 'rgba(175, 47, 47, 0.1)',
  } : {}),
  'text-decoration': 'none',
  '$nest': {
    '&:hover': {
      'border-color': 'rgba(175, 47, 47, 0.2)',
    },
  },
});

export const toggleAll = () => ({
  'text-align': 'center',
  'border'    : 'none',
  'opacity'   : '0',
  'position'  : 'absolute',
});

export const toggleAllLabel = (checked) => ({
  'width'    : '60px',
  'height'   : '34px',
  'font-size': '0',
  'position' : 'absolute',
  'top'      : '-52px',
  'left'     : '-13px',
  ...styles.rotate(90),
  '$nest': {
    '&:before': {
      'content'  : `'❯'`,
      'font-size': '22px',
      'color'    : checked ? '#737373' : '#e6e6e6',
      'padding'  : '10px 27px 10px 27px',
    }
  }
});

export const clearCompleted = () => ({
  ...styles.button(),
  'float'          : 'right',
  'position'       : 'relative',
  'line-height'    : '20px',
  'text-decoration': 'none',
  'cursor'         : 'pointer',
  '$nest': {
    '&:hover': {
      'text-decoration': 'underline',
    },
  },
});
