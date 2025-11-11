import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    UINotification,
} from '../../../services/notificationService';
import './index.css';

export default function NotificationsPage({ username }: { username: string }) {
    const [items, setItems] = useState<UINotification[]>([]);
    const [nextCursor, setNextCursor] = useState<string | undefined>();
    const [loading, setLoading] = useState(false);

    const load = async (cursor?: string) => {
        setLoading(true);
        try {
            const { items: page, nextCursor } = await getNotifications(username, 20, cursor);
            setItems(prev => (cursor ? [...prev, ...page] : page));
            setNextCursor(nextCursor);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [username]);

    const onMarkRead = async (id: string) => {
        const updated = await markNotificationRead(id);
        setItems(prev => prev.map(n => (n._id === id ? { ...n, ...updated } : n)));
    };

    const onMarkAllRead = async () => {
        await markAllNotificationsRead(username);
        setItems(prev => prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() })));
    };

    const onDelete = async (id: string) => {
        await deleteNotification(id);
        setItems(prev => prev.filter(n => n._id !== id));
    };

    return (
        <div className="notif-page">
            <header className="notif-header">
                <div className="notif-header__title">
                    <h1>Notifications</h1>
                    <p className="notif-subtitle">Recent updates from questions and chats</p>
                </div>
                <div className="notif-actions">
                    <button
                        className="btn btn-secondary"
                        onClick={onMarkAllRead}
                        disabled={!items.some(n => !n.isRead)}
                    >
                        Mark all as read
                    </button>
                </div>
            </header>

            {items.length === 0 && !loading && (
                <div className="notif-empty">
                    <div className="notif-empty__icon" aria-hidden>🔔</div>
                    <h2>All caught up</h2>
                    <p>You don’t have any notifications yet.</p>
                </div>
            )}

            <ul className="notif-list">
                {items.map(n => (
                    <li
                        key={n._id}
                        className={`notif-card ${n.isRead ? 'is-read' : 'is-unread'}`}
                    >
                        <div className="notif-card__icon" aria-hidden>
                            {n.kind === 'chat' ? '💬' : n.kind === 'answer' ? '✅' : '✨'}
                        </div>

                        <div className="notif-card__content">
                            <div className="notif-card__top">
                                <h3 className="notif-card__title">
                                    {n.title ?? `${n.kind} update`}
                                </h3>
                                {!n.isRead && <span className="notif-dot" aria-label="unread" />}
                            </div>

                            {n.preview && <p className="notif-card__preview">{n.preview}</p>}

                            <div className="notif-card__meta">
                                {n.actorUsername && <span className="notif-actor">@{n.actorUsername}</span>}
                                <span className="notif-divider">•</span>
                                <time dateTime={n.createdAt}>
                                    {new Date(n.createdAt).toLocaleString()}
                                </time>
                            </div>

                            <div className="notif-card__actions">
                                {n.link && (
                                    <Link to={n.link} className="btn btn-primary">
                                        Open
                                    </Link>
                                )}
                                {!n.isRead && (
                                    <button className="btn btn-success" onClick={() => onMarkRead(n._id)}>
                                        Mark read
                                    </button>
                                )}
                                <button className="btn btn-danger" onClick={() => onDelete(n._id)}>
                                    Delete
                                </button>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>

            <div className="notif-footer">
                <button
                    className="btn btn-outline"
                    disabled={!nextCursor || loading}
                    onClick={() => load(nextCursor)}
                >
                    {loading ? 'Loading…' : (nextCursor ? 'Load more' : 'No more')}
                </button>
            </div>
        </div>
    );
}
