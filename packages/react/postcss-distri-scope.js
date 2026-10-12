/**
 * PostCSS plugin that keeps @distri/react's stylesheet from touching the host
 * app.
 *
 * - Tailwind's `*, ::before, ::after` / `::backdrop` variable defaults
 *   (`--tw-ring-*`, `--tw-translate-*`, …) are re-scoped to the Distri roots.
 * - Any remaining selector that is not anchored to a class, id or `[data-…]`
 *   attribute (i.e. would match bare host elements such as `button` or
 *   `body`) fails the build.
 *
 * Distri roots: `.distri-chat` (Chat / TaskView), `.distri-root` (standalone
 * components and portalled popovers) and `[data-distri]`.
 */
export const DISTRI_ROOTS = ':where(.distri-chat, .distri-root, [data-distri])';

const GLOBAL_PSEUDO = /^::?(before|after|backdrop)$/;

function isScoped(selector) {
  return selector.includes('.') || selector.includes('#') || selector.includes('[data-');
}

function insideKeyframes(rule) {
  return rule.parent && rule.parent.type === 'atrule' && /keyframes$/i.test(rule.parent.name);
}

export default function distriScope() {
  return {
    postcssPlugin: 'distri-scope',
    OnceExit(root) {
      root.walkRules((rule) => {
        if (insideKeyframes(rule)) return;
        const selectors = [];
        for (const raw of rule.selectors) {
          const selector = raw.trim();
          if (selector === '*') {
            selectors.push(DISTRI_ROOTS, `${DISTRI_ROOTS} *`);
          } else if (GLOBAL_PSEUDO.test(selector)) {
            selectors.push(`${DISTRI_ROOTS}${selector}`, `${DISTRI_ROOTS} ${selector}`);
          } else {
            selectors.push(selector);
          }
        }
        rule.selectors = Array.from(new Set(selectors));
        for (const selector of rule.selectors) {
          if (!isScoped(selector)) {
            throw rule.error(`distri-scope: selector "${selector}" is not scoped to a Distri root and would restyle the host app`);
          }
        }
      });
    },
  };
}
distriScope.postcss = true;
