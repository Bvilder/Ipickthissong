'use client';

import { useSyncExternalStore } from 'react';

/**
 * 客户端水合标记。
 *
 * zustand persist 会在客户端恢复 localStorage 的数据，与服务端渲染结果不一致，
 * 用它做一次守卫即可避免 hydration mismatch，且不会触发额外的级联渲染。
 */
const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export function useMounted(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
