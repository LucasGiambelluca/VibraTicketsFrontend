import React, { useState } from 'react';
import { Button, Badge } from 'antd';
import { MessageOutlined, RobotOutlined } from '@ant-design/icons';
import ModernChatbot from './ModernChatbot';

const ChatbotButton = () => {
  const [chatOpen, setChatOpen] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);

  const toggleChat = () => {
    setChatOpen(!chatOpen);
    if (!chatOpen) {
      setHasNewMessage(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <div style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 999
      }}>
        <Badge dot={hasNewMessage && !chatOpen}>
          <Button
            type="primary"
            shape="circle"
            size="large"
            icon={chatOpen ? <MessageOutlined /> : <RobotOutlined />}
            onClick={toggleChat}
            style={{
              width: 60,
              height: 60,
              backgroundColor: '#00d4aa',
              borderColor: '#00d4aa',
              boxShadow: '0 4px 20px rgba(0, 212, 170, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              transition: 'all 0.3s ease',
              transform: chatOpen ? 'rotate(180deg)' : 'rotate(0deg)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = chatOpen ? 'rotate(180deg) scale(1.1)' : 'scale(1.1)';
              e.target.style.boxShadow = '0 6px 25px rgba(0, 212, 170, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = chatOpen ? 'rotate(180deg) scale(1)' : 'scale(1)';
              e.target.style.boxShadow = '0 4px 20px rgba(0, 212, 170, 0.4)';
            }}
          />
        </Badge>
      </div>

      {/* Chatbot */}
      <ModernChatbot 
        isOpen={chatOpen} 
        onClose={() => setChatOpen(false)}
      />
    </>
  );
};

export default ChatbotButton;
