/**
 * ============================================
 * CHAT PAGE COMPONENT
 * ============================================
 * Main chat page layout
 * Combines ChatList and Chat components
 * Responsive design for desktop and mobile
 */

import React, { useState } from 'react';
import ChatList from './ChatList';
import Chat from './Chat';
import './ChatPage.css';

const ChatPage = () => {
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [showChatList, setShowChatList] = useState(true);

    /**
     * Handle selecting a conversation from the list
     */
    const handleSelectConversation = (conversation) => {
        setSelectedConversation(conversation);
        // On mobile, hide the list when a conversation is selected
        if (window.innerWidth < 768) {
            setShowChatList(false);
        }
    };

    /**
     * Handle back button on mobile
     */
    const handleBackToList = () => {
        setShowChatList(true);
        setSelectedConversation(null);
    };

    return (
        <div className="chat-page">
            {/* Chat List Section */}
            <div className={`chat-list-section ${showChatList ? 'show' : 'hide'}`}>
                <ChatList
                    onSelectConversation={handleSelectConversation}
                    selectedConversationId={selectedConversation?.requestId}
                />
            </div>

            {/* Chat Section */}
            <div className={`chat-section ${!showChatList ? 'show' : 'hide'}`}>
                {selectedConversation ? (
                    <>
                        {/* Mobile Back Button */}
                        <div className="chat-mobile-header">
                            <button
                                className="back-btn"
                                onClick={handleBackToList}
                                title="Back to conversations"
                            >
                                ← Back
                            </button>
                        </div>

                        {/* Chat Component */}
                        <Chat
                            requestId={selectedConversation.requestId}
                            otherUserId={selectedConversation.otherParticipant.id}
                            otherUserName={selectedConversation.otherParticipant.name}
                            otherUserBloodGroup={selectedConversation.bloodGroup}
                        />
                    </>
                ) : (
                    <div className="no-conversation-selected">
                        <div className="empty-state">
                            <div className="empty-icon">💬</div>
                            <h2>Select a conversation</h2>
                            <p>Choose a conversation from the list to start chatting</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatPage;
