import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, Flame, Heart, Pencil, Plus, Star, Trash2, X } from 'lucide-react';
import './blog.css';

const empty = {
  title: '',
  content: '',
  author: '林墨',
};

const pageSize = 6;

export default function Blog() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async (targetPage = page) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/blog?page=${targetPage}&pageSize=${pageSize}`);
      const data = await response.json();
      if (!response.ok) throw Error(data.error || '读取文章失败');
      setItems(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 0);
      if (data.totalPages > 0 && targetPage > data.totalPages) {
        setPage(data.totalPages);
      }
    } catch (loadError) {
      setError(loadError.message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page]);

  const save = async (event) => {
    event.preventDefault();
    const editing = Boolean(form.id);
    const response = await fetch(`/api/blog${editing ? `/${form.id}` : ''}`, {
      method: form.id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || '保存文章失败');
      return;
    }
    setForm(null);
    if (editing || page === 1) load();
    else setPage(1);
  };

  const remove = async (id) => {
    if (window.confirm('确定删除这篇文章吗？')) {
      await fetch(`/api/blog/${id}`, { method: 'DELETE' });
      load();
    }
  };

  const create = () => {
    const currentUser = JSON.parse(localStorage.getItem('nebulaUser') || '{}');
    setForm({ ...empty, author: currentUser.nickname || '林墨' });
  };

  return (
    <div className="blog-page">
      <section className="blog-window" aria-label="博客文章管理">
        <header className="blog-titlebar">
          <Link to="/MainPage" className="back" aria-label="返回首页"><ArrowLeft /></Link>
          <span className="app-icon" aria-hidden="true"><FileText /></span>
          <div className="title-copy">
            <h1>博客文章</h1>
            <span>内容管理</span>
          </div>
          <button className="primary" onClick={create}><Plus /> 编写文章</button>
        </header>
        <div className="toolbar">
          <div className="article-count"><strong>{total}</strong><span>篇文章</span></div>
          <span className="sort-note"><Flame /> 按点赞与喜爱总数排序</span>
        </div>
        <main className="blog-list">
          {error && <p className="list-error">{error}</p>}
          {loading && <p className="empty">正在读取文章…</p>}
          {!loading && items.map((item, index) => (
            <article key={item.id}>
              <span className="rank" aria-label={`热度排名第 ${((page - 1) * pageSize) + index + 1} 名`}>
                {String(((page - 1) * pageSize) + index + 1).padStart(2, '0')}
              </span>
              <div className="article-main">
                <div className="meta">{item.author}<span />{new Date(item.createdAt).toLocaleString()}</div>
                <h2>{item.title}</h2>
                <p>{item.content}</p>
                <div className="stats">
                  <span><Heart /> {item.likes}</span>
                  <span><Star /> {item.favorites}</span>
                  <span className="score"><Flame /> {item.score ?? item.likes + item.favorites}</span>
                  <button aria-label={`修改 ${item.title}`} onClick={() => setForm(item)}><Pencil /> 修改</button>
                  <button className="delete-button" aria-label={`删除 ${item.title}`} onClick={() => remove(item.id)}><Trash2 /> 删除</button>
                </div>
              </div>
            </article>
          ))}
          {!loading && !error && !items.length && <p className="empty">还没有文章，开始写下第一篇吧。</p>}
          {!loading && totalPages > 1 && (
            <nav className="pagination" aria-label="文章分页">
              <button disabled={page === 1} onClick={() => setPage((current) => current - 1)}>上一页</button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                <button
                  key={pageNumber}
                  className={page === pageNumber ? 'active' : ''}
                  aria-current={page === pageNumber ? 'page' : undefined}
                  onClick={() => setPage(pageNumber)}
                >
                  {pageNumber}
                </button>
              ))}
              <button disabled={page === totalPages} onClick={() => setPage((current) => current + 1)}>下一页</button>
            </nav>
          )}
        </main>
      </section>
      {form && (
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="article-dialog-title">
          <form onSubmit={save}>
            <div className="dialog-titlebar">
              <span className="app-icon" aria-hidden="true"><FileText /></span>
              <h2 id="article-dialog-title">{form.id ? '修改文章' : '编写文章'}</h2>
              <button type="button" className="dialog-close" aria-label="关闭" onClick={() => setForm(null)}><X /></button>
            </div>
            <div className="dialog-content">
              <label>文章标题<input placeholder="输入文章标题" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required autoFocus /></label>
              <label>作者<input value={form.author} disabled /></label>
              <label>封面图片<input type="file" accept="image/*" onChange={(event) => {
                const file = event.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = () => setForm({ ...form, imageUrl: reader.result });
                  reader.readAsDataURL(file);
                }
              }} /></label>
              <label>文章内容<textarea placeholder="写下你的内容" rows="9" value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} required /></label>
            </div>
            <div className="form-actions">
              <button type="button" onClick={() => setForm(null)}>取消</button>
              <button className="primary">保存文章</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
