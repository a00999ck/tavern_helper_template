/**
 * 修仙恋爱角色卡的**显示层**变量结构 —— ⚠️ 这不是角色卡自己的 schema.
 *
 * 真正的变量结构在 `../../修仙恋爱角色卡脚本/schema.ts`, 那里定义了字段名与默认值,
 * 世界书里的「变量更新规则」也是照着它写的. 这一份只是让界面知道该怎么读那些字段.
 *
 * 界面是**纯显示层**: 变量由 AI 通过 `<UpdateVariable><JSONPatch>` 输出、由 MVU 写进楼层变量,
 * 界面只读 `stat_data`, 不生成正文, 也不定义任何自己造的协议.
 *
 * 两条安全约束:
 * 1. 所有对象都用 `.looseObject()`: **不认识的字段原样保留**, 界面不会把角色卡自己的变量看丢.
 * 2. `世界 / 主角 / 人物` 都是可选的: 卡里没有哪一段时界面就不显示哪一段,
 *    而不是凭空塞一段假的出来.
 *
 * 界面读变量的方式见 `./修仙数据`: 从最新一楼往前找第一个真的有变量的楼层 (AI 正在生成的那楼跳过),
 * 而且**只读不写回** —— 早先读过 `defineMvuDataStore`, 它既会追最新楼、又会把解析结果写回去,
 * 于是生成一开始就读到空、还把空值写了进去, 把姓名、灵根、人物全抹掉了.
 */

const 文字 = z.string().prefault('').catch('');

/** 灵根 */
const 灵根Schema = z.looseObject({
  名称: 文字,
  /** 修炼速率倍率 */
  倍率: z.coerce.number().prefault(1).catch(1),
  描述: 文字,
});

/** 一门功法 */
const 功法Schema = z.looseObject({
  品阶: 文字,
  /** 修炼速率倍率 */
  倍率: z.coerce.number().prefault(1).catch(1),
  描述: 文字,
});

/**
 * 一位双修对象.
 *
 * 它不给倍率 —— 倍率由对方的好感度阶段决定, 由角色卡把所有双修对象的加成加起来.
 */
const 双修Schema = z.looseObject({
  描述: 文字,
});

/** 一件物品 */
const 物品Schema = z.looseObject({
  描述: 文字,
  数量: z.coerce.number().prefault(1).catch(1),
});

export const 世界Schema = z.looseObject({
  /** 自大衍历元年正月初一起算的第几天, 由「世界推进」脚本推进 */
  历日: z.coerce.number().prefault(0).catch(0),
  /** 晨光 / 正午 / 暮色 / 深夜 */
  时段: 文字,
  /** 由历日与时段格式化而来的展示文本, 例: '大衍历三年 三月初七 暮色' */
  $当前时间: z.string().optional().catch(undefined),
  /** 大区域 */
  当前大区: 文字,
  /** 大区下辖的小区域 */
  当前地点: 文字,
  天气: 文字,
  /** 场景背景图的**文件名**; 留空时界面自动用当前大区那张 */
  背景: 文字,
  /** 当前场面画(事件 CG)的文件名, 留空则不显示 */
  CG: 文字,
  /** 这张 CG 的说明, 用作 alt */
  CG说明: 文字,
  /** AI 报告的距离上一楼过了多少天(不含跨区赶路), 由「世界推进」脚本读完清零 */
  经过天数: z.coerce.number().prefault(0).catch(0),
  /** 进行中的事务: { [事务名]: 描述 } */
  近期事务: z.record(z.string(), z.string()).prefault({}).catch({}),
  /** 只读: 「世界推进」脚本上一轮在移动上做了什么 */
  _移动日志: 文字,
  /** 只读: 「世界推进」脚本上一轮记下的、有人好感跨档的际遇 */
  _际遇日志: 文字,
  /** 只读: 还欠着没写的跨档事件 */
  _待写事件: z.record(z.string(), z.string()).prefault({}).catch({}),
});

export const 主角Schema = z.looseObject({
  姓名: 文字,
  道号: 文字,
  身份: 文字,
  /** 例: '炼气三层' */
  境界: 文字,
  立绘: 文字,
  简介: 文字,
  /** 当前境界内已积累的修为; 上限见 $修为上限 */
  修为: z.coerce.number().prefault(0).catch(0),
  灵根: 灵根Schema.prefault({}).catch(() => 灵根Schema.parse({})),
  功法: z.record(z.string(), 功法Schema).prefault({}).catch({}),
  双修: z.record(z.string(), 双修Schema).prefault({}).catch({}),
  状态: z.record(z.string(), z.string()).prefault({}).catch({}),
  物品栏: z.record(z.string(), 物品Schema).prefault({}).catch({}),
  /** 只读: 「修行推进」脚本上一轮做了什么 */
  _修行日志: 文字,

  // 以下都是角色卡 schema 里算好的只读派生值.
  // 用 `.optional()` 而不是给默认值: 界面只读它们, 缺了就不显示,
  // 免得把一堆空字符串写回角色卡的变量里.
  $境界描述: z.string().optional().catch(undefined),
  $境界能力范围: z.string().optional().catch(undefined),
  /** 当前境界每过一日能得到多少修为 */
  $境界速率: z.coerce.number().optional(),
  /** 突破到下一境界所需的修为 */
  $修为上限: z.coerce.number().optional(),
  /** 这一境靠纯修炼突破要多少年 (倍率按 1 算) */
  $纯修年: z.coerce.number().optional(),
  /** 1 + 所有双修对象按其好感度阶段给出的加成之和 */
  $双修倍率: z.coerce.number().optional(),
  $修炼倍率: z.coerce.number().optional(),
  /** 每过一日修为增加多少 */
  $修为增速: z.coerce.number().optional(),
});

export const 人物Schema = z.looseObject({
  身份: 文字,
  境界: 文字,
  立绘: 文字,
  /** 差分表情; '默认' 就用立绘那张 */
  表情: 文字,
  简介: 文字,
  /** 对主角的好感度, 0 ~ 100 */
  好感度: z.coerce.number().prefault(0).catch(0),
  /** 对方此刻最真实的心意, 第一人称 */
  情愫: 文字,
  关系: 文字,
  心结: 文字,
  /** 只读: 她到过的最高好感档位, 由「世界推进」脚本维护 */
  _已达阶段: 文字,
  /** 角色卡算出的只读派生值, 缺了就不显示 */
  $好感阶段: z.string().optional().catch(undefined),
  /** 她此刻能接受到哪一级尺度（0~5） */
  $尺度: z.coerce.number().optional(),
  /** 上面那一级叫什么, 如 '肌肤' */
  $尺度名: z.string().optional().catch(undefined),
});

/**
 * 界面用的变量结构.
 *
 * 三块各自 `.catch(undefined)`: 哪一块的体例对不上, 就当它没有、界面显示空态,
 * 而不是抛错 —— 读变量那一步 parse 一抛, 整个状态栏就建不起来了。
 *
 * 外面没再包一层 `.catch` 兜"整张变量表都不是对象": 那一种要 `stat_data` 本身被写坏才会发生,
 * 而 `./修仙数据` 那边已经先筛过"是个非空对象"才交给 schema。
 */
export const Schema = z.looseObject({
  世界: 世界Schema.optional().catch(undefined),
  主角: 主角Schema.optional().catch(undefined),
  /** 出场人物: { [姓名]: { 身份, 境界, 立绘, 简介, 好感度, 情愫, 关系, 心结 } } */
  人物: z.record(z.string(), 人物Schema).optional().catch(undefined),
});

export type Schema = z.output<typeof Schema>;

/** 卡里还没写到这一段时, 界面用它们渲染空状态 */
export const 空世界 = 世界Schema.parse({});
export const 空主角 = 主角Schema.parse({});
