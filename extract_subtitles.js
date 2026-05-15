/**
 * 飞书妙记字幕导出脚本（无导出权限版）
 * 
 * 📖 使用方法:
 * 1. 打开飞书妙记页面 (https://xxx.feishu.cn/minutes/...)
 * 2. 按 F12 打开开发者工具
 * 3. 切换到 Console 标签
 * 4. 粘贴以下代码并回车
 * 
 * ⚠️ 注意: 此脚本必须在已登录飞书的浏览器会话中运行
 * 
 * @author 探索者
 * @version 1.0.0
 */

(async function exportFeishuSubtitles() {
  try {
    // ========== 步骤 1: 获取 object_token ==========
    const pathParts = window.location.pathname.split('/');
    const objectToken = pathParts[pathParts.length - 1];
    
    if (!objectToken || objectToken.length < 10) {
      console.error('❌ 无法从 URL 中提取 object_token');
      console.log('请确认当前 URL 格式正确，例如:');
      console.log('  https://xxx.feishu.cn/minutes/obcn21c64u1ulu757d2z2u74');
      return;
    }
    
    console.log('════════════════════════════════════════');
    console.log('📋 object_token:', objectToken);
    
    // ========== 步骤 2: 构建 VTT API URL ==========
    const vttUrl = `https://${window.location.hostname}/minutes/api/subtitles/webvtt?object_token=${objectToken}`;
    console.log('🔗 API URL:', vttUrl);
    
    // ========== 步骤 3: 调用 API ==========
    console.log('⏳ 正在下载字幕...');
    
    const response = await fetch(vttUrl, {
      credentials: 'same-origin',  // 关键：自动携带浏览器 cookie
      headers: {
        'Accept': 'text/vtt',
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const vttContent = await response.text();
    console.log(`✅ 字幕下载成功！`);
    console.log(`   文件大小: ${vttContent.length.toLocaleString()} 字节`);
    
    // ========== 步骤 4: 创建并触发下载 ==========
    const blob = new Blob([vttContent], { type: 'text/vtt' });
    const downloadUrl = URL.createObjectURL(blob);
    
    // 生成文件名（包含时间戳）
    const now = new Date();
    const timestamp = now.toISOString()
      .replace(/T/, '_')
      .replace(/[:.]/g, '-')
      .slice(0, 19);
    const filename = `飞书会议字幕_${timestamp}.vtt`;
    
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);
    
    console.log(`📥 文件已下载: ${filename}`);
    console.log('🎉 完成！');
    
    // ========== 步骤 5: 显示字幕统计 ==========
    const cueCount = (vttContent.match(/^\d{2}:\d{2}:\d{2}/gm) || []).length;
    const durationMatch = vttContent.match(/\d{2}:\d{2}:\d{2}\.\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}\.\d{3}/g);
    const lastCue = durationMatch ? durationMatch[durationMatch.length - 1] : null;
    
    console.log('════════════════════════════════════════');
    console.log('📊 字幕统计:');
    console.log(`   字幕条数: 约 ${cueCount} 条`);
    if (lastCue) {
      console.log(`   最后时间戳: ${lastCue.split(' --> ')[1]}`);
    }
    console.log('════════════════════════════════════════');
    
    // ========== 步骤 6: 检查发言人识别状态 ==========
    // 尝试从页面脚本数据中读取 speaker_ai_status
    const scripts = document.querySelectorAll('script');
    let speakerStatus = '未知';
    
    for (const script of scripts) {
      const text = script.innerText;
      const match = text.match(/"speaker_ai_status"\s*:\s*(\d+)/);
      if (match) {
        speakerStatus = match[1];
        break;
      }
    }
    
    if (speakerStatus === '0') {
      console.log('⚠️  注意: 声纹识别未开启 (speaker_ai_status: 0)');
      console.log('   VTT 文件中不包含发言人标识');
      console.log('   如需发言人信息，请联系会议主持人开启');
    } else if (speakerStatus === '1') {
      console.log('✅ 声纹识别已开启 (speaker_ai_status: 1)');
      console.log('   VTT 文件中可能包含 speaker_id');
    }
    
  } catch (error) {
    console.error('════════════════════════════════════════');
    console.error('❌ 导出失败:', error.message);
    console.error('════════════════════════════════════════');
    console.error('可能原因:');
    console.error('  1. 未登录飞书账号');
    console.error('  2. 当前页面不是飞书妙记页面');
    console.error('  3. 会话已过期，请刷新页面后重试');
    console.error('  4. 没有访问该妙记的权限');
  }
})();
