import React, { useState, useMemo, useEffect } from 'react';
import { Ingredient, ConsumptionLog, SupplyLog } from '../types';
import { Notification } from '../types-extended';
import { Bell, BellOff, AlertTriangle, Clock, DollarSign, Package, X, CheckCircle2, Users } from 'lucide-react';
import { getAllNotifications, fetchDatabaseNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../services/notifications';

interface NotificationCenterProps {
  inventory: Ingredient[];
  logs: ConsumptionLog[];
  supplyLogs: SupplyLog[];
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ inventory, logs, supplyLogs }) => {
  const [readNotifications, setReadNotifications] = useState<Set<string>>(new Set());
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);
  const [databaseNotifications, setDatabaseNotifications] = useState<Notification[]>([]);

  // Fetch database notifications on mount
  useEffect(() => {
    const loadDatabaseNotifications = async () => {
      const dbNotifs = await fetchDatabaseNotifications();
      setDatabaseNotifications(dbNotifs);

      // Mark read notifications
      const readIds = new Set(dbNotifs.filter(n => n.read).map(n => n.id));
      setReadNotifications(prev => new Set([...prev, ...readIds]));
    };
    loadDatabaseNotifications();
  }, []);

  const localNotifications = useMemo(() => {
    return getAllNotifications(inventory, logs, supplyLogs);
  }, [inventory, logs, supplyLogs]);

  // Combine local and database notifications
  const notifications = useMemo(() => {
    const combined = [...localNotifications, ...databaseNotifications];
    // Sort by date (newest first) and severity
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    combined.sort((a, b) => {
      const dateCompare = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (dateCompare !== 0) return dateCompare;
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
    return combined;
  }, [localNotifications, databaseNotifications]);

  const unreadNotifications = useMemo(() => {
    return notifications.filter(n => !readNotifications.has(n.id));
  }, [notifications, readNotifications]);

  const displayedNotifications = showOnlyUnread ? unreadNotifications : notifications;

  const markAsRead = async (id: string) => {
    setReadNotifications(prev => new Set([...prev, id]));
    // If it's a database notification, also update in Supabase
    if (databaseNotifications.find(n => n.id === id)) {
      await markNotificationAsRead(id);
    }
  };

  const markAllAsRead = async () => {
    setReadNotifications(new Set(notifications.map(n => n.id)));
    // Mark all database notifications as read
    await markAllNotificationsAsRead();
  };

  const getSeverityColor = (severity: Notification['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-300 text-red-800';
      case 'high':
        return 'bg-orange-50 border-orange-300 text-orange-800';
      case 'medium':
        return 'bg-yellow-50 border-yellow-300 text-yellow-800';
      case 'low':
        return 'bg-blue-50 border-blue-300 text-blue-800';
    }
  };

  const getSeverityIcon = (type: Notification['type']) => {
    switch (type) {
      case 'low_stock':
        return <Package className="w-6 h-6" />;
      case 'expiring':
        return <Clock className="w-6 h-6" />;
      case 'budget_alert':
        return <DollarSign className="w-6 h-6" />;
      case 'waste_alert':
        return <AlertTriangle className="w-6 h-6" />;
      case 'attendance_alert':
        return <Users className="w-6 h-6" />;
      default:
        return <Bell className="w-6 h-6" />;
    }
  };

  const getSeverityBadge = (severity: Notification['severity']) => {
    const labels = {
      critical: 'CRÍTICO',
      high: 'ALTO',
      medium: 'MÉDIO',
      low: 'BAIXO'
    };

    const colors = {
      critical: 'bg-red-600',
      high: 'bg-orange-600',
      medium: 'bg-yellow-600',
      low: 'bg-blue-600'
    };

    return (
      <span className={`${colors[severity]} text-white text-xs font-bold px-2 py-1 rounded-full`}>
        {labels[severity]}
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <header>
        <div className="flex justify-between items-center mb-2">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <Bell className="text-purple-600" />
              Central de Notificações
            </h2>
            <p className="text-gray-500">Acompanhe alertas e avisos importantes</p>
          </div>
          {unreadNotifications.length > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-200 font-medium"
            >
              <CheckCircle2 className="w-5 h-5" />
              Marcar todas como lidas
            </button>
          )}
        </div>

        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">Total:</span>
            <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-bold">
              {notifications.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">Não lidas:</span>
            <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-bold">
              {unreadNotifications.length}
            </span>
          </div>
          <label className="flex items-center gap-2 cursor-pointer ml-auto">
            <input
              type="checkbox"
              checked={showOnlyUnread}
              onChange={(e) => setShowOnlyUnread(e.target.checked)}
              className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
            />
            <span className="text-sm font-medium text-gray-700">Mostrar apenas não lidas</span>
          </label>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-red-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 text-red-600 rounded-xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Críticas</p>
              <p className="text-2xl font-bold text-red-600">
                {notifications.filter(n => n.severity === 'critical').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-orange-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Altas</p>
              <p className="text-2xl font-bold text-orange-600">
                {notifications.filter(n => n.severity === 'high').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-yellow-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-100 text-yellow-600 rounded-xl">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Médias</p>
              <p className="text-2xl font-bold text-yellow-600">
                {notifications.filter(n => n.severity === 'medium').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Baixas</p>
              <p className="text-2xl font-bold text-blue-600">
                {notifications.filter(n => n.severity === 'low').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-800">
            {showOnlyUnread ? 'Notificações Não Lidas' : 'Todas as Notificações'}
          </h3>
        </div>

        <div className="divide-y divide-gray-100">
          {displayedNotifications.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <BellOff className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">
                {showOnlyUnread
                  ? 'Nenhuma notificação não lida'
                  : 'Nenhuma notificação no momento'}
              </p>
              <p className="text-sm mt-2">
                {showOnlyUnread
                  ? 'Parabéns! Você está em dia com todas as notificações.'
                  : 'Tudo certo! Não há alertas no momento.'}
              </p>
            </div>
          ) : (
            displayedNotifications.map(notification => (
              <div
                key={notification.id}
                className={`p-6 ${getSeverityColor(notification.severity)} ${readNotifications.has(notification.id) ? 'opacity-60' : ''
                  } hover:bg-opacity-80 transition-all`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {getSeverityIcon(notification.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="text-lg font-bold">{notification.title}</h4>
                        <p className="text-sm opacity-75 mt-1">{notification.message}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {getSeverityBadge(notification.severity)}
                        {!readNotifications.has(notification.id) && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-1.5 hover:bg-black hover:bg-opacity-10 rounded-lg transition-colors"
                            title="Marcar como lida"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs opacity-60 mt-2">
                      <span>
                        {new Date(notification.createdAt).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {readNotifications.has(notification.id) && (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Lida
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Info */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-start gap-3">
        <Bell className="w-6 h-6 text-purple-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-purple-800 font-medium">Sobre as Notificações</p>
          <p className="text-purple-700 text-sm mt-1">
            As notificações são geradas automaticamente com base em alertas de estoque, validade,
            previsões de consumo e outros indicadores importantes. Mantenha-se atualizado para
            evitar problemas operacionais.
          </p>
        </div>
      </div>
    </div>
  );
};
