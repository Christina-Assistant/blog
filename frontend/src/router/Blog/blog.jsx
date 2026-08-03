import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Heart, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import './blog.css';

const empty = {
  title: '',
  content: '',
  author: '林墨',
  likes: 0,
  favorites: 0,
};

export default function Blog() {
  const [items, setItems] = useState([]);
  const [sort, setSort] = useState('time');
  const [form, setForm] = useState(null);

  const load = () => fetch(`/api/blog?sort=${sort}`)
    .then((response) => response.json())
    .then((data) => setItems(data.items || []));

  useEffect(() => {
    load();
  }, [sort]);

  const save = async (event) => {
    event.preventDefault();
    await fetch(`/api/blog${form.id ? `/${form.id}` : ''}`, {
      method: form.id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setForm(null);
    load();
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
      <header>
        <Link to="/MainPage" className="back"><ArrowLeft /> 返回首页</Link>
        <h1>博客文章</h1>
        <button className="primary" onClick={create}><Plus /> 编写文章</button>
      </header>
      <div className="toolbar">
        <span>共 {items.length} 篇文章</span>
        <div>
          {[
            ['time', '最新'],
            ['likes', '点赞最多'],
            ['favorites', '喜爱最多'],
          ].map(([value, text]) => (
            <button key={value} className={sort === value ? 'active' : ''} onClick={() => setSort(value)}>
              {text}
            </button>
          ))}
        </div>
      </div>
      <main className="blog-list">
        {items.map((item) => (
          <article key={item.id}>
            <div className="meta">{item.author} · {new Date(item.createdAt).toLocaleString()}</div>
            <h2>{item.title}</h2>
            <p>{item.content}</p>
            <div className="stats">
              <span><Heart /> {item.likes}</span>
              <span><Star /> {item.favorites}</span>
              <button onClick={() => setForm(item)}><Pencil /> 修改</button>
              <button onClick={() => remove(item.id)}><Trash2 /> 删除</button>
            </div>
          </article>
        ))}
        {!items.length && <p className="empty">还没有文章，开始写下第一篇吧。</p>}
      </main>
      {form && (
        <div className="modal">
          <form onSubmit={save}>
            <h2>{form.id ? '修改文章' : '编写文章'}</h2>
            <input placeholder="文章标题" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
            <input placeholder="作者" value={form.author} disabled />
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = () => setForm({ ...form, imageUrl: reader.result });
                  reader.readAsDataURL(file);
                }
              }}
            />
            <textarea placeholder="文章内容" rows="9" value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} required />
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
