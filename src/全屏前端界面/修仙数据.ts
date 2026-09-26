import { defineMvuDataStore } from '@util/mvu';
import { Schema } from './schema';

/**
 * 界面读取的 MVU 变量.
 *
 * 全屏界面是脚本而不是楼层里的前端界面, 没有"所在楼层"可言, 所以固定读**最新楼层**的
 * `stat_data`; `defineMvuDataStore` 每两秒会自己同步一次, 因此换楼层、变量更新都会跟上.
 */
export const use修仙数据 = defineMvuDataStore(Schema, { type: 'message', message_id: -1 });
