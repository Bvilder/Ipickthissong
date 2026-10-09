把专辑封面图放到这个目录（public/covers/）下。

命名建议：用拼音/英文文件名，避免中文路径问题，例如：
  邓紫棋《Xposed》        ->  xposed.jpg
  邓紫棋《摩天动物园》     ->  motian-dongwuyuan.jpg
  周杰伦《叶惠美》        ->  yehuimei.jpg
  周杰伦《范特西》        ->  fantexi.jpg

放好后，编辑 data/albumCovers.json，把对应专辑的值填成文件名（如 "xposed.jpg"），
或直接填图片 URL（https://...）即可。同一张专辑下的歌曲会自动共享这张封面。
