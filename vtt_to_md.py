#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
VTT 字幕文件转换为 Markdown 格式

用法:
    python vtt_to_md.py input.vtt output.md

支持:
    - 解析标准 WebVTT 格式
    - 自动跳过样式块和 cue ID
    - 时间戳简化（去掉毫秒）
    - 生成带会议元数据的 Markdown 文件
"""

import re
import sys
from pathlib import Path


def parse_vtt(vtt_content: str) -> list[dict]:
    """解析 VTT 文件，返回字幕列表"""
    lines = vtt_content.split('\n')
    cues = []
    i = 0
    
    # 跳过 WEBVTT 头部和样式
    while i < len(lines):
        line = lines[i]
        if re.match(r'\d{2}:\d{2}:\d{2}\.\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}\.\d{3}', line):
            break
        i += 1
    
    # 解析所有 cue
    while i < len(lines):
        line = lines[i].strip()
        
        # 跳过空行和 cue ID
        if not line or re.match(r'^\d+$', line):
            i += 1
            continue
        
        # 检查是否是时间戳行
        time_match = re.match(
            r'(\d{2}:\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}\.\d{3})',
            line
        )
        if time_match:
            start_time = time_match.group(1)
            end_time = time_match.group(2)
            i += 1
            
            # 收集字幕内容（可能有多行）
            text_lines = []
            while i < len(lines) and lines[i].strip():
                text_lines.append(lines[i].strip())
                i += 1
            
            text = ' '.join(text_lines)
            if text:
                # 简化时间戳格式（去掉毫秒）
                start_short = start_time[:8]
                cues.append({
                    'start': start_short,
                    'text': text
                })
        else:
            i += 1
    
    return cues


def generate_markdown(cues: list[dict], meeting_info: dict = None) -> str:
    """生成 Markdown 内容"""
    md_content = "# 飞书妙记字幕导出\n\n"
    
    if meeting_info:
        md_content += f"**会议标题：** {meeting_info.get('title', '未知')}\n"
        md_content += f"**会议时间：** {meeting_info.get('time', '未知')}\n"
        md_content += f"**会议时长：** {meeting_info.get('duration', '未知')}\n"
        md_content += f"**发言人：** {meeting_info.get('speakers', '未知')}人\n\n"
    
    md_content += "---\n\n"
    
    for cue in cues:
        md_content += f"### {cue['start']}\n"
        md_content += f"{cue['text']}\n\n"
    
    return md_content


def main():
    if len(sys.argv) < 2:
        print("用法: python vtt_to_md.py <input.vtt> [output.md]")
        print("\n示例:")
        print("  python vtt_to_md.py subtitle.vtt")
        print("  python vtt_to_md.py subtitle.vtt output.md")
        sys.exit(1)
    
    input_path = Path(sys.argv[1])
    
    if not input_path.exists():
        print(f"错误: 文件不存在 - {input_path}")
        sys.exit(1)
    
    # 确定输出路径
    if len(sys.argv) >= 3:
        output_path = Path(sys.argv[2])
    else:
        output_path = input_path.with_suffix('.md')
    
    # 读取 VTT 文件
    with open(input_path, 'r', encoding='utf-8') as f:
        vtt_content = f.read()
    
    # 解析字幕
    cues = parse_vtt(vtt_content)
    
    # 生成 Markdown
    meeting_info = {
        'title': '飞书妙记会议',
        'time': '未知',
        'duration': '未知',
        'speakers': '未知'
    }
    md_content = generate_markdown(cues, meeting_info)
    
    # 写入文件
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(md_content)
    
    print(f"✅ 转换完成！")
    print(f"   输入: {input_path}")
    print(f"   输出: {output_path}")
    print(f"   字幕条数: {len(cues)}")
    print(f"   Markdown 大小: {len(md_content):,} 字节")


if __name__ == '__main__':
    main()
