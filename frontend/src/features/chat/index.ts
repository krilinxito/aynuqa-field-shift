import {
  ChatComposer,
  ChatDictateButton,
  ChatMessages,
  ChatOfflineNotice,
  ChatSuggestions,
} from './ChatParts'
import { ChatProvider } from './ChatProvider'

/** Chat con el asistente, armado por composición. */
export const Chat = {
  Provider: ChatProvider,
  OfflineNotice: ChatOfflineNotice,
  Suggestions: ChatSuggestions,
  Messages: ChatMessages,
  Composer: ChatComposer,
  DictateButton: ChatDictateButton,
}
