import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import './login.css';

export default function Login() {
  const navigate = useNavigate();
  const [register, setRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [msg, setMsg] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(`http://localhost:8080/api/${register ? 'register' : 'login'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.get('email'), password: form.get('password') }),
      });
      const data = await response.json();
      if (!response.ok) throw Error(data.error);
      window.localStorage.setItem('nebulaLoggedIn', 'true');
      window.localStorage.setItem('nebulaUser', JSON.stringify({
        uuid: data.uuid ?? data.id,
        email: data.email ?? form.get('email'),
        nickname: data.nickname ?? '林墨',
        img: data.img || '',
      }));
      navigate('/MainPage', { replace: true });
    } catch (error) {
      setMsg(error.message);
    }
  };

  return (
    <div className="login">
      <div className="panel">
        <div className="logo">N<span>•</span></div>
        <h1>{register ? '创建账号' : '欢迎回来'}</h1>
        <p>{register ? '加入你的灵感宇宙' : '进入你的灵感宇宙'}</p>
        <form onSubmit={submit}>
          <label>邮箱<div><Mail /><input name="email" defaultValue={register ? '' : 'hello@nebula.blog'} type="email" required /></div></label>
          <label>密码<div><Lock /><input name="password" defaultValue={register ? '' : '123456'} type={showPassword ? 'text' : 'password'} minLength="6" required /><button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff /> : <Eye />}</button></div></label>
          <button type="submit">{register ? '注册' : '登录'} <ArrowRight /></button>
        </form>
        {msg && <div className="error">{msg}</div>}
        <small><a onClick={() => { setRegister(!register); setMsg(''); }}>{register ? '已有账号？去登录' : '没有账号？立即注册'}</a></small>
      </div>
    </div>
  );
}
