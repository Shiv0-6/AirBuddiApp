import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { dashboardTheme } from '../../features/dashboard/dashboardTheme';

type ChatMessage = {
  id: string;
  text: string;
  sender: 'agent' | 'user';
};

type LiveChatScreenProps = {
  onClose: () => void;
};

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'welcome',
    sender: 'agent',
    text: 'Hi! I’m the AirBuddi support assistant. How can I help today?',
  },
];

const QUICK_REPLIES = [
  'My device is offline',
  'How do I add a device?',
  'Check air quality',
];

function getReply(message: string): string {
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes('offline')) {
    return 'Please check that AirBuddi is powered on and connected to Wi-Fi. Then return to Home and pull down to refresh.';
  }
  if (normalizedMessage.includes('add') || normalizedMessage.includes('pair')) {
    return 'Open Home, tap Add device, and scan the QR code or enter the MAC address from the device label.';
  }
  if (normalizedMessage.includes('quality') || normalizedMessage.includes('aqi')) {
    return 'Open the Monitor tab to see live AQI, PM2.5, temperature, and humidity readings.';
  }

  return 'Thanks for reaching out. I can help with device setup, offline devices, and air-quality readings. What would you like to try?';
}

export function LiveChatScreen({ onClose }: LiveChatScreenProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [draft, setDraft] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const replyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (replyTimerRef.current) {
      clearTimeout(replyTimerRef.current);
    }
  }, []);

  const canSend = useMemo(() => draft.trim().length > 0 && !isTyping, [draft, isTyping]);

  const sendMessage = (text: string) => {
    const trimmedText = text.trim();
    if (!trimmedText || isTyping) {
      return;
    }

    setMessages(current => [
      ...current,
      { id: `user-${Date.now()}`, sender: 'user', text: trimmedText },
    ]);
    setDraft('');
    setIsTyping(true);

    replyTimerRef.current = setTimeout(() => {
      setMessages(current => [
        ...current,
        { id: `agent-${Date.now()}`, sender: 'agent', text: getReply(trimmedText) },
      ]);
      setIsTyping(false);
      replyTimerRef.current = null;
    }, 650);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityLabel="Close live chat"
          accessibilityRole="button"
          onPress={onClose}
          style={styles.headerButton}
        >
          <MaterialCommunityIcons name="arrow-left" size={25} color={dashboardTheme.colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Live Chat</Text>
          <View style={styles.onlineRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>AirBuddi support · Usually replies instantly</Text>
          </View>
        </View>
        <MaterialCommunityIcons name="headset" size={25} color={dashboardTheme.colors.primaryDark} />
      </View>

      <KeyboardAvoidingView
        style={styles.chatArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
      >
        <FlatList
          data={messages}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={[styles.messageRow, item.sender === 'user' && styles.userMessageRow]}>
              <View style={[styles.bubble, item.sender === 'user' ? styles.userBubble : styles.agentBubble]}>
                <Text style={[styles.messageText, item.sender === 'user' && styles.userMessageText]}>{item.text}</Text>
              </View>
            </View>
          )}
          ListFooterComponent={isTyping ? (
            <View style={styles.typingBubble}>
              <Text style={styles.typingText}>Support is typing…</Text>
            </View>
          ) : null}
        />

        {messages.length === 1 && (
          <View style={styles.quickReplySection}>
            <Text style={styles.quickReplyLabel}>Try a quick question</Text>
            <View style={styles.quickReplies}>
              {QUICK_REPLIES.map(reply => (
                <TouchableOpacity
                  key={reply}
                  accessibilityRole="button"
                  onPress={() => sendMessage(reply)}
                  style={styles.quickReply}
                >
                  <Text style={styles.quickReplyText}>{reply}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.composer}>
          <TextInput
            accessibilityLabel="Message support"
            value={draft}
            onChangeText={setDraft}
            placeholder="Type your message..."
            placeholderTextColor={dashboardTheme.colors.textMuted}
            style={styles.input}
            returnKeyType="send"
            onSubmitEditing={() => sendMessage(draft)}
            editable={!isTyping}
          />
          <TouchableOpacity
            accessibilityLabel="Send message"
            accessibilityRole="button"
            disabled={!canSend}
            onPress={() => sendMessage(draft)}
            style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
          >
            <MaterialCommunityIcons name="send" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: dashboardTheme.colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: dashboardTheme.colors.border,
    backgroundColor: dashboardTheme.colors.surface,
  },
  headerButton: { width: 34, height: 34, justifyContent: 'center' },
  headerCopy: { flex: 1, marginLeft: 8 },
  title: { color: dashboardTheme.colors.textPrimary, fontSize: 19, fontWeight: '800' },
  onlineRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: dashboardTheme.colors.success, marginRight: 6 },
  onlineText: { color: dashboardTheme.colors.textMuted, fontSize: 11 },
  chatArea: { flex: 1 },
  messageList: { padding: 20, paddingBottom: 10, flexGrow: 1, justifyContent: 'flex-end' },
  messageRow: { flexDirection: 'row', marginBottom: 12 },
  userMessageRow: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '82%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 11 },
  agentBubble: { backgroundColor: dashboardTheme.colors.surface, borderBottomLeftRadius: 5, borderWidth: 1, borderColor: dashboardTheme.colors.border },
  userBubble: { backgroundColor: dashboardTheme.colors.primaryDark, borderBottomRightRadius: 5 },
  messageText: { color: dashboardTheme.colors.textPrimary, fontSize: 14, lineHeight: 20 },
  userMessageText: { color: '#FFFFFF' },
  typingBubble: { alignSelf: 'flex-start', marginHorizontal: 20, marginBottom: 10 },
  typingText: { color: dashboardTheme.colors.textMuted, fontSize: 12, fontStyle: 'italic' },
  quickReplySection: { paddingHorizontal: 20, paddingBottom: 10 },
  quickReplyLabel: { color: dashboardTheme.colors.textMuted, fontSize: 12, marginBottom: 8 },
  quickReplies: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickReply: { borderRadius: 16, borderWidth: 1, borderColor: dashboardTheme.colors.primary, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: dashboardTheme.colors.surface },
  quickReplyText: { color: dashboardTheme.colors.primaryDark, fontSize: 12, fontWeight: '700' },
  composer: { flexDirection: 'row', alignItems: 'center', padding: 14, borderTopWidth: 1, borderTopColor: dashboardTheme.colors.border, backgroundColor: dashboardTheme.colors.surface },
  input: { flex: 1, height: 46, borderRadius: 23, backgroundColor: dashboardTheme.colors.surfaceTint, paddingHorizontal: 16, color: dashboardTheme.colors.textPrimary, fontSize: 14 },
  sendButton: { width: 44, height: 44, borderRadius: 22, marginLeft: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: dashboardTheme.colors.primaryDark },
  sendButtonDisabled: { opacity: 0.45 },
});
