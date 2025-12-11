import React, { useEffect, useState } from 'react';
import { getAdminStats, getAdminUsers, getAdminAlerts, adminDeleteUser, adminDeleteAlert, adminUpdateAlert } from '../api';
import { useAuth } from '../contexts/AuthContext';

interface Stats {
  totalUsers: number;
  adminUsers: number;
  regularUsers: number;
  totalAlerts: number;
  activeAlerts: number;
  resolvedAlerts: number;
  highRiskAlerts: number;
  mediumRiskAlerts: number;
  lowRiskAlerts: number;
  timestamp: string;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'alerts'>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingAlert, setEditingAlert] = useState<any | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsData, usersData, alertsData] = await Promise.all([
        getAdminStats(),
        getAdminUsers(),
        getAdminAlerts(),
      ]);
      setStats(statsData);
      setUsers(usersData);
      setAlerts(alertsData);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    
    setDeletingId(userId);
    try {
      await adminDeleteUser(userId);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete user');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    if (!confirm('Are you sure you want to delete this alert?')) return;
    
    setDeletingId(alertId);
    try {
      await adminDeleteAlert(alertId);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete alert');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleResolved = async (alertId: string, currentStatus: boolean) => {
    try {
      await adminUpdateAlert(alertId, { resolved: !currentStatus });
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update alert');
    }
  };

  const handleUpdateAlertRisk = async (alertId: string, newRisk: string) => {
    try {
      await adminUpdateAlert(alertId, { risk: newRisk });
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update alert');
    }
  };

  if (loading) {
    return <div className="admin-dashboard"><div className="loading">Loading admin dashboard...</div></div>;
  }

  if (error) {
    return <div className="admin-dashboard"><div className="error-message">{error}</div></div>;
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>🛡️ Admin Dashboard</h1>
        <p>Welcome, {user?.username}</p>
      </div>

      <div className="admin-tabs">
        <button 
          className={activeTab === 'overview' ? 'active' : ''} 
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={activeTab === 'users' ? 'active' : ''} 
          onClick={() => setActiveTab('users')}
        >
          👥 Users ({users.length})
        </button>
        <button 
          className={activeTab === 'alerts' ? 'active' : ''} 
          onClick={() => setActiveTab('alerts')}
        >
          🚨 Alerts ({alerts.length})
        </button>
      </div>

      {activeTab === 'overview' && stats && (
        <div className="admin-content">
          <h2>System Statistics</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-value">{stats.totalUsers}</div>
              <div className="stat-label">Total Users</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🛡️</div>
              <div className="stat-value">{stats.adminUsers}</div>
              <div className="stat-label">Admins</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🚨</div>
              <div className="stat-value">{stats.totalAlerts}</div>
              <div className="stat-label">Total Alerts</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⚡</div>
              <div className="stat-value">{stats.activeAlerts}</div>
              <div className="stat-label">Active Alerts</div>
            </div>
            <div className="stat-card red">
              <div className="stat-icon">🔴</div>
              <div className="stat-value">{stats.highRiskAlerts}</div>
              <div className="stat-label">High Risk</div>
            </div>
            <div className="stat-card orange">
              <div className="stat-icon">🟠</div>
              <div className="stat-value">{stats.mediumRiskAlerts}</div>
              <div className="stat-label">Medium Risk</div>
            </div>
            <div className="stat-card green">
              <div className="stat-icon">🟢</div>
              <div className="stat-value">{stats.lowRiskAlerts}</div>
              <div className="stat-label">Low Risk</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-value">{stats.resolvedAlerts}</div>
              <div className="stat-label">Resolved</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="admin-content">
          <h2>All Users</h2>
          <div className="admin-table">
            <table>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>{u.username}</td>
                    <td>{u.email}</td>
                    <td>
                      {u.isAdmin ? (
                        <span className="badge admin">🛡️ Admin</span>
                      ) : (
                        <span className="badge user">👤 User</span>
                      )}
                    </td>
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button 
                        className="action-btn delete-btn"
                        onClick={() => handleDeleteUser(u.id)}
                        disabled={deletingId === u.id || u.id === user?.id}
                        title={u.id === user?.id ? 'Cannot delete yourself' : 'Delete user'}
                      >
                        {deletingId === u.id ? '⏳' : '🗑️'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="admin-content">
          <h2>All Alerts</h2>
          <div className="admin-table">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Image</th>
                  <th>Risk</th>
                  <th>Author</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map(a => (
                  <tr key={a.id}>
                    <td>{a.title}</td>
                    <td>
                      {a.image ? (
                        <img 
                          src={`http://localhost:4000${a.image}`} 
                          alt="Alert" 
                          className="admin-alert-thumbnail"
                          onClick={() => window.open(`http://localhost:4000${a.image}`, '_blank')}
                        />
                      ) : (
                        <span style={{ opacity: 0.5 }}>No image</span>
                      )}
                    </td>
                    <td>
                      <select 
                        className={`risk-select risk-${a.risk?.toLowerCase()}`}
                        value={a.risk || 'Unknown'}
                        onChange={(e) => handleUpdateAlertRisk(a.id, e.target.value)}
                      >
                        <option value="High">🔴 High</option>
                        <option value="Medium">🟠 Medium</option>
                        <option value="Low">🟢 Low</option>
                        <option value="Unknown">⚪ Unknown</option>
                      </select>
                    </td>
                    <td>{a.username || 'Unknown'}</td>
                    <td>{a.lat.toFixed(2)}, {a.lng.toFixed(2)}</td>
                    <td>
                      <button 
                        className={`status-toggle ${a.resolved ? 'resolved' : 'active'}`}
                        onClick={() => handleToggleResolved(a.id, a.resolved)}
                      >
                        {a.resolved ? '✅ Resolved' : '⚡ Active'}
                      </button>
                    </td>
                    <td>{new Date(a.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button 
                        className="action-btn delete-btn"
                        onClick={() => handleDeleteAlert(a.id)}
                        disabled={deletingId === a.id}
                      >
                        {deletingId === a.id ? '⏳' : '🗑️'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
