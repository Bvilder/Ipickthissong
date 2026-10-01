import base from '@/data/gem.json';import type {Song} from './types';
const extra:string[]=['OH BOY','Where Did U Go','不存在的存在','盲点','新的心跳','你不是真正的快乐','如果没有你','你把我灌醉','我要我们在一起','All About U','Good To Be Bad','What Have U Done','Someday I\'ll Fly','一路逆风','再见','很久以后'];
const details:Record<string,Partial<Song>>={
'泡沫':{releaseDate:'2012-10-12',story:'从一段感情里看见幻灭，也在破碎之后学会诚实。它是邓紫棋最具代表性的叙事抒情歌之一。'},
'光年之外':{releaseDate:'2016-12-27',story:'电影《太空旅客》中国区主题曲。宇宙尺度的孤独，被写成一份跨越光年的坚定告白。'},
'句号':{releaseDate:'2019-11-22',story:'写给一段重要合作关系的告别。她把成长里的不甘与释然都收进了这一枚句号。'},
'来自天堂的魔鬼':{releaseDate:'2015-11-05',story:'以强烈的节奏和暗黑张力描绘危险吸引力，是她舞台爆发力的代表作。'},
'倒数':{releaseDate:'2018-08-16',story:'在倒数的时间里，把爱说得更坦诚。这首歌记录的是与当下和解的勇气。'},
'喜欢你':{releaseDate:'2014-02-21',story:'在《我是歌手》的舞台上重新演绎经典，细腻与爆发同时抵达。'}
};
const additions:Song[]=extra.map((title,i)=>({id:`x${i+1}`,title,artist:'邓紫棋',album:i%2?'新的心跳':'摩天动物园',year:2014+i%8,genre:['流行'],tags:[i%2?'情绪':'舞台',i%3?'成长':'经典']}));
export const getSongsByArtist=():Song[]=>[...(base as Song[]),...additions].map(s=>({...s,...details[s.title],links:[{label:'QQ音乐 MV（演示占位）',url:'https://y.qq.com/'},{label:'推荐舞台（演示占位）',url:'https://y.qq.com/'}]}));
export const getPopularSongs=()=>getSongsByArtist().slice(0,50);