import '../../config'
import Providers from '@fonos/providers'
import { CLIError } from '@oclif/errors'
import { Command, flags } from '@oclif/command'
import inquirer from 'inquirer'
import { View } from '@fonos/core/src/server/protos/common_pb'
import { Provider } from '@fonos/core/src/server/protos/providers_pb'
const Table = require('easy-table')
const moment = require('moment')

export default class ListCommand extends Command {
  static description = `list registered providers
  ...
  List the registered providers
  `
  static flags = {
    size: flags.integer({
      char: 's',
      default: 25,
      description: 'provider of result per page'
    })
  }

  static aliases = ['providers:ls']

  async run () {
    const { flags } = this.parse(ListCommand)
    try {
      const providers = new Providers()
      let firstBatch = true
      let pageToken = '1'
      const pageSize = flags.size
      const view: View = View.BASIC
      while (true) {
        // Get a list
        const result = await providers.listProviders({
          pageSize,
          pageToken,
          view
        })
        const list = result.getProvidersList()
        pageToken = result.getNextPageToken()

        // Dont ask this if is the first time or empty data
        if (list.length > 0 && !firstBatch) {
          const answer: any = await inquirer.prompt([
            { name: 'q', message: 'More', type: 'confirm' }
          ])
          if (!answer.q) break
        }

        const t = new Table()

        list.forEach((provider: Provider) => {
          t.cell('Ref', provider.getRef())
          t.cell('Name', provider.getName())
          t.cell('Username', provider.getUsername() || '(static)')
          t.cell('Host', provider.getHost())
          t.cell('Transport', provider.getTransport())
          t.cell('Expires', provider.getExpires())
          t.cell('Created', moment(provider.getCreateTime()).fromNow())
          t.cell('Updated', moment(provider.getCreateTime()).fromNow())
          t.newRow()
        })

        if (list.length > 0) console.log(t.toString())

        firstBatch = false
        if (!pageToken) break
      }
    } catch (e) {
      throw new CLIError(e.message)
    }
  }
}
