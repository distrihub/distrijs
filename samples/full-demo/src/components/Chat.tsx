import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, User, Bot, Square } from 'lucide-react';
import { useChat, DistriAgent } from '@distri/react';
import MessageRenderer from './MessageRenderer';
import { ToolCallRenderer, ToolCallState } from './ToolCallRenderer';

interface ChatProps {
  selectedThreadId: string;
  agent: DistriAgent;
  onThreadUpdate: (threadId: string) => void;
}
const testMessages = [
  {
    "kind": "message",
    "messageId": "e1804b5e-9609-484c-a179-ca35d116a510",
    "role": "user",
    "parts": [
      {
        "kind": "text",
        "text": "give me my tweets"
      }
    ],
    "contextId": "588a5425-5a2b-4ebb-be7b-7f8790c56981",
    "taskId": "cb30fb4c-d887-47a3-ad81-65c22d0cb162",
    "referenceTaskIds": [],
    "extensions": [],
    "metadata": null
  },
  {
    "kind": "message",
    "messageId": "8d0e1688-ac00-4465-be5a-cbdb5c598494",
    "role": "agent",
    "parts": [],
    "contextId": "588a5425-5a2b-4ebb-be7b-7f8790c56981",
    "taskId": null,
    "referenceTaskIds": [],
    "extensions": [],
    "metadata": {
      "type": "run_started",
      "data": {}
    }
  },
  {
    "kind": "message",
    "messageId": "a5ec0dca-924f-4e0d-ade0-d9f15ab3a7ab",
    "role": "agent",
    "parts": [],
    "contextId": "588a5425-5a2b-4ebb-be7b-7f8790c56981",
    "taskId": null,
    "referenceTaskIds": [],
    "extensions": [],
    "metadata": {
      "type": "tool_call_start",
      "data": {
        "tool_call_id": "call_UYBPBKKOdbVEzUm8MdRqyaDO",
        "tool_call_name": "get_timeline",
        "parent_message_id": null
      }
    }
  },
  {
    "kind": "message",
    "messageId": "a1b82e77-8b0c-4248-a647-dea37fa450f3",
    "role": "agent",
    "parts": [],
    "contextId": "588a5425-5a2b-4ebb-be7b-7f8790c56981",
    "taskId": null,
    "referenceTaskIds": [],
    "extensions": [],
    "metadata": {
      "type": "tool_call_result",
      "data": {
        "tool_call_id": "call_UYBPBKKOdbVEzUm8MdRqyaDO",
        "result": "{\"count\":33,\"first\":[{\"__typename\":\"Tweet\",\"rest_id\":\"1943221221119979928\",\"core\":{\"user_results\":{\"result\":{\"__typename\":\"User\",\"id\":\"VXNlcjo0NDE5NjM5Nw==\",\"rest_id\":\"44196397\",\"affiliates_highlighted_label\":{\"label\":{\"url\":{\"url\":\"https://twitter.com/X\",\"urlType\":\"DeepLink\"},\"badge\":{\"url\":\"https://pbs.twimg.com/profile_images/1683899100922511378/5lY42eHs_bigger.jpg\"},\"description\":\"X\",\"userLabelType\":\"BusinessLabel\",\"userLabelDisplayType\":\"Badge\"}},\"has_graduated_access\":true,\"is_blue_verified\":true,\"profile_image_shape\":\"Circle\",\"legacy\":{\"following\":true,\"can_dm\":false,\"can_media_tag\":false,\"created_at\":\"Tue Jun 02 20:12:29 +0000 2009\",\"default_profile\":false,\"default_profile_image\":false,\"description\":\"\",\"entities\":{\"description\":{\"urls\":[]}},\"fast_followers_count\":0,\"favourites_count\":155394,\"followers_count\":222219107,\"friends_count\":1151,\"has_custom_timelines\":true,\"is_translator\":false,\"listed_count\":163410,\"location\":\"\",\"media_count\":3948,\"name\":\"Elon Musk\",\"normal_followers_count\":222219107,\"pinned_tweet_ids_str\":[\"1943393540538798263\"],\"possibly_sensitive\":false,\"profile_banner_url\":\"https://pbs.twimg.com/profile_banners/44196397/1739948056\",\"profile_image_url_https\":\"https://pbs.twimg.com/profile_images/1936002956333080576/kqqe2iWO_normal.jpg\",\"profile_interstitial_type\":\"\",\"screen_name\":\"elonmusk\",\"statuses_count\":81226,\"translator_type\":\"none\",\"verified\":false,\"want_retweets\":true,\"withheld_in_countries\":[]},\"professional\":{\"rest_id\":\"1679729435447275522\",\"professional_type\":\"Creator\",\"category\":[]},\"tipjar_settings\":{\"is_enabled\":false},\"super_follow_eligible\":true}}},\"unmention_data\":{},\"edit_control\":{\"edit_tweet_ids\":[\"1943221221119979928\"],\"editable_until_msecs\":\"1752138617000\",\"is_edit_eligible\":true,\"edits_remaining\":\"5\"},\"is_translatable\":false,\"views\":{\"count\":\"13701214\",\"state\":\"EnabledWithCount\"},\"source\":\"<a href=\\\"http://twitter.com/download/iphone\\\" rel=\\\"nofollow\\\">Twitter for iPhone</a>\",\"quoted_status_result\":{\"result\":{\"__typename\":\"Tweet\",\"rest_id\":\"1943194296489783462\",\"core\":{\"user_results\":{\"result\":{\"__typename\":\"User\",\"id\":\"VXNlcjoxMzI5ODA3Mg==\",\"rest_id\":\"13298072\",\"affiliates_highlighted_label\":{},\"has_graduated_access\":true,\"is_blue_verified\":true,\"profile_image_shape\":\"Square\",\"legacy\":{\"following\":true,\"can_dm\":true,\"can_media_tag\":true,\"created_at\":\"Sun Feb 10 01:12:32 +0000 2008\",\"default_profile\":false,\"default_profile_image\":false,\"description\":\"Electric vehicles, giant batteries & solar, AI & robotics\",\"entities\":{\"description\":{\"urls\":[]},\"url\":{\"urls\":[{\"display_url\":\"tesla.com\",\"expanded_url\":\"https://www.tesla.com\",\"url\":\"https://t.co/EJC6qVEJnC\",\"indices\":[0,23]}]}},\"fast_followers_count\":0,\"favourites_count\":6921,\"followers_count\":24031191,\"friends_count\":69,\"has_custom_timelines\":true,\"is_translator\":false,\"listed_count\":27410,\"location\":\"\",\"media_count\":1827,\"name\":\"Tesla\",\"normal_followers_count\":24031191,\"pinned_tweet_ids_str\":[\"1936877624036307315\"],\"possibly_sensitive\":false,\"profile_banner_url\":\"https://pbs.twimg.com/profile_banners/13298072/1740542578\",\"profile_image_url_https\":\"https://pbs.twimg.com/profile_images/1337607516008501250/6Ggc4S5n_normal.png\",\"profile_interstitial_type\":\"\",\"screen_name\":\"Tesla\",\"statuses_count\":9564,\"translator_type\":\"none\",\"url\":\"https://t.co/EJC6qVEJnC\",\"verified\":false,\"verified_type\":\"Business\",\"want_retweets\":true,\"withheld_in_countries\":[]},\"professional\":{\"rest_id\":\"1590468365159636997\",\"professional_type\":\"Business\",\"category\":[]},\"tipjar_settings\":{}}}},\"unmention_data\":{},\"edit_control\":{\"edit_tweet_ids\":[\"1943194296489783462\"],\"editable_until_msecs\":\"1752132197000\",\"is_edit_eligible\":true,\"edits_remaining\":\"5\"},\"is_translatable\":false,\"views\":{\"count\":\"13834494\",\"state\":\"EnabledWithCount\"},\"source\":\"<a href=\\\"http://twitter.com/download/iphone\\\" rel=\\\"nofollow\\\">Twitter for iPhone</a>\",\"legacy\":{\"bookmark_count\":511,\"bookmarked\":false,\"created_at\":\"Thu Jul 10 06:23:17 +0000 2025\",\"conversation_id_str\":\"1943194296489783462\",\"display_text_range\":[0,72],\"entities\":{\"hashtags\":[],\"media\":[{\"display_url\":\"pic.x.com/YwprA6wiIO\",\"expanded_url\":\"https://x.com/Tesla/status/1909338780890546495/video/1\",\"id_str\":\"1909338718856441856\",\"indices\":[49,72],\"media_key\":\"7_1909338718856441856\",\"media_url_https\":\"https://pbs.twimg.com/ext_tw_video_thumb/1909338718856441856/pu/img/0WATbY9e5EOa0Icf.jpg\",\"source_status_id_str\":\"1909338780890546495\",\"source_user_id_str\":\"13298072\",\"type\":\"video\",\"url\":\"https://t.co/YwprA6wiIO\",\"additional_media_info\":{\"monetizable\":false,\"source_user\":{\"user_results\":{\"result\":{\"__typename\":\"User\",\"id\":\"VXNlcjoxMzI5ODA3Mg==\",\"rest_id\":\"13298072\",\"affiliates_highlighted_label\":{},\"has_graduated_access\":true,\"is_blue_verified\":true,\"profile_image_shape\":\"Square\",\"legacy\":{\"following\":true,\"can_dm\":true,\"can_media_tag\":true,\"created_at\":\"Sun Feb 10 01:12:32 +0000 2008\",\"default_profile\":false,\"default_profile_image\":false,\"description\":\"Electric vehicles, giant batteries & solar, AI & robotics\",\"entities\":{\"description\":{\"urls\":[]},\"url\":{\"urls\":[{\"display_url\":\"tesla.com\",\"expanded_url\":\"https://www.tesla.com\",\"url\":\"https://t.co/EJC6qVEJnC\",\"indices\":[0,23]}]}},\"fast_followers_count\":0,\"favourites_count\":6921,\"followers_count\":24031191,\"friends_count\":69,\"has_custom_timelines\":true,\"is_translator\":false,\"listed_count\":27410,\"location\":\"\",\"media_count\":1827,\"name\":\"Tesla\",\"normal_followers_count\":24031191,\"pinned_tweet_ids_str\":[\"1936877624036307315\"],\"possibly_sensitive\":false,\"profile_banner_url\":\"https://pbs.twimg.com/profile_banners/13298072/1740542578\",\"profile_image_url_https\":\"https://pbs.twimg.com/profile_images/1337607516008501250/6Ggc4S5n_normal.png\",\"profile_interstitial_type\":\"\",\"screen_name\":\"Tesla\",\"statuses_count\":9564,\"translator_type\":\"none\",\"url\":\"https://t.co/EJC6qVEJnC\",\"verified\":false,\"verified_type\":\"Business\",\"want_retweets\":true,\"withheld_in_countries\":[]},\"professional\":{\"rest_id\":\"1590468365159636997\",\"professional_type\":\"Business\",\"category\":[]},\"tipjar_settings\":{}}}}},\"ext_media_availability\":{\"status\":\"Available\"},\"sizes\":{\"large\":{\"h\":1920,\"w\":1080,\"resize\":\"fit\"},\"medium\":{\"h\":1200,\"w\":675,\"resize\":\"fit\"},\"small\":{\"h\":680,\"w\":383,\"resize\":\"fit\"},\"thumb\":{\"h\":150,\"w\":150,\"resize\":\"crop\"}},\"original_info\":{\"height\":1920,\"width\":1080,\"focus_rects\":[]},\"video_info\":{\"aspect_ratio\":[9,16],\"duration_millis\":22200,\"variants\":[{\"content_type\":\"application/x-mpegURL\",\"url\":\"https://video.twimg.com/ext_tw_video/1909338718856441856/pu/pl/fqV0ZDQvqziAkmaB.m3u8?tag=14&v=cfc\"},{\"bitrate\":632000,\"content_type\":\"video/mp4\",\"url\":\"https://video.twimg.com/ext_tw_video/1909338718856441856/pu/vid/avc1/320x568/3l06LsVJ5P6Z7K6T.mp4?tag=14\"},{\"bitrate\":950000,\"content_type\":\"video/mp4\",\"url\":\"https://video.twimg.com/ext_tw_video/1909338718856441856/pu/vid/avc1/480x852/RnovkWI8cbUKCyuU.mp4?tag=14\"},{\"bitrate\":2176000,\"content_type\":\"video/mp4\",\"url\":\"https://video.twimg.com/ext_tw_video/1909338718856441856/pu/vid/avc1/720x1280/9vu25vVf-EO6xAOx.mp4?tag=14\"},{\"bitrate\":10368000,\"content_type\":\"video/mp4\",\"url\":\"https://video.twimg.com/ext_tw_video/1909338718856441856/pu/vid/avc1/1080x1920/rcjFMOvZmL9Wuv_S.mp4?tag=14\"}]},\"media_results\":{\"result\":{\"media_key\":\"7_1909338718856441856\"}}}],\"symbols\":[],\"timestamps\":[],\"urls\":[],\"user_mentions\":[]},\"extended_entities\":{\"media\":[{\"display_url\":\"pic.x.com/YwprA6wiIO\",\"expanded_url\":\"https://x.com/Tesla/status/1909338780890546495/video/1\",\"id_str\":\"1909338718856441856\",\"indices\":[49,72],\"media_key\":\"7_1909338718856441856\",\"media_url_https\":\"https://pbs.twimg.com/ext_tw_video_thumb/1909338718856441856/pu/img/0WATbY9e5EOa0Icf.jpg\",\"source_status_id_str\":\"1909338780890546495\",\"source_user_id_str\":\"13298072\",\"type\":\"video\",\"url\":\"https://t.co/YwprA6wiIO\",\"additional_media_info\":{\"monetizable\":false,\"source_user\":{\"user_results\":{\"result\":{\"__typename\":\"User\",\"id\":\"VXNlcjoxMzI5ODA3Mg==\",\"rest_id\":\"13298072\",\"affiliates_highlighted_label\":{},\"has_graduated_access\":true,\"is_blue_verified\":true,\"profile_image_shape\":\"Square\",\"legacy\":{\"following\":true,\"can_dm\":true,\"can_media_tag\":true,\"created_at\":\"Sun Feb 10 01:12:32 +0000 2008\",\"default_profile\":false,\"default_profile_image\":false,\"description\":\"Electric vehicles, giant batteries & solar, AI & robotics\",\"entities\":{\"description\":{\"urls\":[]},\"url\":{\"urls\":[{\"display_url\":\"tesla.com\",\"expanded_url\":\"https://www.tesla.com\",\"url\":\"https://t.co/EJC6qVEJnC\",\"indices\":[0,23]}]}},\"fast_followers_count\":0,\"favourites_count\":6921,\"followers_count\":24031191,\"friends_count\":69,\"has_custom_timelines\":true,\"is_translator\":false,\"listed_count\":27410,\"location\":\"\",\"media_count\":1827,\"name\":\"Tesla\",\"normal_followers_count\":24031191,\"pinned_tweet_ids_str\":[\"1936877624036307315\"],\"possibly_sensitive\":false,\"profile_banner_url\":\"https://pbs.twimg.com/profile_banners/13298072/1740542578\",\"profile_image_url_https\":\"https://pbs.twimg.com/profile_images/1337607516008501250/6Ggc4S5n_normal.png\",\"profile_interstitial_type\":\"\",\"screen_name\":\"Tesla\",\"statuses_count\":9564,\"translator_type\":\"none\",\"url\":\"https://t.co/EJC6qVEJnC\",\"verified\":false,\"verified_type\":\"Business\",\"want_retweets\":true,\"withheld_in_countries\":[]},\"professional\":{\"rest_id\":\"1590468365159636997\",\"professional_type\":\"Business\",\"category\":[]},\"tipjar_settings\":{}}}}},\"ext_media_availability\":{\"status\":\"Available\"},\"sizes\":{\"large\":{\"h\":1920,\"w\":1080,\"resize\":\"fit\"},\"medium\":{\"h\":1200,\"w\":675,\"resize\":\"fit\"},\"small\":{\"h\":680,\"w\":383,\"resize\":\"fit\"},\"thumb\":{\"h\":150,\"w\":150,\"resize\":\"crop\"}},\"original_info\":{\"height\":1920,\"width\":1080,\"focus_rects\":[]},\"video_info\":{\"aspect_ratio\":[9,16],\"duration_millis\":22200,\"variants\":[{\"content_type\":\"application/x-mpegURL\",\"url\":\"https://video.twimg.com/ext_tw_video/1909338718856441856/pu/pl/fqV0ZDQvqziAkmaB.m3u8?tag=14&v=cfc\"},{\"bitrate\":632000,\"content_type\":\"video/mp4\",\"url\":\"https://video.twimg.com/ext_tw_video/1909338718856441856/pu/vid/avc1/320x568/3l06LsVJ5P6Z7K6T.mp4?tag=14\"},{\"bitrate\":950000,\"content_type\":\"video/mp4\",\"url\":\"https://video.twimg.com/ext_tw_video/1909338718856441856/pu/vid/avc1/480x852/RnovkWI8cbUKCyuU.mp4?tag=14\"},{\"bitrate\":2176000,\"content_type\":\"video/mp4\",\"url\":\"https://video.twimg.com/ext_tw_video/1909338718856441856/pu/vid/avc1/720x1280/9vu25vVf-EO6xAOx.mp4?tag=14\"},{\"bitrate\":10368000,\"content_type\":\"video/mp4\",\"url\":\"https://video.twimg.com/ext_tw_video/1909338718856441856/pu/vid/avc1/1080x1920/rcjFMOvZmL9Wuv_S.mp4?tag=14\"}]},\"media_results\":{\"result\":{\"media_key\":\"7_1909338718856441856\"}}}]},\"favorite_count\":7825,\"favorited\":false,\"full_text\":\"This is how easy it is to enable FSD Supervised\\n\\nhttps://t.co/YwprA6wiIO\",\"is_quote_status\":false,\"lang\":\"en\",\"possibly_sensitive\":false,\"possibly_sensitive_editable\":true,\"quote_count\":156,\"reply_count\":630,\"retweet_count\":1437,\"retweeted\":false,\"user_id_str\":\"13298072\",\"id_str\":\"1943194296489783462\"}}},\"legacy\":{\"bookmark_count\":2871,\"bookmarked\":false,\"created_at\":\"Thu Jul 10 08:10:17 +0000 2025\",\"conversation_id_str\":\"1943221221119979928\",\"display_text_range\":[0,47],\"entities\":{\"hashtags\":[],\"symbols\":[],\"timestamps\":[],\"urls\":[],\"user_mentions\":[{\"id_str\":\"13298072\",\"name\":\"Tesla\",\"screen_name\":\"Tesla\",\"indices\":[40,46]}]},\"favorite_count\":72190,\"favorited\":false,\"full_text\":\"Super easy to turn on self-driving in a @Tesla!\",\"is_quote_status\":true,\"lang\":\"en\",\"quote_count\":322,\"quoted_status_id_str\":\"1943194296489783462\",\"quoted_status_permalink\":{\"url\":\"https://t.co/0id8hsFUUQ\",\"expanded\":\"https://twitter.com/tesla/status/1943194296489783462\",\"display\":\"x.com/tesla/status/1…\"},\"reply_count\":5196,\"retweet_count\":10206,\"retweeted\":false,\"user_id_str\":\"44196397\",\"id_str\":\"1943221221119979928\"}}]}"
      }
    }
  },
  {
    "kind": "message",
    "messageId": "d1e66df2-bcf1-44e0-8df7-be2632646b87",
    "role": "agent",
    "parts": [],
    "contextId": "588a5425-5a2b-4ebb-be7b-7f8790c56981",
    "taskId": null,
    "referenceTaskIds": [],
    "extensions": [],
    "metadata": {
      "type": "text_message_start",
      "data": {
        "message_id": "d1e66df2-bcf1-44e0-8df7-be2632646b87",
        "role": "assistant"
      }
    }
  },
  {
    "kind": "message",
    "messageId": "43979862-1585-467e-ab7e-532209f8a9ee",
    "role": "agent",
    "parts": [],
    "contextId": "588a5425-5a2b-4ebb-be7b-7f8790c56981",
    "taskId": null,
    "referenceTaskIds": [],
    "extensions": [],
    "metadata": {
      "type": "run_finished",
      "data": {}
    }
  }
];
const Chat: React.FC<ChatProps> = ({ selectedThreadId, agent, onThreadUpdate }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    refreshMessages();
  }, [selectedThreadId]);

  // Use the new hooks
  const {
    messages,
    loading,
    refreshMessages,
    error,
    isStreaming,
    sendMessageStream,
  } = useChat({ agentId: agent.id, contextId: selectedThreadId });

  // Helper function to extract text from message parts
  const extractTextFromMessage = (message: any): string => {
    if (!message?.parts || !Array.isArray(message.parts)) {
      return '';
    }

    return message.parts
      .filter((part: any) => part?.kind === 'text' && part?.text)
      .map((part: any) => part.text)
      .join('') || '';
  };

  // Helper function to check if message has valid content
  const hasValidContent = (message: any): boolean => {
    if (!message) return false;

    // Check if message has text parts with content
    const textContent = extractTextFromMessage(message);
    if (textContent.trim()) return true;

    // Check if tool_call_start
    if (message.metadata?.type === 'tool_call_start') {
      console.log('tool_call_start: true', message);
      return true;
    }

    return false;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (selectedThreadId && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, selectedThreadId]);

  // Load thread messages when thread changes
  useEffect(() => {
    // Only refresh if the thread id actually changes (not during streaming)
    if (selectedThreadId) {
      refreshMessages();
    }
    // Do NOT refresh on every message or streaming update
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedThreadId]);


  const sendMessage = async () => {
    if (!input.trim() || loading || isStreaming) return;

    const messageText = input.trim();
    setInput('');

    try {
      await sendMessageStream(messageText, {
        acceptedOutputModes: ['text/plain'],
        blocking: false
      });

      // Update thread after successful message
      onThreadUpdate(selectedThreadId);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Re-add the input text if sending failed
      setInput(messageText);
    }
  };
  const toolCallEventTypes = [
    'tool_call_start',
    'tool_call_args',
    'tool_call_result',
    'tool_call_end',
  ];


  const buildToolCallStatus = (messages: any[]): Record<string, ToolCallState> => {
    const toolCallStatus: Record<string, ToolCallState> = {};

    messages.forEach((message) => {
      const meta = message.metadata;
      if (
        meta &&
        toolCallEventTypes.includes(String(meta.type)) &&
        meta.data &&
        typeof meta.data === 'object' &&
        'tool_call_id' in meta.data
      ) {
        const data = meta.data as any;
        const tool_call_id = data.tool_call_id;
        if (!toolCallStatus[tool_call_id]) {
          toolCallStatus[tool_call_id] = {
            tool_call_id,
            tool_name: undefined,
            args: '',
            result: undefined,
            running: true,
          };
        }
        if (meta.type === 'tool_call_start' && typeof data.tool_call_name === 'string') {
          toolCallStatus[tool_call_id].tool_name = data.tool_call_name;
          toolCallStatus[tool_call_id].running = true;
        }
        if (meta.type === 'tool_call_args' && typeof data.delta === 'string') {
          toolCallStatus[tool_call_id].args += data.delta;
        }
        if (meta.type === 'tool_call_result' && typeof data.result === 'string') {
          toolCallStatus[tool_call_id].running = false;
          toolCallStatus[tool_call_id].result = data.result;
        }
      }
    });

    return toolCallStatus;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow h-full flex flex-col">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-500">with {agent.name}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {(messages.length === 0 && !loading && !isStreaming) && (
          <div className="flex flex-col items-center justify-center h-full py-8">
            <MessageRenderer content={''} className="" />
            <div className="flex flex-col items-center mt-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8s-9-3.582-9-8 4.03-8 9-8 9 3.582 9 8z" /></svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Start a new conversation</h3>
              <p className="text-gray-500 text-sm">Type a message to begin chatting with {agent.name}.</p>
            </div>
          </div>
        )}


        {(() => {
          // 1. Build toolCallStatus and toolCallNameMap in a single pass
          const toolCallStatus = buildToolCallStatus(messages);
          // 2. Render messages, only render ToolCallRenderer for first occurrence of each tool_call_id
          const renderedToolCalls = new Set<string>();
          return messages.filter(hasValidContent).map((message: any, index: number) => {
            const meta = message.metadata;
            let tool_call_id: string | undefined;
            if (
              meta &&
              toolCallEventTypes.includes(String(meta.type)) &&
              meta.data &&
              typeof meta.data === 'object' &&
              'tool_call_id' in meta.data
            ) {
              tool_call_id = (meta.data as any).tool_call_id;
            }
            if (tool_call_id && !renderedToolCalls.has(tool_call_id)) {
              renderedToolCalls.add(tool_call_id);
              return (
                <div key={message.messageId || `msg-${index}`} className="flex justify-start">
                  <ToolCallRenderer toolCall={toolCallStatus[tool_call_id]} />
                </div>
              );
            }
            // Normal message rendering
            const messageText = extractTextFromMessage(message);
            const isError = messageText.startsWith('Error:') || (messageText.includes('error') && message.role === 'agent');
            return (
              <div
                key={message.messageId || `msg-${index}`}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : isError
                      ? 'bg-red-100 text-red-800 border border-red-300'
                      : 'bg-gray-100 text-gray-900'
                    }`}
                >
                  <div className="flex items-start space-x-2">
                    {message.role === 'agent' && (
                      <Bot className={`h-4 w-4 mt-0.5 flex-shrink-0 ${isError ? 'text-red-600' : ''}`} />
                    )}
                    {message.role === 'user' && (
                      <User className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <MessageRenderer
                        content={messageText}
                        className={isError ? 'font-semibold' : ''}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          });
        })()}



        {loading && !isStreaming && (
          <div className="flex justify-start">
            <div className="flex items-center space-x-2 text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-start">
            <div className="max-w-[70%] rounded-lg px-4 py-2 bg-red-100 text-red-800 border border-red-300">
              <div className="flex items-start space-x-2">
                <Bot className="h-4 w-4 mt-0.5 flex-shrink-0 text-red-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Error: {error.message}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex space-x-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Message ${agent.name}...`}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={1}
            disabled={loading || isStreaming}
          />
          {isStreaming ? (
            <button
              onClick={() => {
                if (abortControllerRef.current) {
                  abortControllerRef.current.abort();
                }
              }}
              className="bg-orange-100 text-orange-500 rounded-lg px-4 py-2 hover:bg-orange-200 flex items-center justify-center"
              title="Stop streaming"
            >
              <Square className="h-5 w-5 animate-pulse" />
            </button>
          ) : (
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;