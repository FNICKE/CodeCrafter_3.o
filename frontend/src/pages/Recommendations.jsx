import { useState } from "react";
import { getRecommendations } from "../api";
import { TrendingUp, TrendingDown, ExternalLink, Lightbulb } from "lucide-react";

const Recommendations = () => {
    const [budget, setBudget] = useState(50000);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const generate = async () => {
        if (budget < 1000) {
            setErrorMsg("Please enter at least ₹1,000");
            return;
        }

        setLoading(true);
        setErrorMsg("");
        setResult(null);

        try {
            const res = await getRecommendations({ budget });
            setResult(res.data);
        } catch (err) {
            console.error(err);
            setErrorMsg(err.response?.data?.error || "Failed to generate recommendations. Please try again.");
        }
        setLoading(false);
    };

    return (
        <div className="animate-in">
            <div className="page-header">
                <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Lightbulb size={24} style={{ color: 'var(--accent-amber)' }} /> Smart Stock Predictor
                </h1>
                <p className="page-subtitle">Best stocks for your budget based on AI-driven momentum & news</p>
            </div>

            <div className="card" style={{ marginBottom: 32, maxWidth: 600 }}>
                <label className="label">Your Budget (₹)</label>
                <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                    <input
                        type="number"
                        className="input"
                        value={budget}
                        onChange={(e) => setBudget(Number(e.target.value))}
                        style={{ fontSize: 18, fontWeight: 600, padding: '14px 16px' }}
                        placeholder="50000"
                    />
                    <button
                        onClick={generate}
                        disabled={loading}
                        className="btn btn-primary"
                        style={{ whiteSpace: 'nowrap', padding: '0 24px', fontSize: 15 }}
                    >
                        {loading ? "Analyzing..." : "Get Best Stocks"}
                    </button>
                </div>
            </div>

            {errorMsg && (
                <div className="card" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)', color: 'var(--accent-red)', marginBottom: 24, padding: "16px 20px" }}>
                    {errorMsg}
                </div>
            )}

            {result && (
                <div className="animate-in">
                    <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: 'var(--text-primary)' }}>
                        Top Recommended (₹{budget.toLocaleString()}) — {result.recommendations?.length || 0} stocks found
                    </h2>

                    <div className="grid-3">
                        {result.recommendations?.map((stock, i) => (
                            <div key={i} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>{stock.name}</h3>
                                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{stock.symbol}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>
                                            {stock.currency === "INR" ? "₹" : "$"}{(Number(stock.price)).toFixed(2)}
                                        </div>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: parseFloat(stock.changePercent) > 0 ? 'var(--accent-green)' : 'var(--accent-red)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 4 }}>
                                            {parseFloat(stock.changePercent) > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                            {parseFloat(stock.changePercent) > 0 ? "+" : ""}{stock.changePercent}%
                                        </div>
                                        {stock.currency === "USD" && (
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, opacity: 0.8 }}>
                                                ≈ ₹{(parseFloat(stock.price) * 83).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div style={{ marginTop: 24, padding: 16, background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border)' }}>
                                    <p className="label" style={{ marginBottom: 6 }}>You can buy</p>
                                    <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-green)' }}>{stock.maxShares} <span style={{ fontSize: 14 }}>shares</span></p>
                                    {stock.currency === "USD" && (
                                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                                            Budget ≈ ${(budget / 83).toLocaleString(undefined, { maximumFractionDigits: 0 })} USD
                                        </p>
                                    )}
                                </div>

                                <div style={{ marginTop: 20 }}>
                                    <p className="label" style={{ color: 'var(--accent-blue)', marginBottom: 8 }}>Why Best?</p>
                                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{stock.whyBest}</p>
                                </div>

                                {stock.news && stock.news.length > 0 && (
                                    <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                                        <p className="label">Latest News Proof</p>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
                                            {stock.news.map((n, idx) => (
                                                <a
                                                    key={idx}
                                                    href={n.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="card"
                                                    style={{ textDecoration: 'none', display: 'flex', gap: 10, padding: 12, borderRadius: 8, background: 'var(--bg-secondary)' }}
                                                >
                                                    <span style={{
                                                        width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 5,
                                                        background: n.sentiment === "Positive" ? 'var(--accent-green)' : n.sentiment === "Negative" ? 'var(--accent-red)' : 'var(--text-muted)'
                                                    }} />
                                                    <div>
                                                        <p style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500, lineHeight: 1.4, margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                                            {n.headline} <ExternalLink size={10} style={{ color: 'var(--text-muted)', display: 'inline', marginLeft: 4 }} />
                                                        </p>
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Recommendations;
