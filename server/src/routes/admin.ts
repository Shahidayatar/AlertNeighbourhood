import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { getAllUsers, deleteUser, updateUser } from '../services/userService';
import { sanitizeUser } from '../models/User';
import { getAllAlerts, deleteAlertById, updateAlertById } from './alerts';
import { info, warn } from '../utils/logger';

const router = Router();

// Middleware to check if user is admin
function requireAdmin(req: AuthRequest, res: Response, next: Function) {
  const users = getAllUsers();
  const user = users.find(u => u.id === req.user?.id);
  
  if (!user?.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  next();
}

// Get all users (admin only)
router.get('/users', authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
  const users = getAllUsers();
  const sanitizedUsers = users.map(sanitizeUser);
  info(`Admin ${req.user?.username} accessed user list`);
  res.json(sanitizedUsers);
});

// Get all alerts with full details (admin only)
router.get('/alerts', authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
  const alerts = getAllAlerts();
  info(`Admin ${req.user?.username} accessed all alerts`);
  res.json(alerts);
});

// Get admin dashboard stats (admin only)
router.get('/stats', authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
  const users = getAllUsers();
  const alerts = getAllAlerts();
  
  const stats = {
    totalUsers: users.length,
    adminUsers: users.filter(u => u.isAdmin).length,
    regularUsers: users.filter(u => !u.isAdmin).length,
    totalAlerts: alerts.length,
    activeAlerts: alerts.filter(a => !a.resolved).length,
    resolvedAlerts: alerts.filter(a => a.resolved).length,
    highRiskAlerts: alerts.filter(a => a.risk === 'High' && !a.resolved).length,
    mediumRiskAlerts: alerts.filter(a => a.risk === 'Medium' && !a.resolved).length,
    lowRiskAlerts: alerts.filter(a => a.risk === 'Low' && !a.resolved).length,
    timestamp: new Date().toISOString(),
  };
  
  info(`Admin ${req.user?.username} accessed dashboard stats`);
  res.json(stats);
});

// Delete user (admin only)
router.delete('/users/:id', authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  
  // Prevent deleting self
  if (id === req.user?.id) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }
  
  const success = deleteUser(id);
  if (!success) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  info(`Admin ${req.user?.username} deleted user ${id}`);
  res.json({ message: 'User deleted successfully' });
});

// Update user (admin only)
router.patch('/users/:id', authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { username, email, isAdmin } = req.body;
  
  const updates: any = {};
  if (username) updates.username = username;
  if (email) updates.email = email;
  if (typeof isAdmin === 'boolean') updates.isAdmin = isAdmin;
  
  const updatedUser = updateUser(id, updates);
  if (!updatedUser) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  info(`Admin ${req.user?.username} updated user ${id}`);
  res.json(sanitizeUser(updatedUser));
});

// Delete alert (admin only)
router.delete('/alerts/:id', authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  
  const success = deleteAlertById(id);
  if (!success) {
    return res.status(404).json({ error: 'Alert not found' });
  }
  
  info(`Admin ${req.user?.username} deleted alert ${id}`);
  res.json({ message: 'Alert deleted successfully' });
});

// Update alert (admin only)
router.patch('/alerts/:id', authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { title, description, risk, resolved } = req.body;
  
  const updates: any = {};
  if (title) updates.title = title;
  if (description) updates.description = description;
  if (risk) updates.risk = risk;
  if (typeof resolved === 'boolean') updates.resolved = resolved;
  
  const updatedAlert = updateAlertById(id, updates);
  if (!updatedAlert) {
    return res.status(404).json({ error: 'Alert not found' });
  }
  
  info(`Admin ${req.user?.username} updated alert ${id}`);
  res.json(updatedAlert);
});

export default router;
