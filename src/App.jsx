import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [emojis, setEmojis] = useState([]);
  const [groupedEmojis, setGroupedEmojis] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFolder, setSelectedFolder] = useState('根目录');
  const [previewImage, setPreviewImage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // 获取表情包数据
  useEffect(() => {
    const fetchEmojis = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/emojis');
        if (!response.ok) {
          throw new Error('Failed to fetch emojis');
        }
        const data = await response.json();
        setEmojis(data.emojis);
        setGroupedEmojis(data.groupedEmojis);
        setError(null);
      } catch (err) {
        setError('获取表情包失败，请检查服务器是否运行');
        console.error('Error fetching emojis:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEmojis();
  }, []);

  // 过滤当前文件夹的表情包
  const currentEmojis = groupedEmojis[selectedFolder] || [];

  // 搜索过滤
  const filteredEmojis = currentEmojis.filter(emoji => 
    emoji.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 获取所有文件夹名称
  const folders = Object.keys(groupedEmojis);

  // 图片预览
  const handleImageClick = (emoji) => {
    setPreviewImage(emoji);
  };

  // 关闭预览
  const handleClosePreview = () => {
    setPreviewImage(null);
  };

  // 格式化文件大小
  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>表情包显示网站</h1>
        <div className="search-container">
          <input
            type="text"
            placeholder="搜索表情包..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </header>

      <main className="app-main">
        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading">加载中...</div>
        ) : (
          <>
            {/* 文件夹导航 */}
            <nav className="folder-nav">
              <h2>表情包分类</h2>
              <ul className="folder-list">
                {folders.map((folder) => (
                  <li key={folder}>
                    <button
                      className={`folder-item ${selectedFolder === folder ? 'active' : ''}`}
                      onClick={() => setSelectedFolder(folder)}
                    >
                      {folder}
                      <span className="emoji-count">({groupedEmojis[folder].length})</span>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>

            {/* 表情包网格 */}
            <section className="emoji-grid">
              <div className="grid-header">
                <h2>{selectedFolder} ({filteredEmojis.length} 个表情包)</h2>
              </div>
              
              {filteredEmojis.length === 0 ? (
                <div className="empty-state">
                  <p>没有找到匹配的表情包</p>
                </div>
              ) : (
                <div className="grid-container">
                  {filteredEmojis.map((emoji) => (
                    <div key={emoji.path} className="emoji-item">
                      <img
                        src={`/api/image?path=${encodeURIComponent(emoji.path)}`}
                        alt={emoji.name}
                        className="emoji-image"
                        onClick={() => handleImageClick(emoji)}
                        loading="lazy"
                      />
                      <div className="emoji-info">
                        <span className="emoji-name">{emoji.name}</span>
                        <span className="emoji-size">{formatSize(emoji.size)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {/* 图片预览 */}
      {previewImage && (
        <div className="preview-overlay" onClick={handleClosePreview}>
          <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
            <button className="preview-close" onClick={handleClosePreview}>
              ×
            </button>
            <div className="preview-content">
              <img
                src={`/api/image?path=${encodeURIComponent(previewImage.path)}`}
                alt={previewImage.name}
                className="preview-image"
              />
              <div className="preview-info">
                <h3>{previewImage.name}</h3>
                <p>{formatSize(previewImage.size)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
