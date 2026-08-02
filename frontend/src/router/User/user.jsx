import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './user.css';

export default function UserSettings() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const saved = JSON.parse(localStorage.getItem('nebulaUser') || '{}');
  const [user, setUser] = useState({ nickname: saved.nickname || '林墨', email: saved.email || '' });
  const [message, setMessage] = useState('');

  const update = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      nickname: form.get('nickname'),
      email: form.get('email'),
      password: form.get('password') || undefined,
    };
    try {
      const response = await fetch(`http://localhost:8080/api/users/${uuid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw Error('保存失败');
      localStorage.setItem('nebulaUser', JSON.stringify({ ...saved, ...payload, uuid }));
      setMessage('资料已更新');
    } catch (error) {
      setMessage(error.message);
    }
  };

  const remove = () => {
    if (window.confirm('确定要注销账号吗？')) {
      localStorage.clear();
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="user-page">
      <form className="user-card" onSubmit={update}>
        <button type="button" className="back" onClick={() => navigate('/MainPage')}>← 返回首页</button>
        <h1>账号设置</h1>
        <p className="muted">管理你的 NEBULA 账户信息</p>
        <label>昵称<input name="nickname" value={user.nickname} onChange={(event) => setUser({ ...user, nickname: event.target.value })} required /></label>
        <label>邮箱<input name="email" type="email" value={user.email} onChange={(event) => setUser({ ...user, email: event.target.value })} required /></label>
        <label>新密码<input name="password" type="password" minLength="6" placeholder="留空则不修改" /></label>
        {message && <div className="message">{message}</div>}
        <button className="save">保存修改</button>
        <button type="button" className="danger" onClick={remove}>注销账号</button>
      </form>
    </div>
  );
}
