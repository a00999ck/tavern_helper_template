export type 酒馆页面类型 = {
  window: Window;
  document: Document;
  /** 绑定在酒馆文档上的 jQuery, 因此能直接选中酒馆的 DOM */
  $: JQueryStatic;
  toastr: typeof toastr;
};

let 缓存: 酒馆页面类型 | undefined;

function 探测(): 酒馆页面类型 {
  // 酒馆助手是用 iframe 执行脚本的, 这时 `window` 是脚本自己的 iframe, 真正的酒馆页面在
  // `window.parent` / `window.top` 上. 用 `#chat` 是否存在来判断哪个才是酒馆页面.
  for (const 候选 of [window, window.parent, window.top] as (Window | null)[]) {
    try {
      if (!候选?.document.getElementById('chat')) {
        continue;
      }
      const 酒馆全局 = 候选 as Window & { $?: JQueryStatic; jQuery?: JQueryStatic; toastr?: typeof toastr };
      return {
        window: 候选,
        document: 候选.document,
        $: 酒馆全局.$ ?? 酒馆全局.jQuery ?? $,
        toastr: 酒馆全局.toastr ?? toastr,
      };
    } catch {
      // 跨域访问会抛错, 换下一个候选
    }
  }
  return { window, document, $, toastr };
}

/**
 * 酒馆页面本身.
 *
 * 全屏覆盖层必须挂在酒馆页面上、样式也必须注入酒馆页面, 因此凡是碰 `document`、`window`、
 * jQuery 或 toastr 的地方都要用这里给出的那份, 而不是脚本自己 iframe 的那份.
 *
 * 第一次访问时才探测, 保证此时酒馆的 DOM 已经建好了.
 */
export function 酒馆页面(): 酒馆页面类型 {
  缓存 ??= 探测();
  return 缓存;
}
