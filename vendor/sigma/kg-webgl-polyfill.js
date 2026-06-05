/**
 * Sigma v3 lee WebGL2RenderingContext / WebGLRenderingContext al parsear el bundle.
 * En el iframe de HtmlService no siempre existen como globales; definirlos antes de sigma.min.js.
 */
(function (root) {
  if (!root) {
    root =
      typeof globalThis !== 'undefined'
        ? globalThis
        : typeof window !== 'undefined'
          ? window
          : this;
  }
  if (root.WebGL2RenderingContext && root.WebGLRenderingContext) return;

  if (typeof document !== 'undefined') {
    try {
      var canvas = document.createElement('canvas');
      var gl2 = canvas.getContext('webgl2');
      if (gl2 && gl2.constructor && !root.WebGL2RenderingContext) {
        root.WebGL2RenderingContext = gl2.constructor;
      }
      var gl =
        gl2 ||
        canvas.getContext('webgl') ||
        canvas.getContext('experimental-webgl');
      if (gl && gl.constructor && !root.WebGLRenderingContext) {
        root.WebGLRenderingContext = gl.constructor;
      }
    } catch (eGl) {}
  }

  if (!root.WebGLRenderingContext && root.WebGL2RenderingContext) {
    root.WebGLRenderingContext = root.WebGL2RenderingContext;
  }
  if (!root.WebGL2RenderingContext && root.WebGLRenderingContext) {
    root.WebGL2RenderingContext = root.WebGLRenderingContext;
  }

  if (!root.WebGL2RenderingContext) {
    root.WebGL2RenderingContext = {
      BOOL: 0x8b56,
      BYTE: 0x1400,
      UNSIGNED_BYTE: 0x1401,
      SHORT: 0x1402,
      UNSIGNED_SHORT: 0x1403,
      INT: 0x1404,
      UNSIGNED_INT: 0x1405,
      FLOAT: 0x1406,
    };
  }
  if (!root.WebGLRenderingContext) {
    root.WebGLRenderingContext = {
      UNSIGNED_BYTE: 0x1401,
      FLOAT: 0x1406,
      TRIANGLES: 0x0004,
    };
  }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this);
