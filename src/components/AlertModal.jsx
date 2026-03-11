import { useEffect } from 'react';
import '../styles/AlertModal.css';

export const AlertModal = ({ message, type = 'info', onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 3000);

        return () => clearTimeout(timer);
    }, [onClose]);

    const getIcon = () => {
        switch (type) {
            case 'success':
                return '✓';
            case 'error':
                return '✕';
            case 'warning':
                return '⚠';
            default:
                return 'ℹ';
        }
    };

    return (
        <div className="alert-modal-overlay" onClick={onClose}>
            <div className={`alert-modal-content ${type}`} onClick={(e) => e.stopPropagation()}>
                <div className="alert-modal-icon">
                    {getIcon()}
                </div>
                <div className="alert-modal-message">
                    {message}
                </div>
                <button className="alert-modal-close" onClick={onClose}>
                    ×
                </button>
            </div>
        </div>
    );
};
