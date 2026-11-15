import backtestFixture from '../../../../contracts/examples/api/backtest_2015-16.json'
import chatRequestFixture from '../../../../contracts/examples/api/chat_request.json'
import chatResponseFixture from '../../../../contracts/examples/api/chat_response.json'
import errorFixture from '../../../../contracts/examples/api/error.json'
import healthFixture from '../../../../contracts/examples/api/health.json'
import historyFixture from '../../../../contracts/examples/api/history_S1.json'
import sectorsNinoFixture from '../../../../contracts/examples/api/sectors_nino.json'
import sectorsNormalFixture from '../../../../contracts/examples/api/sectors_normal.json'
import sensorsFixture from '../../../../contracts/examples/api/sensors_S1.json'
import twinPrecedentFixture from '../../../../contracts/examples/api/twin_precedent.json'

export const contractFixtures = {
  sectorsNino: sectorsNinoFixture,
  sectorsNormal: sectorsNormalFixture,
  historyS1: historyFixture,
  sensorsS1: sensorsFixture,
  backtest2015: backtestFixture,
  chatRequest: chatRequestFixture,
  chatResponse: chatResponseFixture,
  health: healthFixture,
  apiError: errorFixture,
  twinPrecedent: twinPrecedentFixture,
} as const
