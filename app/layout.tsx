import type {Metadata} from 'next';import './globals.css';
export const metadata:Metadata={title:'我选这首歌',description:'音乐人格选择游戏'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="zh-CN"><body>{children}</body></html>}