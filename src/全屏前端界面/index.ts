import { teleportStyle } from '@util/script';
import App from './App.vue';
import { 启用类名, 是首次运行, 隐藏历史楼层类名 } from './store';
import { 酒馆页面 } from './酒馆页面';

/**
 * 全屏前端界面
 *
 * 楼层里的前端界面被关在楼层 iframe 内, 覆盖不了整个网页, 所以这里做成脚本.
 * 又因为酒馆助手是用 iframe 执行脚本的, 脚本自己的 `document` 并不是酒馆页面,
 * 因此宿主容器、样式、body 类名全都得往 `酒馆页面()` 给出的那份文档上放,
 * 卸载时再把它们一并清掉.
 */
$(() => {
  errorCatched(() => {
    const { document: 酒馆文档, $: $酒馆, toastr: 酒馆提示 } = 酒馆页面();

    // 脚本不在酒馆页面里时, 打包进来的样式只落在脚本自己的文档里, 得搬一份到酒馆页面,
    // 否则界面就是一堆没有样式的裸元素
    const 样式搬运 = 酒馆文档 === document ? { destroy: () => {} } : teleportStyle(酒馆文档.head);

    // 不用 `createScriptIdDiv`: 它用的是脚本自己那份 `$`, 这里必须保证宿主建在酒馆文档里
    const $宿主 = $酒馆('<div>').attr({ id: 'TH-fullscreen-host', script_id: getScriptId() });
    // 样式要在挂载前搬好, 免得界面先以裸元素的样子闪一下
    $酒馆(酒馆文档.body).append($宿主);

    const 首次运行 = 是首次运行();
    const app = createApp(App).use(createPinia());
    app.mount($宿主[0]);

    console.info(
      `[全屏前端界面] 已加载 (运行位置: ${getIframeName()}, ${
        酒馆文档 === document ? '与酒馆同文档' : '已从脚本 iframe 搬到酒馆页面'
      })`,
    );
    if (首次运行) {
      酒馆提示.info('点右上角的圆钮, 可以在全屏界面和酒馆界面之间切换 (按钮可以拖动)', '全屏前端界面已加载');
    }

    $(window).on('pagehide', () => {
      app.unmount();
      $宿主.remove();
      样式搬运.destroy();
      酒馆文档.body.classList.remove(启用类名, 隐藏历史楼层类名);
      console.info('[全屏前端界面] 已卸载');
    });
  })();
});
