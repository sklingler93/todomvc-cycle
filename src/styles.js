export const strong = () => ({
  'font-weight': '300',
});

export const rotate = (degrees) => ({
  '-webkit-transform': `rotate(${ degrees }deg)`,
  'transform'        : `rotate(${ degrees }deg)`,
});

export const fontSmoothing = () => ({
  '-webkit-font-smoothing': 'antialiased',
  '-moz-font-smoothing'   : 'grayscale',
});

export const optimizedText = () => ({
  '-webkit-text-rendering': 'optimizeLegibility',
  '-moz-text-rendering'   : 'optimizeLegibility',
  'text-rendering'        : 'optimizeLegibility',
});

export const normalizeAppearance = () => ({
  '-webkit-appearance': 'none',
  'appearance'        : 'none',
});

export const input = () => ({
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
  ...fontSmoothing()
});

export const button = () => ({
  'margin'        : '0',
  'padding'       : '0',
  'border'        : '0',
  'background'    : 'none',
  'font-size'     : '100%',
  'vertical-align': 'baseline',
  'font-family'   : 'inherit',
  'font-weight'   : 'inherit',
  'color'         : 'inherit',
  ...normalizeAppearance(),
  ...fontSmoothing(),
})
