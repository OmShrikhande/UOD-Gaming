import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Coins, Award, LogIn, Sparkles, ChevronRight, Activity, Calendar } from 'lucide-react';
import axios from 'axios';
import '../styles/Leaderboard.css';
import Foote from './Foote';

const Leaderboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('global'); // 'global' or 'cabinet'
  const [games, setGames] = useState([]);
  const [selectedGameId, setSelectedGameId] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  
  // Leaderboard lists
  const [globalLeaderboard, setGlobalLeaderboard] = useState([]);
  const [gameLeaderboard, setGameLeaderboard] = useState([]);
  
  // Current user stats
  const [userProfile, setUserProfile] = useState(null);
  const [userGlobalPosition, setUserGlobalPosition] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // UX states
  const [loading, setLoading] = useState(true);
  const [cabinetLoading, setCabinetLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = 'cookie-token';
    if (token) {
      setIsLoggedIn(true);
    }
    
    // Fetch games list and global rankings
    const initFetch = async () => {
      setLoading(true);
      setError('');
      try {
        // 1. Fetch Global Leaderboard
        const globalRes = await axios.get('/api/v1/leaderboard/global?limit=50');
        if (globalRes.data.success) {
          setGlobalLeaderboard(globalRes.data.leaderboard || []);
        }

        // 2. Fetch Games List
        const gamesRes = await axios.get('/api/v1/games');
        if (gamesRes.data.success && gamesRes.data.games) {
          setGames(gamesRes.data.games);
          if (gamesRes.data.games.length > 0) {
            setSelectedGameId(gamesRes.data.games[0]._id);
          }
        }

        // 3. Fetch current user info if logged in
        if (token) {
          try {
            const profileRes = await axios.get('/api/v1/auth/profile', {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (profileRes.data.success) {
              setUserProfile(profileRes.data.user);
              // Store latest user in local storage to keep navbar synced
              localStorage.setItem('user', JSON.stringify(profileRes.data.user));
              window.dispatchEvent(new Event('user-stats-changed'));
            }

            const positionRes = await axios.get('/api/v1/leaderboard/user/position', {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (positionRes.data.success) {
              setUserGlobalPosition(positionRes.data.position);
            }
          } catch (profileErr) {
            console.error('Failed to fetch user profile/rank:', profileErr);
          }
        }
      } catch (err) {
        console.error('Leaderboard initialization error:', err);
        setError('Failed to load leaderboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    initFetch();
  }, []);

  // Fetch cabinet leaderboard when selected game or difficulty changes
  useEffect(() => {
    if (!selectedGameId) return;

    const fetchCabinetLeaderboard = async () => {
      setCabinetLoading(true);
      try {
        const res = await axios.get(`/api/v1/leaderboard/game/${selectedGameId}?limit=50&difficulty=${selectedDifficulty}`);
        if (res.data.success) {
          setGameLeaderboard(res.data.leaderboardWithRanks || res.data.leaderboard || []);
        }
      } catch (err) {
        console.error('Failed to fetch game cabinet leaderboard:', err);
      } finally {
        setCabinetLoading(false);
      }
    };

    fetchCabinetLeaderboard();
  }, [selectedGameId, selectedDifficulty]);

  // Compute XP progress percentage
  const getXpProgress = () => {
    if (!userProfile?.gameStats) return 0;
    const currentXp = userProfile.gameStats.experience || 0;
    const level = userProfile.gameStats.level || 1;
    const xpNeeded = level * 100;
    return Math.min(100, Math.floor((currentXp / xpNeeded) * 100));
  };

  // Helper to format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="leaderboard-wrapper">
      {/* Sleek Navigation Bar */}
      <div className="game-nav-bar">
        <Link to="/UODGaming" className="back-btn">
          <ArrowLeft size={16} />
          <span>Back to Games</span>
        </Link>
        <span className="game-status-title font-orbitron">Arcade Hall: Leaderboard</span>
      </div>

      <div className="leaderboard-hero">
        <span className="hero-meta-label">THE HIGH SCORE ARENA</span>
        <h1 className="hero-title font-orbitron">HALL OF FAME</h1>
        <p className="hero-subtitle">
          Compete online, earn coins, level up, and etch your name into retro gaming history.
        </p>
      </div>

      <div className="leaderboard-content-container">
        {/* TOP SECTION: User Progression Panel */}
        <div className="player-progression-panel">
          {isLoggedIn ? (
            userProfile ? (
              <div className="player-stats-card glass-panel">
                <div className="player-avatar-header">
                  <div className="avatar-placeholder">
                    {userProfile.username.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="player-title-info">
                    <span className="player-display-name">
                      {userProfile.profile?.displayName || userProfile.username}
                    </span>
                    <span className="player-username">@{userProfile.username}</span>
                  </div>
                  <div className="player-global-rank-badge">
                    <Trophy className="rank-trophy-icon" size={18} />
                    <div className="rank-badge-text">
                      <span className="rank-label">GLOBAL RANK</span>
                      <span className="rank-val">
                        #{userGlobalPosition?.globalRank || userGlobalPosition?.rank || '-'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="progression-grid">
                  <div className="progression-item xp-progress-wrapper">
                    <div className="xp-details">
                      <span className="xp-level font-orbitron">LEVEL {userProfile.gameStats?.level || 1}</span>
                      <span className="xp-fraction">
                        {userProfile.gameStats?.experience || 0} / {(userProfile.gameStats?.level || 1) * 100} XP
                      </span>
                    </div>
                    <div className="xp-bar-outer">
                      <div 
                        className="xp-bar-inner" 
                        style={{ width: `${getXpProgress()}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="progression-stats">
                    <div className="stat-box">
                      <Coins className="stat-box-icon text-gold" size={18} />
                      <span className="stat-box-val">{userProfile.coins || 0}</span>
                      <span className="stat-box-lbl">Coins Earned</span>
                    </div>
                    <div className="stat-box">
                      <Activity className="stat-box-icon text-cyan" size={18} />
                      <span className="stat-box-val">{userProfile.gameStats?.totalGamesPlayed || 0}</span>
                      <span className="stat-box-lbl">Cabinet Plays</span>
                    </div>
                    <div className="stat-box">
                      <Award className="stat-box-icon text-pink" size={18} />
                      <span className="stat-box-val">{userProfile.gameStats?.totalWins || 0}</span>
                      <span className="stat-box-lbl">Cabinet Wins</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="loading-stats-skeleton glass-panel">
                <p>Retrieving player data...</p>
              </div>
            )
          ) : (
            <div className="anon-cta-card glass-panel">
              <div className="cta-left">
                <Sparkles className="cta-icon text-cyan" size={24} />
                <div className="cta-text">
                  <h3>Earn Coins & Record Progress</h3>
                  <p>Create an account to save high scores, earn arcade coins, level up, and rank globally!</p>
                </div>
              </div>
              <div className="cta-right">
                <Link to="/login" className="cta-login-btn">
                  <LogIn size={16} />
                  <span>Log In / Sign Up</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM SECTION: Leaderboard Rankings Tables */}
        <div className="rankings-board-card glass-panel">
          {/* Tab Selector */}
          <div className="board-tabs">
            <button 
              className={`board-tab-btn font-orbitron ${activeTab === 'global' ? 'active' : ''}`}
              onClick={() => setActiveTab('global')}
            >
              GLOBAL RANKINGS
            </button>
            <button 
              className={`board-tab-btn font-orbitron ${activeTab === 'cabinet' ? 'active' : ''}`}
              onClick={() => setActiveTab('cabinet')}
            >
              CABINET HIGH SCORES
            </button>
          </div>

          <div className="board-pane">
            {loading ? (
              <div className="leaderboard-loader">
                <div className="loader-spinner"></div>
                <p>Loading ranking tables...</p>
              </div>
            ) : error ? (
              <div className="leaderboard-error font-orbitron">{error}</div>
            ) : activeTab === 'global' ? (
              /* GLOBAL RANKINGS TABLE */
              <div className="table-responsive">
                <table className="leaderboard-table">
                  <thead>
                    <tr>
                      <th className="th-rank">Rank</th>
                      <th className="th-player">Player</th>
                      <th className="th-level">Level</th>
                      <th className="th-games">Games</th>
                      <th className="th-score">Total Score</th>
                      <th className="th-avg">Avg Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {globalLeaderboard.length > 0 ? (
                      globalLeaderboard.map((entry, idx) => {
                        const rank = entry.rank || (idx + 1);
                        const isSelf = userProfile && entry.player === userProfile._id;
                        
                        return (
                          <tr key={entry._id} className={isSelf ? 'row-highlight-self' : ''}>
                            <td className="td-rank">
                              {rank === 1 ? <span className="trophy-rank gold-t">🏆</span> :
                               rank === 2 ? <span className="trophy-rank silver-t">🥈</span> :
                               rank === 3 ? <span className="trophy-rank bronze-t">🥉</span> :
                               <span className="rank-number font-orbitron">{rank}</span>}
                            </td>
                            <td className="td-player">
                              <span className="player-display">
                                {entry.user?.profile?.displayName || entry.user?.username || 'Arcade Pilot'}
                              </span>
                              {entry.user?.profile?.country && (
                                <span className="country-badge">{entry.user.profile.country}</span>
                              )}
                            </td>
                            <td className="td-level font-orbitron">Lv {entry.level?.current || 1}</td>
                            <td className="td-games">{entry.overallStats?.totalGames || 0}</td>
                            <td className="td-score font-orbitron text-cyan">
                              {(entry.overallStats?.totalScore || 0).toLocaleString()}
                            </td>
                            <td className="td-avg">
                              {Math.round(entry.overallStats?.averageScore || 0).toLocaleString()}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="6" className="empty-table-msg font-orbitron">No global entries found yet. Be the first to rank!</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              /* CABINET RANKINGS TABLE */
              <div className="cabinet-leaderboard-section">
                <div className="cabinet-selector-bar">
                  <div className="selector-group">
                    <label htmlFor="game-select" className="font-orbitron">SELECT CABINET:</label>
                    <select 
                      id="game-select" 
                      value={selectedGameId} 
                      onChange={(e) => setSelectedGameId(e.target.value)}
                      className="cabinet-select-dropdown"
                    >
                      {games.map(game => (
                        <option key={game._id} value={game._id}>{game.title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="selector-group">
                    <label htmlFor="difficulty-select" className="font-orbitron">DIFFICULTY:</label>
                    <select 
                      id="difficulty-select" 
                      value={selectedDifficulty} 
                      onChange={(e) => setSelectedDifficulty(e.target.value)}
                      className="cabinet-select-dropdown"
                    >
                      <option value="all">All Levels</option>
                      <option value="easy">Easy (Level 1)</option>
                      <option value="medium">Medium (Level 2)</option>
                      <option value="hard">Hard (Level 3)</option>
                    </select>
                  </div>
                </div>

                {cabinetLoading ? (
                  <div className="leaderboard-loader small-loader">
                    <div className="loader-spinner"></div>
                    <p>Loading cabinet standings...</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="leaderboard-table">
                      <thead>
                        <tr>
                          <th className="th-rank">Rank</th>
                          <th className="th-player">Player</th>
                          <th className="th-difficulty">Difficulty</th>
                          <th className="th-score">Score</th>
                          <th className="th-date">Achieved At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gameLeaderboard.length > 0 ? (
                          gameLeaderboard.map((entry, idx) => {
                            const rank = entry.rank || (idx + 1);
                            const playerObj = entry.player || {};
                            const isSelf = userProfile && playerObj._id === userProfile._id;
                            
                            return (
                              <tr key={entry._id} className={isSelf ? 'row-highlight-self' : ''}>
                                <td className="td-rank">
                                  {rank === 1 ? <span className="trophy-rank gold-t">🏆</span> :
                                   rank === 2 ? <span className="trophy-rank silver-t">🥈</span> :
                                   rank === 3 ? <span className="trophy-rank bronze-t">🥉</span> :
                                   <span className="rank-number font-orbitron">{rank}</span>}
                                </td>
                                <td className="td-player">
                                  <span className="player-display">
                                    {playerObj.profile?.displayName || playerObj.username || 'Arcade Pilot'}
                                  </span>
                                  {playerObj.profile?.country && (
                                    <span className="country-badge">{playerObj.profile.country}</span>
                                  )}
                                </td>
                                <td className="td-difficulty font-orbitron">
                                  {entry.metadata?.difficulty || entry.difficulty || 'Normal'}
                                </td>
                                <td className="td-score font-orbitron text-pink">
                                  {(entry.score || 0).toLocaleString()}
                                </td>
                                <td className="td-date">
                                  <Calendar size={14} className="date-icon" />
                                  <span>{formatDate(entry.submittedAt || entry.achievedAt)}</span>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan="5" className="empty-table-msg font-orbitron">No scores recorded for this cabinet yet. Set the first record!</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <Foote />
    </div>
  );
};

export default Leaderboard;
