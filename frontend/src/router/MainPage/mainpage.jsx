import { ArrowRight, Bookmark, Heart, MessageCircle, Search, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './mainpage.css';

const posts = [
  ['DESIGN SYSTEM', '构建属于你的数字花园：从灵感到落地', '灵感不是凭空出现的。记录、连接与持续迭代，才能让想法真正拥有生命力。', '林墨'],
  ['TECHNOLOGY', 'AI 时代的个人工作流实验', '我尝试把 AI 融入日常创作的每个环节，这是一些真实的记录与思考。', 'Alex'],
  ['LIFE NOTES', '在城市边缘，寻找慢下来的勇气', '有时候，向内探索比向远方出发更需要勇气。', '苏晚'],
];

export default function MainPage() {
  const navigate = useNavigate();
  const currentUser = JSON.parse(window.localStorage.getItem('nebulaUser') || '{}');
  const openSettings = () => currentUser.uuid && navigate(`/User/${currentUser.uuid}`);

  return (
    <div className="blog">
      <header>
        <div className="brand"><b>N<span>•</span></b> NEBULA BLOG</div>
        <nav>首页　探索　关于我</nav>
        <div className="user">
          <Search />
          <button onClick={openSettings}>
            <User /> {currentUser.nickname || '林墨'}
          </button>
        </div>
      </header>
      <main>
        <section className="hero">
          <small>THE DIGITAL GARDEN</small>
          <h1>记录思考，<em>保持生长。</em></h1>
          <p>一个关于设计、技术与生活的个人博客。<br />在这里，分享有趣的想法与真实的实践。</p>
          <button>开始探索 <ArrowRight /></button>
          <div className="metrics">128 篇文章　　24.8K 次阅读　　∞ 个灵感</div>
        </section>
        <section className="content">
          <small>LATEST STORIES</small>
          <h2>最新文章</h2>
          <div className="posts">
            {posts.map((post, index) => (
              <article className={`post c${index}`} key={post[1]}>
                <div className="cover"><span>{post[0]}</span></div>
                <div className="body">
                  <small>{post[3]}　·　2024.08.{12 - index * 4}</small>
                  <h3>{post[1]}</h3>
                  <p>{post[2]}</p>
                  <div className="foot"><span><Heart /> {86 - index * 20}</span><span><MessageCircle /> {14 - index * 3}</span><Bookmark /></div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
      <footer>© 2026 NEBULA BLOG <span>Crafted with curiosity</span></footer>
    </div>
  );
}

