import React from 'react'
import '../styles/components/Notification.css'

const Notification = ({ show, message }) => {
  if (!show) return null

  return (
    <div className="notification">
      <div className="notification-content">
        <div className="notification-icon">✓</div>
        {message}
      </div>
    </div>
  )
}

export default Notification
