'use client';

import { useEffect, useState } from 'react';

/**
 * zustand persist 会在客户端恢复 localStorage 里的数据，
 * 与服务端渲染结果不一致。用这个 hook 做一次水合守卫，避免 hydration mismatch。
 */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
