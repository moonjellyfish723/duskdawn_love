// #227 诊断导出 docx 行为验证（纯 Node + vm 跑真实源码，零浏览器依赖）
// 用户要求两处诊断（信息诊断/屏幕适配诊断）「导出txt」升级为「导出docx」。
// docx = ZIP 容器的 OOXML，device.js 零依赖手写「存储式 ZIP + CRC32」——本脚本
// 从 src/js/device.js 抽取 crc32/buildDocxBlob 真实实现，在 vm 沙箱生成真实 docx
// 字节，逐字段解析 ZIP 结构 + 独立重算 CRC + document.xml 内容断言，最后静态
// 断言两处弹窗按钮接线齐全（任何一环被并行会话改坏都会红）。
// 用法：node tools/verify-docx-export.mjs
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

let pass = 0, fail = 0;
const ok = (cond, name) => { if (cond) { pass++; console.log('  ✓ ' + name); } else { fail++; console.log('  ✗ ' + name); } };

const devSrc = readFileSync(new URL('../src/js/device.js', import.meta.url), 'utf8');
const tplSrc = readFileSync(new URL('../src/template.html', import.meta.url), 'utf8');

// ---- 抽取真实实现（crc32 → buildDocxBlob，exportDocx 含 DOM 不入沙箱）----
const S = devSrc.indexOf('function crc32(bytes)');
const E = devSrc.indexOf('function exportDocx');
if (S < 0 || E < 0 || E <= S) { console.error('抽取失败：device.js 里找不到 crc32→buildDocxBlob 段'); process.exit(2); }
const seg = devSrc.slice(S, E);

// 独立 CRC32 实现（与被测代码分开写，专抓表驱动实现的转写错误）
const CRC_T = (() => { const t = new Int32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); t[n] = c; } return t; })();
const crc32b = (b) => { let c = -1; for (let i = 0; i < b.length; i++) c = (c >>> 8) ^ CRC_T[(c ^ b[i]) & 0xFF]; return (c ^ -1) >>> 0; };

const SAMPLE = [
  '== 屏幕适配诊断 ==',
  '系统版本: iOS 17.5.1 Safari 17',
  '特殊字符 <tag> & "quote"',
  '',
  '中文数值对齐: envTop=0 varTop=49 diff=0 scale=1',
  '<未转义尖括号>',
].join('\n');

const sb = { TextEncoder, Blob, Date, Uint8Array, DataView, Int32Array, String, Math, SAMPLE };
vm.createContext(sb);
vm.runInContext(seg, sb);

const blob = vm.runInContext('buildDocxBlob(SAMPLE)', sb);
ok(blob && blob.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'A0 Blob MIME=标准 docx 类型');
const buf = Buffer.from(await vm.runInContext('buildDocxBlob(SAMPLE).arrayBuffer()', sb));
ok(buf.length > 200, 'A1 生成非空字节流（' + buf.length + 'B）');

// ---- ZIP 结构逐字段解析 ----
const u16 = (o) => buf.readUInt16LE(o);
const u32 = (o) => buf.readUInt32LE(o);
ok(u32(buf.length - 22) === 0x06054b50, 'A2 EOCD 签名在文件尾（ZIP 完整收尾）');
const nEnt = u16(buf.length - 22 + 10);
const cdSize = u32(buf.length - 22 + 12), cdOff = u32(buf.length - 22 + 16);
ok(nEnt === 3, 'A3 EOCD 条目数=3（[Content_Types].xml/_rels/.rels/word/document.xml 三件套）');
ok(cdOff + cdSize === buf.length - 22, 'A4 中央目录紧贴 EOCD（offset/size 自洽）');

const NAMES = ['[Content_Types].xml', '_rels/.rels', 'word/document.xml'];
const entries = [];
let cdWalkOk = true, off = cdOff;
for (let i = 0; i < nEnt; i++) {
  if (u32(off) !== 0x02014b50) { cdWalkOk = false; break; }
  const name = buf.slice(off + 46, off + 46 + u16(off + 28)).toString('utf8');
  entries.push({ name, method: u16(off + 10), crc: u32(off + 16), size: u32(off + 24), lho: u32(off + 42) });
  off += 46 + u16(off + 28) + u16(off + 30) + u16(off + 32);
}
ok(cdWalkOk && entries.map(e => e.name).join('|') === NAMES.join('|'), 'B1 中央目录三件套名称与顺序正确');
ok(entries.every(e => e.method === 0), 'B2 全部 STORED 不压缩（零依赖手写口径，解压器兼容面最大）');
ok(entries.every(e => e.crc && e.size > 0 && e.crc < 0xFFFFFFFF), 'B3 各条目 CRC/尺寸字段已填（非占位）');

let localOk = true, crcOk = true; const dataOf = {};
for (const e of entries) {
  if (u32(e.lho) !== 0x04034b50) { localOk = false; continue; }
  const dstart = e.lho + 30 + u16(e.lho + 26) + u16(e.lho + 28);
  const data = buf.slice(dstart, dstart + e.size);
  dataOf[e.name] = data;
  if (crc32b(data) !== e.crc) crcOk = false;
}
ok(localOk, 'C1 中央目录 offset → 本地文件头链路正确');
ok(crcOk, 'C2 各条目 CRC32 独立重算全对（内容未损坏）');

// ---- document.xml 内容 ----
const docXml = dataOf['word/document.xml'] ? dataOf['word/document.xml'].toString('utf8') : '';
ok(docXml.startsWith('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'), 'D1 document.xml UTF-8 声明在首');
ok(docXml.includes('<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'), 'D2 WordprocessingML 命名空间（Word/WPS 识别为 Word 文档）');
ok((docXml.match(/<w:p>/g) || []).length === SAMPLE.split('\n').length, 'D3 一行一段落（含空行成段=' + SAMPLE.split('\n').length + '段）');
ok(docXml.includes('&lt;tag&gt; &amp; ') && docXml.includes('&lt;未转义尖括号&gt;'), 'D4 XML 特殊字符（& < >）已转义');
ok(docXml.includes('中文数值对齐: envTop=0 varTop=49 diff=0 scale=1'), 'D5 中文+数值正文 UTF-8 原样保留');
ok(docXml.includes('w:eastAsia="Microsoft YaHei"') && docXml.includes('w:ascii="Consolas"') && docXml.includes('xml:space="preserve"'), 'D6 等宽+雅黑字体与空格保留（报告对齐可读）');
ok(docXml.includes('<w:sectPr>') && docXml.includes('w:pgSz'), 'D7 页面设置段收尾（无 sectPr 部分 Word 版本打不开）');
ok(dataOf['[Content_Types].xml'] && dataOf['[Content_Types].xml'].toString('utf8').includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml'), 'D8 [Content_Types] 登记 document 主部件');
ok(dataOf['_rels/.rels'] && dataOf['_rels/.rels'].toString('utf8').includes('Target="word/document.xml"'), 'D9 .rels 指向 document.xml');

// ---- 接线静态断言 ----
ok((devSrc.match(/label: '导出docx'/g) || []).length === 2, 'E1 两处诊断弹窗都配「导出docx」按钮（信息诊断+屏幕适配诊断）');
ok((devSrc.match(/exportDocx\(/g) || []).length === 3, 'E2 exportDocx=2 处调用+1 处定义');
ok(!/exportTxt/.test(devSrc), 'E3 旧 exportTxt 已清干净（不留死代码/旧锚）');
ok(tplSrc.includes('id="modal-export" hidden>导出docx<'), 'E4 弹窗导出按钮默认文案=导出docx');
ok(devSrc.includes("exportDocx(c ? c.text() : r.text, 'mochi-screen-diag-')"), 'E5 屏幕诊断导出用独立文件名前缀');

console.log(fail ? 'verify-docx-export：' + fail + ' 断言失败' : 'verify-docx-export：' + pass + '/' + (pass + fail) + ' 全过');
process.exit(fail ? 1 : 0);
