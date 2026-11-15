import { SpeechProvider } from '../../features/speech/SpeechProvider'
import { LanguageProvider } from '../i18n/LanguageProvider'
import { PreferencesProvider } from '../preferences/PreferencesProvider'
import { AppShell } from '../layout/AppShell'
import { TextSizeProvider } from '../textsize/TextSizeProvider'
import { AppStateProvider } from './AppStateProvider'
import { DataRepositoryProvider } from './DataRepositoryProvider'

export function AppProviders() {
  return (
    <DataRepositoryProvider>
      <AppStateProvider>
        <LanguageProvider>
          <TextSizeProvider>
            <PreferencesProvider>
              <SpeechProvider>
                <AppShell />
              </SpeechProvider>
            </PreferencesProvider>
          </TextSizeProvider>
        </LanguageProvider>
      </AppStateProvider>
    </DataRepositoryProvider>
  )
}
