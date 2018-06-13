export const todoLiStyle = (editing) => ({
  'position'  : 'relative',
  'font-size' : '24px',
  ...(editing ? {
    'border-bottom': 'none',
    'padding'      : '0'
  } : {
    'border-bottom': '1px solid #ededed',
  })
});

export const fontSmoothingStyle = () => ({
  '-webkit-font-smoothing': 'antialiased',
  '-moz-font-smoothing'   : 'antialiased',
  'font-smoothing'        : 'antialiased',
});

export const todoInputStyle = (editing) => ({
  'position'   : 'relative',
  'margin'     : '0',
  'width'      : '100%',
  'font-size'  : '24px',
  'font-family': 'inherit',
  'font-weight': 'inherit',
  'line-height': '1.4em',
  'border'     : '0',
  'outline'    : 'none',
  'color'      : 'inherit',
  'padding'    : '6px',
  'border'     : '1px solid #999',
  'box-shadow' : 'inset 0 -1px 5px 0 rgba(0, 0, 0, 0.2)',
  'box-sizing' : 'border-box',
  ...fontSmoothingStyle,
  ...(editing ? {
    'display': 'block',
    'width'  : '506px',
    'padding': '13px 17px 12px 17px',
    'margin' : '0 0 0 43px',
  } : {
    'display': 'none',
  })
});