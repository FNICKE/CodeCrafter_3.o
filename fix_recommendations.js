const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'frontend/src/pages/Recommendations.jsx');
let content = fs.readFileSync(file, 'utf8');

const anchor1 = `{/* Expanded content */}`;
const anchor2 = `function injectStyles(id, css) {`;

const insertCode = `      {/* Expanded content */}
      {expanded && (
        <>
          <div className="sp-why">
            <div className="sp-section-lbl">AI Analysis</div>
            <div className="sp-why-text">{stock.whyBest}</div>
          </div>
          {stock.news?.length > 0 && (
            <div className="sp-news">
              <div className="sp-section-lbl" style={{ display: 'flex', alignItems: 'center', gap: '.35rem', color: 'var(--muted)' }}>
                <Newspaper size={10} /> Latest News
              </div>
              {stock.news.map((n, i) => (
                <a key={i} href={n.url} target="_blank" rel="noopener noreferrer" className="sp-news-item">
                  <div className="sp-news-dot" style={{ background: sentimentColor(n.sentiment) }} />
                  <div>
                    <div className="sp-news-headline">
                      {n.headline}
                      <ExternalLink size={9} style={{ display: 'inline', color: 'var(--muted)', marginLeft: 3 }} />
                    </div>
                    <div className="sp-news-meta">{n.sentiment} · {n.source}</div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </>
      )}

      <button className="sp-expand-btn" onClick={() => setExpanded(e => !e)}>
        {expanded ? <><ChevronUp size={13} /> Hide Analysis</> : <><ChevronDown size={13} /> Analysis &amp; News</>}
      </button>
    </div>
  );
}

const TICKER_ITEMS = [
  'AAPL +1.2%','MSFT +0.8%','NVDA +3.4%','GOOGL -0.3%',
  'AMZN +1.7%','META +2.1%','TSLA -1.4%','JPM +0.5%','V +0.9%','UNH -0.6%',
];

`;

const startIdx = content.indexOf(anchor1);
const endIdx = content.indexOf(anchor2);

if (startIdx !== -1 && endIdx !== -1) {
    const newContent = content.substring(0, startIdx) + insertCode + content.substring(endIdx);
    fs.writeFileSync(file, newContent, 'utf8');
    console.log("Successfully fixed Recommendations.jsx");
} else {
    console.log("Could not find anchors", startIdx, endIdx);
}
