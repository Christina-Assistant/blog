import { useRef, useState } from 'react';
import { CircleUserRound } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import './user.css';

export default function UserSettings() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const saved = JSON.parse(localStorage.getItem('nebulaUser') || '{}');
  const [user, setUser] = useState({ nickname: saved.nickname || '林墨', email: saved.email || '' });
  const [avatar, setAvatar] = useState(saved.img || '');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const fileInput = useRef(null);

  const uploadAvatar = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setMessage('请选择图片文件');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage('头像不能超过 5MB');
      return;
    }

    const body = new FormData();
    body.append('image', file);
    setUploading(true);
    setMessage('');
    try {
      const response = await fetch(`http://localhost:8080/api/users/${uuid}/avatar`, {
        method: 'POST',
        body,
      });
      const data = await response.json();
      if (!response.ok) throw Error(data.error || '头像上传失败');
      const nextUser = { ...saved, ...user, uuid, img: data.img };
      localStorage.setItem('nebulaUser', JSON.stringify(nextUser));
      setAvatar(data.img);
      setMessage('头像已更新');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setUploading(false);
    }
  };

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
      localStorage.setItem('nebulaUser', JSON.stringify({ ...saved, ...payload, uuid, img: avatar }));
      setMessage('资料已更新');
    } catch (error) {
      setMessage(error.message);
    }
  };

  const logout = () => {
    localStorage.removeItem('nebulaLoggedIn');
    localStorage.removeItem('nebulaUser');
    navigate('/MainPage', { replace: true });
  };

  return (
    <div className="user-page">
      <form className="user-card" onSubmit={update}>
        <button type="button" className="back" onClick={() => navigate('/MainPage')}>← 返回首页</button>
        <h1>账号设置</h1>
        <p className="muted">管理你的 NEBULA 账户信息</p>
        <div className="avatar-editor">
          <div className="avatar-preview">
            {avatar
              ? <img src={avatar} alt="用户头像" />
              : <CircleUserRound className="default-avatar-icon" aria-hidden="true" strokeWidth={1.45} />}
          </div>
          <div>
            <button type="button" className="upload" onClick={() => fileInput.current?.click()} disabled={uploading}>
              {uploading ? '上传中…' : '更换头像'}
            </button>
            <small>支持 JPG、PNG、GIF、WebP，最大 5MB</small>
          </div>
          <input ref={fileInput} className="file-input" type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={uploadAvatar} />
        </div>
        <label>昵称<input name="nickname" value={user.nickname} onChange={(event) => setUser({ ...user, nickname: event.target.value })} required /></label>
        <label>邮箱<input name="email" type="email" value={user.email} onChange={(event) => setUser({ ...user, email: event.target.value })} required /></label>
        <label>新密码<input name="password" type="password" minLength="6" placeholder="留空则不修改" /></label>
        {message && <div className="message">{message}</div>}
        <button className="save">保存修改</button>
        <button type="button" className="danger" onClick={logout}>退出登录</button>
      </form>
    </div>
  );
}
