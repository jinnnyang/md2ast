const s1 = '![示例图片](https://via.placeholder.com/150 "sss")';
const m1 = s1.match(/^!\[(.*?)\]\(\s*([^ \t)]+)(?:\s+"(.*?)")?\s*\)/);
console.log('Image:', m1);

const s2 = '[Google](https://www.google.com "sss")';
const m2 = s2.match(/^\[(.*?)\]\(\s*([^ \t)]+)(?:\s+"(.*?)")?\s*\)/);
console.log('Link:', m2);
