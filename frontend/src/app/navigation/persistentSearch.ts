import { isSectorId } from '../../data/repositories/inputValidation'

export function getPersistentSearch(search: string): string {
  const source = new URLSearchParams(search)
  const persistent = new URLSearchParams()
  const sector = source.get('sector')
  const scenario = source.get('scenario')

  if (isSectorId(sector)) {
    persistent.set('sector', sector)
  }

  if (scenario === 'nino' || scenario === 'normal') {
    persistent.set('scenario', scenario)
  }

  const result = persistent.toString()
  return result ? `?${result}` : ''
}
