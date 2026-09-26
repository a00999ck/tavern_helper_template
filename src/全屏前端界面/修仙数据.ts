import { defineStore } from 'pinia';
import { Schema } from './schema';

/**
 * 界面读的 MVU 变量.
 *
 * 这里**没有用 `defineMvuDataStore`**, 两个原因都是踩过的坑:
 *
 * 1. 它按固定的楼层号读. 全屏界面是脚本、没有"自己所在的楼层", 只能读"最新楼层";
 *    而 **AI 正在生成的那一楼就是最新的, 它此刻还没有变量** —— 读到的是空.
 * 2. 它还会把解析结果**写回**楼层变量. 而这里的 schema 每个字段都带 prefault,
 *    `parse(空)` 不报错、只会返回一整套空的默认值 —— 于是"读到空"就变成了
 *    "把空值写进去", 把角色卡自己的变量抹掉.
 *
 * 合起来就是: 生成一开始, 主角姓名、灵根、右栏人物全部消失. 所以这里自己来 ——
 *
 *   - 从最新一楼往前找**第一个真的有变量**的楼层 (正在生成的那一楼会被跳过)
 *   - 读出来只给界面看, **只读, 绝不写回**
 */

/** 往前回看几楼就够: 生成中最多也就差一楼, 再往前都是老聊天里没有变量的空洞 */
const 回看层数 = 20;

/** 最新一个真的有 stat_data 的楼层; 一个都没有时返回 -1 */
function 找有变量的楼层(): number {
  const 最新 = getLastMessageId();
  for (let 楼层 = 最新; 楼层 >= 0 && 楼层 > 最新 - 回看层数; 楼层--) {
    const stat_data = _.get(getVariables({ type: 'message', message_id: 楼层 }), 'stat_data');
    if (_.isObject(stat_data) && !_.isEmpty(stat_data)) {
      return 楼层;
    }
  }
  return -1;
}

function 读变量() {
  const 楼层 = 找有变量的楼层();
  return Schema.parse(_.get(getVariables({ type: 'message', message_id: 楼层 }), 'stat_data', {}));
}

export const use修仙数据 = defineStore('修仙数据', () => {
  const data = ref(读变量());

  // 每两秒对一次表
  useIntervalFn(() => {
    // **生成期间一个字都不读**: 那几秒里最新楼层正在被写, 变量要么还没有、要么正在被替换,
    // 读出来只会是空 —— 界面就会闪一下"姓名没了、灵根没了、人物也没了", 等生成完又好.
    // 所以干脆冻住, 保持这一轮开始前的状态; 生成一结束, 下一次对表自然就切过去了.
    if (builtin.duringGenerating()) {
      return;
    }

    const 新 = 读变量();
    if (!_.isEqual(data.value, 新)) {
      data.value = 新;
    }
  }, 2000);

  return { data };
});
