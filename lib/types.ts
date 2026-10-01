export type Song={id:string;title:string;artist:string;album:string;year:number;genre:string[];tags:string[];releaseDate?:string;story?:string;links?:{label:string;url:string}[]};
export type Choice={round:number;winnerId:string;loserId:string;timestamp:number};
export type Dimension={name:string;score:number};
export type PersonalityResult={tags:string[];dimensions:Dimension[];verdict:string};
export type GameSession={id:string;mode:'bracket32';artist:string;songs:Song[];rounds:Choice[];finalSongId?:string;createdAt:string};