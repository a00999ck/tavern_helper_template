import { 结算 } from './推进';

/**
 * 世界推进脚本
 *
 * 时间怎么走、人能到哪里、修为怎么涨、什么时候突破, **全部在脚本里算**, AI 不参与:
 * AI 只负责在变量里报告 `世界.经过天数` 和新的 `世界.当前大区`/`当前地点`,
 * 脚本在 MVU 解析完 AI 的更新命令后立刻结算, 并把结果写进
 * `世界._移动日志` 与 `主角._修行日志`.
 *
 * 两段日志都是给 AI 看的: AI 每轮生成时都会从 `<status_current_variable>` 读到它们,
 * 因此不会因为"我明明只走了半天, 怎么时间跳了六天"或者"我只写了修为 +5,
 * 怎么变量里变成 +9 万了"而困惑, 也能据此补写赶路与突破的剧情.
 *
 * 具体算法见 `./推进`.
 */

async function 主流程(): Promise<void> {
  await waitGlobalInitialized('Mvu');

  // 在 MVU 解析完 AI 的更新命令之后结算; 按 MVU 文档, 这里直接改变量即可生效
  eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, (variables, 旧变量) => {
    void errorCatched(() => 结算(variables, 旧变量))();
  });

  console.info('[世界推进] 已加载: 赶路耗时、历日与修为都由脚本结算');
}

$(() => {
  void errorCatched(主流程)();
});
