import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ShieldCheck,
  Search,
  FileText,
  PieChart,
  ArrowRight,
  Activity,
  Bot,
  BrainCircuit,
  Globe2,
  TrendingUp
} from 'lucide-react';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Instrument+Sans:wght@400;500;600;700&display=swap');

  .hm-root {
    --blue:        #3b9eff;
    --blue-glow:   rgba(59,158,255,.14);
    --blue-border: rgba(59,158,255,.22);
    --obsidian:    #080b0f;
    --surface:     #0e1318;
    --surface2:    #141b22;
    --surface3:    #1c2630;
    --border:      rgba(255,255,255,.06);
    --text:        #e8edf2;
    --muted:       #5a6878;
    --muted2:      #8a9ab0;
    font-family: 'Instrument Sans', sans-serif;
    background: var(--obsidian);
    color: var(--text);
    min-height: 100vh;
    overflow-x: hidden;
  }

  /* Hero */
  .hm-hero { position: relative; padding: 8rem 1.25rem 6rem; text-align: center; overflow: hidden; display: flex; flex-direction: column; align-items: center; }
  .hm-hero::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse 60% 80% at 50% 10%, rgba(59,158,255,.12) 0%, transparent 70%); pointer-events: none; }
  .hm-hero-grid { position: absolute; inset: 0; background-image: linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px); background-size: 60px 60px; mask-image: radial-gradient(ellipse 80% 100% at 50% 0%, black 20%, transparent 80%); opacity: .4; }
  
  .hm-eyebrow { font-family: 'DM Mono', monospace; font-size: .65rem; letter-spacing: .2em; text-transform: uppercase; color: var(--blue); margin-bottom: 2rem; display: inline-flex; align-items: center; gap: .5rem; background: var(--blue-glow); padding: .4rem 1.25rem; border-radius: 99px; border: 1px solid var(--blue-border); position: relative; z-index: 1;}
  .hm-title { font-family: 'DM Serif Display', serif; font-size: clamp(3rem, 8vw, 5.5rem); line-height: 1.05; letter-spacing: -.03em; margin: 0 0 1.5rem; position: relative; z-index: 1;}
  .hm-title em { font-style: italic; color: var(--blue); }
  .hm-subtitle { color: var(--muted2); font-size: 1.15rem; max-width: 650px; margin: 0 auto 3rem; line-height: 1.6; position: relative; z-index: 1; }

  .hm-btn { display: inline-flex; align-items: center; justify-content: center; gap: .5rem; padding: 1.1rem 2.25rem; background: var(--blue); color: #fff; border: none; border-radius: 99px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all .2s; font-family: 'Instrument Sans', sans-serif; box-shadow: 0 8px 32px rgba(59,158,255,.3); position: relative; z-index: 1;}
  .hm-btn:hover { background: #1a7ee0; transform: translateY(-2px); box-shadow: 0 12px 40px rgba(59,158,255,.4); }

  /* Bento Grid */
  .hm-bento { max-width: 1200px; margin: 0 auto; padding: 5rem 1.25rem; }
  .hm-section-title { text-align: center; margin-bottom: 4rem; }
  .hm-section-title h2 { font-family: 'DM Serif Display', serif; font-size: 2.5rem; margin: 0; }
  .hm-section-title p { font-family: 'DM Mono', monospace; color: var(--blue); font-size: .8rem; letter-spacing: .15em; text-transform: uppercase; margin-bottom: .5rem; }
  
  .hm-grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 1.5rem; }
  .hm-card { background: var(--surface); border: 1px solid var(--border); border-radius: 1.5rem; padding: 2.25rem; position: relative; overflow: hidden; transition: all .3s; display: flex; flex-direction: column; justify-content: space-between; }
  .hm-card:hover { border-color: var(--blue-border); transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,.4); }
  .hm-card::before { content: ''; position: absolute; inset: 0; background: radial-gradient(circle at top right, var(--blue-glow), transparent 60%); opacity: 0; transition: opacity .3s; }
  .hm-card:hover::before { opacity: 1; }

  .hm-card-icon { width: 56px; height: 56px; border-radius: 1.125rem; background: var(--surface2); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; color: var(--blue); margin-bottom: 2rem; transition: transform .3s, background .3s; position: relative; z-index: 1;}
  .hm-card:hover .hm-card-icon { background: var(--blue); color: #fff; transform: scale(1.05); }

  .hm-card h3 { font-size: 1.35rem; font-weight: 600; margin: 0 0 .75rem; color: var(--text); position: relative; z-index: 1; }
  .hm-card p { color: var(--muted2); font-size: .95rem; line-height: 1.6; margin: 0; position: relative; z-index: 1; }

  /* Spans */
  .hm-span-8 { grid-column: span 8; }
  .hm-span-4 { grid-column: span 4; }
  .hm-span-6 { grid-column: span 6; }

  @media (max-width: 900px) {
    .hm-span-8, .hm-span-4, .hm-span-6 { grid-column: span 12; }
  }

  /* Footer */
  .hm-footer { text-align: center; padding: 4rem 1.25rem; border-top: 1px solid var(--border); background: var(--surface); }
  .hm-footer-logo { font-family: 'DM Serif Display', serif; font-size: 1.5rem; margin-bottom: .5rem; }
  .hm-footer-text { color: var(--muted); font-size: .85rem; }

  @keyframes hmFadeUp { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
  .hm-fade { animation: hmFadeUp .6s ease both; }
`;

function injectStyles() {
  if (document.getElementById('hm-styles')) return;
  const s = document.createElement('style');
  s.id = 'hm-styles';
  s.textContent = CSS;
  document.head.appendChild(s);
}

export default function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    injectStyles();
  }, []);

  return (
    <div className="hm-root">
      
      {/* HERO SECTION */}
      <section className="hm-hero">
        <div className="hm-hero-grid" />
        <div className="hm-eyebrow hm-fade" style={{ animationDelay: '0s' }}>
          <Sparkles size={12} /> Meet StockSense
        </div>
        
        <h1 className="hm-title hm-fade" style={{ animationDelay: '0.1s' }}>
          Smart Finance, <br />
          <em>Stock Mentor</em>
        </h1>
        
        <p className="hm-subtitle hm-fade" style={{ animationDelay: '0.2s' }}>
          The ultimate intelligent platform for modern investors. Stop guessing. Start leveraging real-time Finnhub integrations, NLP document analysis, and algorithmic trust scoring to maximize your portfolio.
        </p>

        <button className="hm-btn hm-fade" style={{ animationDelay: '0.3s' }} onClick={() => navigate('/dashboard')}>
          Launch StockSense <ArrowRight size={18} />
        </button>
      </section>

      {/* BENTO GRID FEATURES */}
      <section className="hm-bento">
        <div className="hm-section-title hm-fade" style={{ animationDelay: '0.4s' }}>
          <p>Complete Capabilities</p>
          <h2>An Intelligence Powerhouse</h2>
        </div>

        <div className="hm-grid">
          
          {/* Tile 1 - Predictor */}
          <div className="hm-card hm-span-8 hm-fade" style={{ animationDelay: '0.1s' }}>
            <div>
              <div className="hm-card-icon"><TrendingUp size={24} /></div>
              <h3>Smart Predictor & Portfolio Builder</h3>
              <p>
                Tell us your investment budget, timeline, and risk tolerance. 
                Our backend engine runs thousands of scenarios across SPDR ETFs and top equities 
                to auto-generate a diversified, optimal portfolio tailored exactly to your criteria in seconds.
              </p>
            </div>
          </div>

          {/* Tile 2 - Veracity Engine */}
          <div className="hm-card hm-span-4 hm-fade" style={{ animationDelay: '0.2s' }}>
            <div>
              <div className="hm-card-icon"><ShieldCheck size={24} /></div>
              <h3>Veracity Engine</h3>
              <p>
                Not all news is true. Our Trust Feed algorithm intercepts live market news and assigns it a 0-100 Trust Score based on source reputation, historic bias, and NLP sentiment filtering. 
              </p>
            </div>
          </div>

          {/* Tile 3 - Doc AI */}
          <div className="hm-card hm-span-4 hm-fade" style={{ animationDelay: '0.3s' }}>
            <div>
              <div className="hm-card-icon"><FileText size={24} /></div>
              <h3>SEC Doc AI Analyzer</h3>
              <p>
                Stop reading 120-page 10-K broker PDFs. Upload regulatory documents to our Research Library, and our Node-NLP processor will instantly extract 5-point strategic summaries.
              </p>
            </div>
          </div>

          {/* Tile 4 - Stock Summary */}
          <div className="hm-card hm-span-4 hm-fade" style={{ animationDelay: '0.4s' }}>
            <div>
              <div className="hm-card-icon"><Activity size={24} /></div>
              <h3>Live Asset Summary</h3>
              <p>
                Get real-time quotes intertwined with AI Ensemble Scores. We analyze momentum metrics and analyst ratings to deliver clear Bullish or Bearish designations.
              </p>
            </div>
          </div>

          {/* Tile 5 - Intelligent Chatbot */}
          <div className="hm-card hm-span-4 hm-fade" style={{ animationDelay: '0.5s' }}>
            <div>
              <div className="hm-card-icon"><Bot size={24} /></div>
              <h3>StockSense AI Chat</h3>
              <p>
                Powered by LLaMA 3.3. Talk natively with the platform. Ask it to fetch the latest news from Finnhub or pull a live quote via backend tool-calling. Never leave the terminal.
              </p>
            </div>
          </div>

          {/* Tile 6 - Sector Screener */}
          <div className="hm-card hm-span-6 hm-fade" style={{ animationDelay: '0.6s' }}>
            <div>
              <div className="hm-card-icon"><Globe2 size={24} /></div>
              <h3>Sector Screener</h3>
              <p>
                Navigate market conditions with macro visualizers. Watch capital rotation across tech, healthcare, and finance sectors to stay ahead of overall market trends. 
              </p>
            </div>
          </div>

          {/* Tile 7 - Regulatory Drops */}
          <div className="hm-card hm-span-6 hm-fade" style={{ animationDelay: '0.7s' }}>
            <div>
              <div className="hm-card-icon"><BrainCircuit size={24} /></div>
              <h3>Unfiltered Regulatory Drops</h3>
              <p>
                Get real-time SEC fillings (Form 4s, 8-Ks). See insider trading and major corporate restructuring the minute it hits the wire, before retail investors realize what happened.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="hm-footer">
        <div className="hm-footer-logo">StockSense</div>
        <div className="hm-footer-text">
          © {new Date().getFullYear()} StockSense Smart Finance Platform. Enterprise AI Integration.
        </div>
      </footer>

    </div>
  );
}